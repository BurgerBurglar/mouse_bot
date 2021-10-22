import pandas as pd
from fuzzywuzzy.fuzz import ratio as similarity
import requests
from html import unescape
import os

df = pd.read_csv("data/languages.csv")
key = os.environ.get("TRANSLATION_KEY")
url = "https://www.googleapis.com/language/translate/v2"


def find_closest_language_code(language_name: str) -> str:
    if language_name != "中文":
        language_name = language_name.rstrip("文") + "语"
    df["similarity"] = df["name"].apply(lambda name: similarity(name, language_name))
    closest_row = df.sort_values(
        "similarity",
        ascending=False,
        ignore_index=True,
    ).loc[0]
    result = closest_row["code"], closest_row["name"]
    return result


def translate(text: str, language: str) -> dict:
    to_language_code, to_language_name = find_closest_language_code(language)

    params = {
        "key": key,
        "q": text,
        "target": to_language_code,
        "mimeType": "text/plain",
    }
    try:
        request = requests.get(url, params=params, timeout=5)
        response = request.json()
        result = response["data"]["translations"][0]["translatedText"]
        result = unescape(result)
        result = {
            "toLanguageName": to_language_name,
            "translation": result,
        }
        return result
    except requests.exceptions.RequestException as e:
        print(e.response)
        return {
            "toLanguageName": None,
            "translation": "机器人掉线了，不会翻译哦。#翻译机器人",
        }
    except Exception as e:
        print(str(e))
        return {
            "toLanguageName": None,
            "translation": "机器人出了点小故障，不会翻译哦。#翻译机器人",
        }


print(translate("You're a dumbass", "西语"))
