import axios from "axios"
import { Message } from "wechaty"
import { parseMessageText, removeKeyword, say } from "./utils"

type TranslationResponse = {
    toLanguageName: string | null,
    translation: string,
}
const translate = async (text: string, language: string): Promise<TranslationResponse | Error> => {
    const url = "http://localhost:8000/translate"
    try {
        const translationResponse: TranslationResponse = (await axios.get(url, { params: { text, language } })).data
        return translationResponse
    } catch (e) {
        return new Error()
    }
}

const getTranslation = async (msg: Message): Promise<boolean> => {
    const parsedMesssage = await parseMessageText(msg)
    if (parsedMesssage === null) return false
    const { quoteText } = parsedMesssage
    if (quoteText === undefined) return false
    const language = removeKeyword(msg, "翻译成") as string
    if (!language) return false

    const endTagPattern = /#(\p{Letter})+/u
    const matches = quoteText.match(endTagPattern)
    const endTag: string | undefined = matches !== null ? matches[0] : ""
    const toTranslate = quoteText.replace(endTagPattern, "")

    const translationResponse = await translate(toTranslate, language)
    if (translationResponse instanceof Error) return false
    const { translation, toLanguageName } = translationResponse
    const reply = `${translation + endTag}\n#${toLanguageName === null ? "" : toLanguageName}翻译机器人`

    console.log({ parsedMesssage, quoteText, language, matches, endTag, toTranslate, translationResponse, reply })
    say(msg, reply)
    return true
}

export { getTranslation }