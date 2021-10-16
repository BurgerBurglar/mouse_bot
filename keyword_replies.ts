import axios from "axios"
import { readFileSync, promises } from "fs"
import _, { Dictionary, List } from "lodash";
import { Message } from "wechaty"
import { say, getMessageText, getMessageTextWithoutMentionsTags, removeKeyword } from "./utils";
import { doNotReply } from ".";
import { weatherForecast } from "./weather";

const keywordMapper: { [index: string]: string | string[] } =
    JSON.parse(readFileSync("data/keywords.json", "utf-8"))

const quoteNames: string[] = Object.keys(JSON.parse(readFileSync("data/quotes.json", "utf-8")))

const getKeywordReply = async (msg: Message) => {
    if (msg.self()) return false
    if (getTickleReply(msg)) return true
    if (await weatherForecast(msg)) return
    if (await getGameCountDown(msg)) return true
    if (await getQuote(msg)) return true
    if (await getMentionMeResponse(msg)) return true
    if (await getBuddhismQuote(msg)) return true
    if (await getFootballFixtures(msg)) return true
    if (await getIdiomSolitare(msg)) return true
    if (await getNonsenseReply(msg)) return true
    return false
}


const getQuote = async (msg: Message) => {
    const text = getMessageTextWithoutMentionsTags(msg)
    if (!text) return false
    if (text.includes("语录查询")) {
        const reply = `支持查询：${quoteNames.reverse().join("、")}。#语录机器人`
        say(msg, reply)
        return true
    }
    for (let name of quoteNames) {
        if (text.includes(name)) {
            const query: string | null = removeKeyword(msg, name, true) // remove tags and mentions
            try {
                const quote = (await axios.get("http://localhost:8000/quotes", { params: { name, query } })).data
                say(msg, quote)
            } catch (e) {
                say(msg, "机器人掉线了，我也不知道他说过什么。#语录机器人")
            }
            return true
        }
    }
    return false
}

const getTickleReply = (msg: Message) => {
    if (msg.type() == Message.Type.Recalled && msg.text().includes(" 拍了拍我")) {
        say(msg, "拍我干嘛？ #拍拍机器人")
        return true
    }
    return false
}

const getDaysUntil = (releaseTime: Date) => {
    const now = Date.now()
    return Math.floor((+releaseTime - now) / (1000 * 60 * 60 * 24))
}
const getGameCountDown = async (msg: Message) => {
    const gameName = removeKeyword(msg, "倒计时")
    if (!gameName) return false
    try {
        const result = (await axios.get<Dictionary<string>>(encodeURI(`http://localhost:8000/games/${gameName}`))).data
        if (!result) {
            say(msg, "机器人没听说这个游戏，再试试看？ #游戏计时机器人")
            return true
        }
        let output: string[] = []
        for (let gameName of Object.keys(result)) {
            const releaseDate: string | undefined = result[gameName]
            if (releaseDate) {
                const days: number = getDaysUntil(new Date(`${releaseDate}T00:00+08:00`))
                output.push(`距离「${gameName}」发售还有${days}天`)
            }
        }
        if (!output.length) output = ["我没听说这个游戏，再试试看？"]
        say(msg, `${output.join("\n")} #游戏计时机器人`)
    } catch (e) {
        say(msg, `机器人掉线了，不知道${gameName}什么时候发售哦。`)
    } finally {
        return true
    }
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
const getBuddhismQuote = async (msg: Message) => {
    const text = getMessageText(msg)
    if (!text || !text.includes("佛经选读")) return false
    const quotes: string[] = await getContentsFromFolder("data/buddhism/")
    say(msg, _.sample(quotes) + " #佛经选读")
    return true
}

const getIdiomSolitare = async (msg: Message) => {
    const text = getMessageTextWithoutMentionsTags(msg)
    if (!text || text.length !== 4) return false
    try {
        const output = (await axios.get(encodeURI(`http://localhost:8000/idioms/${text}`))).data.next
        if (!output) return false
        say(msg, output + " #成语接龙机器人")
        return true
    } catch (e) {
        return false
    }
}

const getFootballFixtures = async (msg: Message) => {
    let include_odds: boolean = true
    let league = removeKeyword(msg, "足球赔率", true)
    if (!league) {
        league = removeKeyword(msg, "足球预告", true)
        if (!league) return false
        include_odds = false
    }
    league = league.toLowerCase()
    try {
        const output = (await axios.get("http://localhost:8000/leagues/", { params: { league, include_odds } })).data
        say(msg, `${output}\n#足球机器人`)
        return true
    } catch (e) {
        return false
    }
}

const getNonsenseReply = async (msg: Message) => {
    let text: string | null = getMessageText(msg, false)
    if (!text) return false
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
    if (!results) return false
    say(msg, `${_.sample(results)} #田鼠机器人`)
    return true
}

const getMentionMeResponse = async (msg: Message) => {
    const text = getMessageText(msg)
    if (!text || !text.includes("艾特我")) return false
    const room = msg.room()
    if (!room) return false
    const talker = msg.talker()
    await room.sync()
    let alias
    try {
        alias = await room.alias(talker) || talker.name()
    } catch (e) {
        alias = talker.name()
    }
    say(msg, `@${alias} #艾特机器人`)
    return true
}

export { getKeywordReply }