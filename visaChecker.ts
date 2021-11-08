import axios from "axios";
import parse from "node-html-parser";
import { Contact } from "wechaty";
import { bot } from "./index"

const getStatus = async () => {
    const body = {
        appReceiptNum: process.env['RECEIPT_NUMBER'],
        caseStatusSearchBtn: "CHECK STATUS",
    }
    const headers = {
        Cookie: process.env['RECEIPT_NUMBER'],
    }
    const data = (await (axios.post("https://egov.uscis.gov/casestatus/mycasestatus.do", body, { headers }))).data
    const soup = parse(data)
    return soup.querySelector("h1")?.innerText
}

const sendToContact = async (content: string, contactName: string) => {
    if (!bot.logonoff()) return // not available
    const contact: Contact | null = await bot.Contact.find({ name: contactName })
    if (!contact) return
    contact.say(content)
}

const sendStatus = async () => {
    const status = await getStatus()
    if (!status) {
        sendToContact("机器人出了点问题哦 #签证机器人", "花栗鼠")
    } else if (status !== "Case Was Received and A Receipt Notice Was Sent") {
        sendToContact(`${status} #签证机器人`, "花栗鼠")
    }
}

const checkStatus = async (interval: number) => {
    setInterval(sendStatus, interval)
}

export { checkStatus }
