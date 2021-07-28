from china_idiom import is_idiom, next_idioms_solitaire
from fastapi import FastAPI


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


app = FastAPI()


@app.get("/idioms/{idiom}")
async def idioms_solitaire(idiom):
    return {"idiom": idiom, "next": get_idiom_solitaire(idiom)}


import sys

print(get_idiom_solitaire(sys.argv[1]))
