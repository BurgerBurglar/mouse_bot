import { Message, Wechaty } from "wechaty"
import { getMessageText } from "./utils"

const votesNeeded = 3
let voteStarted = false
let recentMessages: { "userId": string, "text": string }[] = []
const keywords = ["信用卡", "银行", "存款", "体制", "客户", "网点", "存款", "资产", "签证", "理财", "营业", "编制", "事业编", "贷款", "公积金", "对公", "工行", "营销", "工银"]

const isKickable = (text: string) => {
    if (text.length > 15 * 7) return true
    let count = 0
    for (let keyword of keywords) {
        count += (text.match(keyword) || []).length
        if (count >= 2) return true
    }
    return false
}
const canKickDongdong = async (msg: Message) => {
    const room = msg.room()
    if (room === null || await room?.topic() !== "皇马upup") return false
    const dongdong = await room.member("栋栋🤧")
    if (dongdong === null) return false
    return dongdong
}
const startVote = async (msg: Message) => {
    if (!canKickDongdong(msg)) return false
    const text = getMessageText(msg)
    if (text === null) return false
    if (isKickable(text) && msg.talker().name() == "栋栋🤧") {
        msg.say('机器人检测到栋栋的发言存在骚扰行为，是否要把栋栋踢出此群？回复"踢了吧"可参与投票。#踢栋机器人')
        if (!voteStarted)
            voteStarted = true
        return true
    }
    return false
}
const kickDongdong = async (msg: Message) => {
    const dongdong = await canKickDongdong(msg)
    if (!dongdong) return
    msg.say("李祥栋你好，你的发言存在骚扰行为，根据民主投票，我代表党和人民踢你出群。#踢栋机器人")
    await Wechaty.sleep(3 * 1000)
    const room = msg.room()
    try {
        await room!.remove(dongdong)
        console.log("把栋栋踢了")
    } catch (e) {
        msg.say("怎么没踢成功，谁他妈把我房管给下了？#踢栋机器人")
    }
}
const countVotes = () => {
    const voted: Set<string> = new Set()
    for (let message of recentMessages) {
        if (message.text.includes("踢了吧")) {
            voted.add(message.userId)
        }
    }
    return voted.size
}
const readVotes = async (msg: Message) => {
    if (!voteStarted || !canKickDongdong(msg)) return false
    const text = getMessageText(msg)
    const userId = msg.talker().id
    if (text === null) return false
    if (msg.talker().name() != "栋栋🤧")
        recentMessages.push({ userId, text })
    if (countVotes() >= votesNeeded) {
        kickDongdong(msg)
        voteStarted = false
        recentMessages = []
        return true
    }
    if (recentMessages.length > 10) {
        msg.say("投票结束，不踢掉栋栋。#踢栋机器人")
        voteStarted = false
        recentMessages = []
        return true
    }
    return false
}
const kickDongdongRoutine = async (msg: Message) => {
    if (await startVote(msg)) return true
    if (await readVotes(msg)) return true
    return false
}
export { kickDongdongRoutine as kickDongdong }