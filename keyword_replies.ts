import axios from "axios"
import { readFileSync, promises } from "fs"
import _, { Dictionary, List } from "lodash";
import { Message } from "wechaty"
import { getMessageText } from "./utils";
import { bot, doNotReply } from ".";

const keywordMapper: { [index: string]: string | string[] } =
    JSON.parse(readFileSync("data/keywords.json", "utf-8"))

const zshQuotes: string[][] = JSON.parse(readFileSync("data/zsh.json", "utf-8"))

const getKeywordReply = async (msg: Message) => {
    let text: string | null = getMessageText(msg)
    if (!text) return
    else text = text.toLowerCase()
    if (text.includes("\" 拍了拍我")) {
        return getTickleReply()
    }
    const query: string[] | null = text.match(/#\S+/)
    const roomTopic = await msg.room()?.topic()
    if (query && roomTopic && ["索尼弟子说真相5", "test"].includes(roomTopic)) {
        return getEldenRingResponse(query[0])
    }
    if (text.includes("豪哥语录")) {
        return await getZshQuote()
    }
    if (text.includes("艾特我")) {
        return await getMentionMeResponse(msg)
    }
    if (text.includes("佛经选读")) {
        return await getBuddhismQuote()
    }
    if (text.includes("足球预告")) {
        const result: string | null = await getFootballFixtures(msg, false)
        if (result) return `${result}\n#足球机器人`
    }
    if (text.includes("足球赔率")) {
        const result: string | null = await getFootballFixtures(msg, true)
        if (result) return `${result}\n#足球机器人`
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

const getEldenRingResponse = async (text: string | undefined) => {
    if (!text) return "我没听说这个游戏，再试试看？ #游戏计时机器人"
    const q: string = text.substring(1)  // #EldenRing -> EldenRing
    const result = await axios.get<Dictionary<string>>(encodeURI(`http://localhost:8000/games/${q}`))
        .then(res => res.data)
        .catch(() => null)

    if (!result) return "我没听说这个游戏，再试试看？ #游戏计时机器人"
    let output: string[] = []
    for (let gameName of Object.keys(result)) {
        const releaseDate: string | undefined = result[gameName]
        if (releaseDate) {
            const days: number = getDaysUntil(new Date(`${releaseDate}T00:00+08:00`))
            output.push(`距离「${gameName}」发售还有${days}天`)
        }
    }
    if (!output.length) output = ["我没听说这个游戏，再试试看？"]
    return `${output.join("\n")} #游戏计时机器人`
}
const getContentsFromFile = async (filename: string) => {
    const lines = await promises.readFile(filename, "utf-8")
        .then(res => res.split("\n"))
        .then(res => res.filter(
            (line: string) => line.trim() && !line.includes("#")
        ))
    return lines.slice(1,)
}
const getContentsFromFolder = async (folderName: string, suffix: string = "md") => {
    let filenames: string[] = await promises.readdir(folderName);
    filenames = filenames
        .filter(filename => filename.endsWith(`.${suffix}`))
        .map(filename => `${folderName}/${filename}`)
    const contents: string[][] = await Promise.all(filenames.map(getContentsFromFile))
    const flatContents: string[] = ([] as string[]).concat(...contents);
    return flatContents
}

const getBuddhismQuote = async () => {
    const quotes: string[] = await getContentsFromFolder("data/buddhism/")
    return _.sample(quotes) + " #佛经选读"
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

const getFootballFixtures = async (msg: Message, includeOdds: boolean = false) => {
    let text: string | null = getMessageText(msg)
    if (!text) return
    text = text.toLowerCase()
    const words = text.split(" ")
    let league: string | null | undefined = ""
    if (words.length > 1) {
        league = words[1]
    }
    const output = await axios.get(
        "http://localhost:8000/leagues/",
        { params: { league: league, include_odds: includeOdds } }
    )
        .then(res => res.data)
        .catch(() => null)
    return output
}

const getNonsenseReply = async (msg: Message) => {
    let text: string | null = getMessageText(msg)
    if (!text) return
    else text = text.toLowerCase()
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
        const newKeyword = results.slice(1, -1)
        if (!blockedKeywords.includes(newKeyword)) {
            results = keywordMapper[newKeyword]
        } else {
            results = null
        }
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