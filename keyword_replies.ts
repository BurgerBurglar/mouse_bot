import axios from "axios"
import { promises as fs } from "fs"
import _ from "lodash";
import { Message } from "wechaty"

const get_licking_dog = async () => {
    const data: string = await axios.get("https://api.qder.com/tiangou/api.php")
        .then(res => res.data.split("\"")[1])
        .catch(() => "服务器错误，再试试吧。")
    return data;
}
const get_chichen_soup = async () => {
    return await axios.get("https://api.qqder.com/yan/api.php")
        .then(res => res.data.trim())
        .catch(() => "服务器错误，再试试吧。")
}

const get_zsh_quote = async () => {
    const zsh_quotes = await fs.readFile("data/zsh.json", "utf-8")
        .then(res => JSON.parse(res))
        .then(res => _.sample(res).join("\n"))
    return zsh_quotes
}

const get_contents_from_file = async (filename: string) => {
    const lines = await fs.readFile(filename, "utf-8")
        .then(res => res.split("\n"))
        .then(res => res.filter(
            (line: string) => line.trim() && !line.includes("#")
        ))
    return lines.slice(1,)
}
const get_contents_from_folder = async (folder_name: string, _suffix: string = "md") => {
    let filenames: string[] = await fs.readdir(folder_name);
    filenames = filenames
        .filter(filename => filename.endsWith(`.${_suffix}`))
        .map(filename => `${folder_name}/${filename}`)
    const contents: string[][] = await Promise.all(filenames.map(get_contents_from_file))
    const flat_contents: string[] = ([] as string[]).concat(...contents);
    return flat_contents
}

const get_buddhism_quote = async () => {
    const quotes: string[] = await get_contents_from_folder("data/buddhism/")
    return _.sample(quotes)
}

const get_tickle_reply = () => {
    return "拍我干嘛？ #拍拍机器人"
}

const get_keyword_reply = async (msg: Message) => {
    const text: string = msg.text();
    if (text.includes("舔狗日记")) {
        return await get_licking_dog()
    }
    if (text.includes("心灵鸡汤")) {
        return await get_chichen_soup()
    }
    if (text.includes("豪哥语录")) {
        return await get_zsh_quote()
    }
    if (text.includes("佛经选读")) {
        return await get_buddhism_quote()
    }
    if (text.includes("\" 拍了拍我")) {
        return get_tickle_reply()
    }
    return null
}
const get_time_until = (releaseTime: Date) => {

}

const get_elden_ring_response = () => {

}
// days = self.get_time_until(datetime(2022, 1, 21))
// if days >= 0:
//     return f"距离艾尔登法环发售还有{days}天 #田鼠机器人"

export { get_keyword_reply }