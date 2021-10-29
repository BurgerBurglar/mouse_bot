import { Contact, Message, Room, Wechaty } from "wechaty"
import { say, getMessageText, getMessageTextWithoutMentionsTags } from "./utils"
import { bot } from "."

const votesNeeded = 3
let recentMessages: { "userId": string, "text": string }[] = []
const keywords = ["信用卡", "银行", "存款", "体制", "客户", "网点", "存款", "资产", "签证", "理财", "营业", "编制", "事业编", "贷款", "公积金", "对公", "工行", "营销", "工银"]
const dongdongName = "栋栋🤧"
const realMadridRoomTopic = "皇马upup"

const isKickable = (text: string) => {
    let count = 0
    for (let keyword of keywords) {
        count += (text.match(keyword) || []).length
        if (count >= 2) return true
    }
    return false
}

const canKickDongdong = async (msg: Message) => {
    const room = msg.room()
    if (room === null || await room?.topic() !== realMadridRoomTopic) return false
    const dongdong = await room.member(dongdongName)
    if (dongdong === null) return false
    return true
}

const addDongdongSource = async (msg: Message): Promise<Contact | Room | null> => {
    const messageRoom = msg.room()
    if (!messageRoom) {
        const talker = msg.talker()
        if (talker.name() !== dongdongName) return null
        return talker
    }
    const realMadridRoom = await bot.Room.find({ topic: realMadridRoomTopic })
    if (messageRoom !== realMadridRoom) return null
    const dongdong: Contact | null = await realMadridRoom.member(dongdongName)
    if (dongdong !== null) return null
    return realMadridRoom
}

const startKickVote = async (msg: Message) => {
    if (!await canKickDongdong(msg)) return false
    if (msg.type() !== Message.Type.Text) return false
    const text = getMessageTextWithoutMentionsTags(msg)
    if (text === null || actions["kick"]["voteStarted"]) return false
    if (isKickable(text) && msg.talker().name() == dongdongName) {
        say(msg, `机器人检测到栋栋的发言存在骚扰行为，是否要把栋栋踢出此群？回复"${actions["kick"]["vote"]}"可参与投票。#踢栋机器人`)
        actions["kick"]["voteStarted"] = true
        return true
    }
    return false
}

const startAddVote = async (msg: Message) => {
    const source = await addDongdongSource(msg)
    if (source === null) return false
    const text = getMessageTextWithoutMentionsTags(msg)
    if (text === null || !text.includes("拉下栋栋") || actions["add"]["voteStarted"]) return false
    if (source instanceof Room) {
        source.say(`确定要拉栋栋回群吗？回复"${actions["add"]["vote"]}"可参与投票。如果不希望他回群，请无视。#拉栋机器人`)
    } else {
        const realMadridRoom = await bot.Room.find({ topic: realMadridRoomTopic })
        if (realMadridRoom === null) return false
        realMadridRoom.say(`栋栋知道错了，请求回到群里。回复"${actions["add"]["vote"]}"可参与投票。如果不希望他回群，请无视。#拉栋机器人`)
        say(msg, "已经在群里发起投票，请稍候。#拉栋机器人")
    }
    actions["add"]["voteStarted"] = true
    return true
}

const kickDongdong = async (msg: Message) => {
    if (!await canKickDongdong(msg)) return false
    const dongdong = await msg.room()!.member(dongdongName) as Contact
    say(msg, "李祥栋你好，你的发言存在骚扰行为，根据民主投票，我代表党和人民踢你出群。#踢栋机器人")
    await Wechaty.sleep(3 * 1000)
    const room = msg.room()
    try {
        await room!.remove(dongdong)
        console.log("把栋栋踢了")
        await Wechaty.sleep(3 * 1000)
        say(msg, '踢栋成功。如果要拉他回群，请随时说"拉下栋栋"。#踢栋机器人')
    } catch (e) {
        say(msg, "怎么没踢成功，谁他妈把我房管给下了？#踢栋机器人")
    } finally {
        return true
    }
}

const addDongdong = async (msg: Message) => {
    if (await addDongdongSource(msg) === null) return false
    const realMadridRoom = await bot.Room.find({ topic: realMadridRoomTopic })
    if (realMadridRoom === null) return false
    realMadridRoom.say("看来大家都很想他，那我就拉他回来吧。#拉栋机器人")
    const dongdong = await bot.Contact.find({ name: dongdongName })
    if (dongdong === null) {
        realMadridRoom.say("栋栋把我好友删了，拉不了。#拉栋机器人")
        return false
    }
    try {
        realMadridRoom.add(dongdong as Contact)
        console.log("把栋栋拉了")
        await Wechaty.sleep(3 * 1000)
        realMadridRoom.say("李祥栋你好，分别已久，大家非常想你。根据民主投票，我代表党和人民拉你入群。#拉栋机器人")
    } catch (e) {
        realMadridRoom.say("怎么没拉成功，谁他妈把我房管给下了？#踢栋机器人")
    } finally {
        return true
    }
}

type ActionName = "kick" | "add"
type ActionType = {
    voteStarted: boolean, vote: string, fail: string, do: Function,
}
type Actions = {
    kick: ActionType,
    add: ActionType,
}
const actions: Actions = {
    kick: { voteStarted: false, vote: "踢了吧", fail: "投票结束，不踢掉栋栋。#踢栋机器人", do: kickDongdong },
    add: { voteStarted: false, vote: "想栋栋了", fail: "投票结束，继续放逐栋栋。#拉栋机器人", do: addDongdong },
}

const countVotes = (actionName: ActionName) => {
    const voted: Set<string> = new Set()
    for (let message of recentMessages) {
        if (message.text.includes(actions[actionName]["vote"])) {
            voted.add(message.userId)
        }
    }
    return voted.size
}

const readVotes = async (msg: Message, actionName: ActionName) => {
    const toKick = actions["kick"]["voteStarted"] && await canKickDongdong(msg)
    const toAdd = actions["add"]["voteStarted"] && await addDongdongSource(msg) !== null
    if (actionName === "kick" && !toKick) return false
    if (actionName === "add" && !toAdd) return false
    const text = getMessageText(msg)
    if (text === null) return false

    const action = actions[actionName]
    const userId = msg.talker().id
    if (msg.talker().name() != dongdongName)
        recentMessages.push({ userId, text })
    if (countVotes(actionName) >= votesNeeded) {
        action.do(msg)
        actions[actionName]["voteStarted"] = false
        recentMessages = []
        return true
    }
    if (recentMessages.length > 10) {
        say(msg, action["fail"])
        if (actionName === "add") {
            const dongdong = await bot.Contact.find({ name: dongdongName })
            if (dongdong !== null) {
                dongdong.say(action["fail"])
            }
        }
        actions[actionName]["voteStarted"] = false
        recentMessages = []
        return true
    }
    return false
}

const kickDongdongRoutine = async (msg: Message) => {
    if (await startKickVote(msg)) return true
    if (await readVotes(msg, "kick")) return true
    return false
}

const addDongdongRoutine = async (msg: Message) => {
    if (await startAddVote(msg)) return true
    if (await readVotes(msg, "add")) return true
    return false
}

export { kickDongdongRoutine as kickDongdong, addDongdongRoutine as addDongdong }
