import requests
from bs4 import BeautifulSoup
import sqlite3

conn = sqlite3.connect("../data/games.db", check_same_thread=False)
curs = conn.cursor()

base_url = "https://www.vgtime.com/game/release.jhtml"
headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.164 Safari/537.36"
}

for year in [2021, 2022]:
    for month in range(1, 13):
        str_month = str(month)
        if len(str_month) == 1:
            str_month = "0" + str_month
        params = {
            "platform": "0",
            "pubtime": f"{year}-{str_month}",
        }
        res = requests.get(base_url, params=params, headers=headers)
        html = res.text
        url = res.url
        soup = BeautifulSoup(html, "html.parser")
        game_blocks: list[BeautifulSoup] = soup.select(".game")
        game_block: BeautifulSoup
        for game_block in game_blocks:
            game_name: str = game_block.select_one(".info_box a h2").text.replace(
                "'", "''"
            )
            game_aliases: str = game_block.select_one(".info_box .old_name").text.replace(
                "'", "''"
            )
            game_desc_box = game_block.select_one(".descri_box")
            game_platforms = str(
                [box.text.strip() for box in game_desc_box.select(".platform_detail")]
            ).replace("'", "''")
            game_genes = str(
                [box.text for box in game_block.select(".game_gene span")]
            ).replace("'", "''")
            game_release_date = game_block.select(".descri_box span")[-1].text
            query = f"""
                INSERT INTO game(name, aliases, platforms, genes, release_date)
                VALUES('{game_name}', '{game_aliases}', '{game_platforms}', '{game_genes}', '{game_release_date}')
                """
            print(query)
            curs.execute(query)

conn.commit()
