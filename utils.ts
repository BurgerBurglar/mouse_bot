import { Message, log, Contact } from "wechaty"
import { parseStringPromise } from 'xml2js'

type ParsedMessage = {
    quoteFrom: string | undefined, quoteText: string | undefined, text: string,
}

const getTextFromXML = async (text: string): Promise<string> => {
    try {
        const parsedText = await parseStringPromise(text)
        return parsedText["msg"]["appmsg"][0]["title"][0]
    } catch (e) {
        return text
    }
}

const parseMessageText = async (msg: Message): Promise<ParsedMessage | null> => {
    if (msg.type() !== Message.Type.Text) return null
    const raw = msg.text()
    const delimiter = "\n- - - - - - - - - - - - - - - -\n"
    if (!raw.includes(delimiter)) {
        return {
            quoteFrom: undefined,
            quoteText: undefined,
            text: raw,
        }
    }
    const textBreak: Array<string> = raw.trim().split(delimiter)
    const quote = textBreak[0] as string
    const text = textBreak[1] as string
    const quoteFrom = quote.split("：")[0]?.substring(1) as string
    let quoteText = quote.split("：")[1]!.slice(0, -1) as string
    quoteText = await getTextFromXML(quoteText)
    return { quoteFrom, quoteText, text }
}

const getMessageText = (msg: Message, lower: boolean = true): string | null => {
    if (msg.type() !== Message.Type.Text) return null
    let text: string | undefined | null = msg
        .text()
        .trim()
        .split("\n- - - - - - - - - - - - - - - -\n")
        .slice(-1)[0]  // remove quotes
    if (!text) return null
    if (lower)
        text = text.toLowerCase()
    return text
}

const getMessageTextWithoutMentionsTags = (msg: Message, lower: boolean = true) => {
    const text = getMessageText(msg, lower)
    if (!text) return text
    return text.replace(/(@|#)\p{Letter}+/gu, "").trim()
}

const removeKeyword = (msg: Message, keyword: string, removeMentionsAndTags: boolean = false, lower: boolean = true): string | null => {
    let text: string | null
    if (removeMentionsAndTags) {
        text = getMessageTextWithoutMentionsTags(msg, lower)
    }
    else {
        text = getMessageText(msg, lower)
    }
    if (!text) return text
    if (!text.includes(keyword)) {
        return null
    }
    return text.replace(keyword, "").trim()
}

const sayAndLogMessage = (msg: Message, content: any) => {
    if (msg.room() === null && msg.self()) {
        const toContact = msg.to() as Contact
        toContact.say(content)
    } else {
        msg.say(content)
    }
    const msgStrList = [
        'Message',
        `#${typeof content}`,
        '[',
        '🗣',
        "我",
        msg.room() ? '@👥' + msg.room() : '',
        ']',
    ]
    if (typeof content === "string") {
        msgStrList.push(content)
    }
    log.info(msgStrList.join(''))
}

export { parseMessageText, getMessageText, getMessageTextWithoutMentionsTags, removeKeyword, sayAndLogMessage as say }