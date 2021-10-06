import { Message } from "wechaty"

const getMessageText = (msg: Message): string | null => {
    if (
        ![Message.Type.Text, Message.Type.Recalled].includes(msg.type()) ||
        ["[Send an emoji, view it on mobile]", "[收到一条暂不支持的消息类型，请在手机上查看]"].includes(msg.text())
    )
        return null
    let text: string | undefined | null = msg
        .text()
        .trim()
        .split("\n- - - - - - - - - - - - - - - -\n")
        .slice(-1)[0]  // remove quotes
    if (!text) text = null
    return text
}

export { getMessageText }