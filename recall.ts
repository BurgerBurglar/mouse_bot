import { Message } from "wechaty";
import { MessageType } from "wechaty-puppet";

const recallRevert = async (msg: Message) => {
    const messageRecalled: Message | null = await msg.toRecalled()
    if (!messageRecalled || messageRecalled.type() !== MessageType.Text) return
    const talker = msg.talker()
    const room = msg.room()
    if (room) await room.sync()
    const talkerName = await room?.alias(talker) || talker.name() || "你"
    msg.say(`@${talkerName} 撤回了: "${messageRecalled.text()}" #撤回机器人`)
}

export { recallRevert }