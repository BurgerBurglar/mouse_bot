import axios from "axios"
import { readFileSync } from "fs"
import _ from "lodash";
import { Message } from "wechaty"
import { getMessageText } from "./utils";
import { bot, doNotReply } from ".";

const keywordMapper: { [index: string]: string | string[] } =
    JSON.parse(readFileSync("data/keywords.json", "utf-8"))

const zshQuotes: string[][] = JSON.parse(readFileSync("data/zsh.json", "utf-8"))

const getKeywordReply = async (msg: Message) => {
    const text: string | null = getMessageText(msg)
    if (!text) return
    if (text.includes("\" 拍了拍我")) {
        return getTickleReply()
    }
    if (text.match(/#(老头环|艾尔登法环|埃尔登法环|elden\s*ring)/)) {
        return getEldenRingResponse()
    }
    if (text.includes("豪哥语录")) {
        return await getZshQuote()
    }
    if (text.includes("艾特我")) {
        return await getMentionMeResponse(msg)
    }

    const nonsenseReply = await getNonsenseReply(msg)

    if (nonsenseReply) return nonsenseReply
    if (text.length == 4) {
        const idiom: string | null = await getIdiomSolitare(text)
        if (idiom) return idiom
    }
    return
}

const _mentionSelf = async (msg: Message) => {
    const text = msg.text()
    const room = msg.room()
    if (!room || !text.includes("@")) return false
    const userSelf = bot.userSelf()
    await room.sync()
    const selfAlias = await room.alias(userSelf) || userSelf.name()

    return text.includes(`@${selfAlias}`)
}

const _getBotChatReply = async (input: string) => {
    input = input
        .split("田鼠").join("菲菲")
        .split(/@\S+/).join("")  // remove mentions
    if (!input.replace(/\s/g, '').length) {
        input = "你好"
    }
    const reply: string = await axios
        .get(encodeURI(`https://api.qingyunke.com/api.php?key=free&appid=0&msg=${input}`))
        .then(res => res.data.content)
        .then(res => res.split("菲菲").join("田鼠"))
        .then(res => res.split("姐").join("弟弟"))
        .then(res => res.split("好女人就是").join("好男人就是"))
        .then(res => res.split(/\{face\:\d+\}/).join(""))
    return `${reply} #田鼠机器人`
}

const getZshQuote = async () => _.sample(zshQuotes)!.join("\n") + " #豪哥语录"


const getTickleReply = () => {
    return "拍我干嘛？ #拍拍机器人"
}

const getDaysUntil = (releaseTime: Date) => {
    const now = Date.now()
    return Math.floor((+releaseTime - now) / (1000 * 60 * 60 * 24))
}

const getEldenRingResponse = () => {
    const days: number = getDaysUntil(new Date("2022-01-21T00:00+08:00"))
    return `距离艾尔登法环发售还有${days}天 #田鼠机器人`
}

const getIdiomSolitare = async (input: string) => {
    const output = await axios.get(encodeURI(`http://localhost:8000/idioms/${input}`))
        .then(res => res.data.next)
        .catch(() => null)
    if (output) {
        return output + " #成语接龙机器人"
    } else {
        return null
    }
}

const getNonsenseReply = async (msg: Message) => {
    const text: string = msg.text()
    let blockedKeywords: string[] = []
    if (msg.room()) {
        const roomTopic: string | null = await msg.room()!.topic()
        if (doNotReply["nonsenses"]![roomTopic] !== undefined) {
            blockedKeywords = doNotReply["nonsenses"][roomTopic]
        }
    }
    let results: any = null
    for (let keyword in keywordMapper) {
        if (!blockedKeywords.includes(keyword) && text.includes(keyword)) {
            results = keywordMapper[keyword]
            break
        }
    }
    if (typeof results == "string" && results.startsWith("%") && results.endsWith("%")) {
        results = keywordMapper[results.slice(1, -1)]
    }
    if (results) {
        return `${_.sample(results)} #田鼠机器人`
    }
    return null
}

const getMentionMeResponse = async (msg: Message) => {
    const room = msg.room()
    if (room) {
        const talker = msg.talker()
        await room.sync()
        const alias = await room.alias(talker) || talker.name()
        return `@${alias} #艾特机器人`
    }
    return
}

export { getKeywordReply }