import { Message, Wechaty, Contact, ScanStatus, log } from "wechaty";
import { get_keyword_reply } from "./keyword_replies"

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
    const keyword_reply: string = await get_keyword_reply(msg)
    if (keyword_reply) {
        msg.say(keyword_reply)
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