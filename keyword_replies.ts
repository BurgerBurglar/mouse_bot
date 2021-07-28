import axios from "axios"
import { promises, readFileSync } from "fs"
import _ from "lodash";
import { Contact, Message, Wechaty } from "wechaty"
import { getMessageText } from "./utils";
import { bot } from ".";

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
    if (text.includes("舔狗日记")) {
        return await getLickingDog()
    }
    if (text.includes("心灵鸡汤")) {
        return await getChichenSoup()
    }
    if (text.includes("豪哥语录")) {
        return await getZshQuote()
    }
    if (text.includes("佛经选读")) {
        return await getBuddhismQuote()
    }
    if (text.includes("艾特我")) {
        return await getMentionMeResponse(msg)
    }
    if (await mentionSelf(msg)) {
        return await getBotChatReply(text)
    }

    const nonsenseReply = await getNonsenseReply(text)

    if (nonsenseReply) return nonsenseReply
    if (text.length == 4) {
        const idiom: string | null = await getIdiomSolitare(text)
        if (idiom) return idiom
    }
    return
}

const mentionSelf = async (msg: Message) => {
    const text = msg.text()
    const room = msg.room()
    if (!room || !text.includes("@")) return false
    const userSelf = bot.userSelf()
    await room.sync()
    const selfAlias = await room.alias(userSelf) || userSelf.name()

    return text.includes(`@${selfAlias}`)
}

const getBotChatReply = async (input: string) => {
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

const getLickingDog = async () => {
    const data: string = await axios.get("https://api.qqder.com/tiangou/api.php")
        .then(res => res.data.split("\"")[1] + " #舔狗日记")
        .catch(() => "服务器错误，再试试吧。")
    return data;
}
const getChichenSoup = async () => {
    return await axios.get("https://api.qqder.com/yan/api.php")
        .then(res => res.data.trim() + " #心灵鸡汤")
        .catch(() => "服务器错误，再试试吧。")
}

const getZshQuote = async () => _.sample(zshQuotes)!.join("\n") + " #豪哥语录"

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

const getNonsenseReply = async (text: string) => {
    let results: any = null
    for (let keyword in keywordMapper) {
        if (text.includes(keyword)) {
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