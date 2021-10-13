import json
import sqlite3
from datetime import datetime
from random import choice
from typing import Optional

import pandas as pd
from fastapi import FastAPI
from fuzzywuzzy.fuzz import partial_ratio

from football import get_football_info
from idioms.core import is_idiom, next_idioms_solitaire

with open("data/quotes.json", encoding="utf-8") as f:
    quotes: dict[str, list[str]] = json.load(f)


app = FastAPI()


@app.get("/quotes")
def get_quote(name: str, query: Optional[str] = None) -> str:
    if not query:
        quote = choice(quotes.get(name))
        if quote is None:
            return ""
    else:
        his_quotes = quotes.get(name)
        if his_quotes is None:
            return ""
        similarities = [partial_ratio(query, quote) for quote in his_quotes]
        df = pd.DataFrame({"quotes": his_quotes, "similarities": similarities})
        df = df[df["similarities"] == df["similarities"].max()]
        quote = choice(df["quotes"].to_list())
    return f"{quote}#{name}"


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
