import axios from "axios"
import { URLSearchParams } from "url"
import { Message } from "wechaty"
import { say, getMessageText } from "./utils"

const headers = {
    'content-type': 'application/x-www-form-urlencoded; charset=UTF-8'
}

const getPoem = async (heads: string) => {
    heads = heads.replace(/(\p{P}| )+/gu, "")  // removes punctuations
    for (let c of heads) {
        if (!/.*[\u4e00-\u9fa5]+.*$/.test(c))
            return "爱慕拆腻子，阿鬼，你都係讲返中文喇。"
    }
    if (heads.length > 4 || heads.length == 0)
        return "机器人只会 1-4 个字的藏头诗哦"
    const params = {
        yan: "7",
        poem: heads,
        sentiment: "-1",
    }
    const data = new URLSearchParams(params).toString()
    try {
        const celeryId = (await axios.post('https://jiuge.cs.tsinghua.edu.cn/jiugepoem/task/send_arousic', data, { headers })).data.celery_id
        const postData = `celery_id=${celeryId}`
        let poem: string | string[] = ""
        for (let i = 0; i < 5; i++) {
            await new Promise(resolve => setTimeout(resolve, 3000))
            poem = (await axios.post('https://jiuge.cs.tsinghua.edu.cn/jiugepoem/task/get_arousic', postData, { headers })).data.output
            if (!!poem) break
        }
        if (!poem) throw new Error()
        if (Array.isArray(poem)) return poem.join("\n")
        return poem
    } catch (error) {
        return "这首诗机器人不会做哦"
    }
}

const sendPoem = async (msg: Message) => {
    const text = getMessageText(msg)
    if (text === null) return false
    if (!text.includes("藏头诗")) return false
    const heads: string = text.replace("藏头诗", "").trim()
    const poem: string = await getPoem(heads)
    say(msg, `${poem}\n#古诗机器人`)
    return true
}
export { sendPoem }