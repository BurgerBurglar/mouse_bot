import { Message, Wechaty, Contact, ScanStatus, log, UrlLink } from "wechaty"
import { PuppetPadlocal } from "wechaty-puppet-padlocal"
import { getKeywordReply } from "./keyword_replies"
import { sendTrumpVideo } from "./trump"
import { repeatMe } from "./repeat_me"
import { readFileSync } from "fs"
import { MessageType } from "wechaty-puppet"
import { sendVideo } from "./videoDownloader"
import { sendSong } from "./music"
import { sendPoem } from "./poem"
import { kickDongdong } from "./kickDongdong"

const doNotReply: { [index: string]: any } = JSON.parse(readFileSync("data/do_not_reply.json", "utf-8"))
process.env["WECHATY_PUPPET_SERVICE_NO_TLS_INSECURE_SERVER"] = "true"

const onScan = (qrcode: string, status: ScanStatus) => {
    log.info(`Status: ${status}`);
    if (status === ScanStatus.Waiting || status === ScanStatus.Timeout) {
        const qrcodeImageUrl = `https://wechaty.js.org/qrcode/${encodeURIComponent(qrcode)}`;
        log.info(qrcodeImageUrl);
        require('qrcode-terminal').generate(qrcode, { small: true })
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
    if (msg.room() && doNotReply["roomNames"]!.includes(await msg.room()!.topic())) return
    if (!msg.room() && doNotReply["userNames"]!.includes(msg.talker().name())) return
    if (msg.type() != MessageType.Unknown) {
        log.info(msg.toString())
    }
    if (await sendSong(msg)) return
    // if (await sendTrumpVideo(msg)) return
    // if (await sendVideo(msg)) return
    if (await sendPoem(msg)) return
    if (await kickDongdong(msg)) return
    if (msg.self()) return
    const keywordReply: string | undefined = await getKeywordReply(msg)
    if (keywordReply) {
        msg.say(keywordReply)
    } else {
        repeatMe(msg)
    }
}
const token = process.env.PADLOCAL_TOKEN
const puppet = new PuppetPadlocal({ token })
const name = 'mouse_bot';
const bot = new Wechaty({ name, puppet })

bot.on('scan', onScan);
bot.on('login', onLogin);
bot.on('logout', onLogout);
bot.on("message", onMessage)

bot
    .start()
    .then(() => log.info(`${name} has started`))
    .catch((e) => log.error(`$${e}`))

export { bot, doNotReply }