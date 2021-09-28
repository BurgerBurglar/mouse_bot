from china_idiom import is_idiom, next_idioms_solitaire
from fastapi import FastAPI
import sqlite3
from fuzzywuzzy.fuzz import partial_ratio
import pandas as pd
from datetime import datetime
from football import get_football_info

app = FastAPI()


@app.get("/games/{q}")
def find_closest_game(q):
    q = q.lower()

    conn = sqlite3.connect("data/games.db", check_same_thread=False)
    curs = conn.cursor()
    sql = f"""
        SELECT name, aliases, release_date
        FROM game
        """
    df_games = pd.read_sql_query(sql, conn)
    df_games = df_games[df_games["release_date"].str.len() == 10]  # with date
    df_games["release_timestamp"] = pd.to_datetime(
        df_games["release_date"],
        errors="coerce",
    )
    df_games = df_games[df_games["release_timestamp"] > datetime.now()]
    df_games["name_similarity"] = [
        partial_ratio(q, game_name.lower()) for game_name in df_games["name"]
    ]
    df_games["alias_similarity"] = [
        partial_ratio(q, game_alias.lower()) for game_alias in df_games["aliases"]
    ]

    max_similarity = max(
        df_games["name_similarity"].max(), df_games["alias_similarity"].max()
    )
    df_games["name_similarity_normalized"] = (
        df_games["name_similarity"] / max_similarity * 100
    )
    df_games["alias_similarity_normalized"] = (
        df_games["alias_similarity"] / max_similarity * 100
    )

    df_games = df_games[
        (df_games["name_similarity_normalized"] > 90)
        | (df_games["alias_similarity_normalized"] > 90)
    ].head(3)
    df_games_first_release = (
        df_games[["name", "release_date"]]
        .groupby("name")[["release_date"]]
        .min()
        .sort_values("release_date")
    )
    games = {}
    for name, row in df_games_first_release.iterrows():
        games[name] = row["release_date"]
    return games


def get_idiom_solitaire(input: str) -> str:
    if not is_idiom(input):
        return
    outputs = next_idioms_solitaire(input, heteronym=False)
    if not outputs:
        outputs = next_idioms_solitaire(input, heteronym=True)
    if not outputs:
        return "这个成语机器人不会接龙哦"
    else:
        return outputs[0]


@app.get("/idioms/{idiom}")
async def idioms_solitaire(idiom):
    return {"idiom": idiom, "next": get_idiom_solitaire(idiom)}


@app.get("/leagues/")
async def get_league_info(league: str, include_odds: bool = False):
    return get_football_info(league, include_odds)
