import { Message, Room } from "wechaty"
import { say, getMessageText } from "./utils"

const repeatGoBack = 10
const repeatMemory = 3
const textHistory: Map<string, Array<string | null>> = new Map()
const repeated: Map<string, Array<string | null>> = new Map()

const isRepeated = (msg: Message) => {
    const text = getMessageText(msg)
    let room: Room | null = msg.room()
    let id: string
    if (room) {
        id = room.id
    } else {
        id = msg.talker().id
    }
    return (
        !msg.self() &&  // DRY: don't repeat yourself
        textHistory.get(id)!.filter(el => el == text).length >= 3 &&  // exists three times
        !repeated.get(id)!.includes(text)  // hasn't been repeated recently
    )
}

const updateHistory = (updated: Array<string | null>, text: string) => {
    updated.shift()
    updated.push(text)
}

const repeat = (msg: Message) => {
    const text = getMessageText(msg)
    say(msg, `${text} #复读机器人`)
}

const repeatMe = async (msg: Message) => {
    const text = getMessageText(msg)
    if (!text) return
    let room: Room | null = msg.room()
    let id: string
    if (room) {
        id = room.id
    } else {
        id = msg.talker().id
    }
    if (!textHistory.has(id)) {
        textHistory.set(id, new Array(repeatGoBack).fill(null))
    }
    if (!repeated.has(id)) {
        repeated.set(id, new Array(repeatMemory).fill(null))
    }
    const roomTextHistory: Array<string | null> = textHistory.get(id)!
    const roomRepeated: Array<string | null> = repeated.get(id)!
    updateHistory(roomTextHistory, text)
    if (isRepeated(msg)) {
        updateHistory(roomRepeated, text)
        repeat(msg)
    }
}

export { repeatMe }