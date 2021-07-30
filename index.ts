import { Message, Wechaty, Contact, ScanStatus, log } from "wechaty";
import { getKeywordReply } from "./keyword_replies"
import { repeatMe } from "./repeat_me";
import { recallRevert } from "./recall";
import { readFileSync } from "fs";
import { MessageType } from "wechaty-puppet";

const doNotReply: { [index: string]: any } = JSON.parse(readFileSync("data/do_not_reply.json", "utf-8"))

const onScan = (qrcode: string, status: ScanStatus) => {
    log.info(`Status: ${status}`);
    if (status === ScanStatus.Waiting || status === ScanStatus.Timeout) {
        const qrcodeImageUrl = `https://wechaty.js.org/qrcode/${encodeURIComponent(qrcode)}`;
        log.info(qrcodeImageUrl);
    } else {
        log.info(`${name} onScan: ${ScanStatus[status]}(${status})`)
    }
}

const onLogin = async (user: Contact) => {
    log.info(`${user} has succesfully logged in.`);
}

const onLogout = (user: Contact) => {
    log.info(`${user} has logged out.`);
}

const onMessage = async (msg: Message) => {
    log.info(msg.toString())

    if (msg.self()) return
    if (msg.room() && doNotReply["roomNames"]!.includes(await msg.room()!.topic())) return
    if (!msg.room() && doNotReply["userNames"]!.includes(msg.talker().name())) return

    if (msg.type() === MessageType.Recalled) {
        recallRevert(msg)
    }

    const keywordReply: string | undefined = await getKeywordReply(msg)
    if (keywordReply) {
        msg.say(keywordReply)
    } else {
        repeatMe(msg)
    }
}

const name = 'mouse_bot';
const bot = new Wechaty({ name });

bot.on('scan', onScan);
bot.on('login', onLogin);
bot.on('logout', onLogout);
bot.on("message", onMessage)

bot
    .start()
    .then(() => log.info(`${name} has started`))
    .catch((e) => log.error(`$${e}`))

export { bot, doNotReply }