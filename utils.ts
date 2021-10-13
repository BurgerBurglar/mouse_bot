import { Message } from "wechaty"

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

export { getMessageText, getMessageTextWithoutMentionsTags, removeKeyword }