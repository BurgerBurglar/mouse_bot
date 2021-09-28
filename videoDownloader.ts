import axios from "axios"
import { createWriteStream } from "fs";
import { FileBox, Message } from "wechaty";
import { PythonShell } from 'python-shell';
import { parse } from 'node-html-parser'

const filePath = "./data/download.mp4"
const getYouTubeDownloadableUrl = async (youtubeUrl: string) => {
    const downloaderUrl = "https://youtube-downloader-v3.herokuapp.com/video_info.php"
    const response = await axios.get(downloaderUrl, { params: { url: youtubeUrl } })
    console.log("Converted!")
    return response.data["links"][0]
}
const getWeiboDownloadableUrl = async (weiboUrl: string) => {
    const downloaderUrl = "https://video.justyy.workers.dev/api/video/"
    const response = await axios.get(downloaderUrl, { params: { video: weiboUrl, hash: "074aa5ab44c5a478c95f8b4bef3c3b25" } })
    console.log("Converted!")
    return response.data["url"]
}
const getXiaohongshuDownloadableUrl = async (xiaohongshuUrl: string) => {
    try {
        const res = await axios.get(xiaohongshuUrl, { headers: { 'Cookie': "xhsTrackerId=28caae59-b7c3-4304-c32e-db3e5430d71f; extra_exp_ids=gif_clt1,ques_clt2; timestamp2=20210910423129f7fc6534b36b7c04b9; timestamp2.sig=0tFJMNjAfM_wCMWOxsv5YNPfT-ZU5A-vjx7IPwIZlUs" } })
        const html = res.data
        const soup = parse(html)
        const videoUrl = soup.querySelector("video").getAttribute("src")
        return videoUrl
    } catch (e) {
        console.log(e)
        return
    }
}
const downloadVideo = async (url: string) => {
    axios({
        url: url,
        method: 'GET',
        responseType: 'stream',
    }).then((response) => {
        response.data.pipe(createWriteStream(filePath))
        console.log("Done!")
    });
}
const sendVideo = async (msg: Message) => {
    const messageText = msg.text().replace(/&lt;/gi, "<").replace(/&gt;/gi, ">")
    const originalUrls = messageText.match(/(https?:\/\/([\w_-]+(?:(?:\.[\w_-]+)+))([\w.,@?^=%&:/~+#-]*[\w@?^=%&/~+#-])?)/)
    if (!originalUrls || originalUrls?.length == 0) return
    const originalUrl = originalUrls[0]
    if (!originalUrl) return
    let downloadableUrl: string | undefined = ""
    if (originalUrl.includes("youtube.com"))
        downloadableUrl = await getYouTubeDownloadableUrl(originalUrl)
    else if (originalUrl.includes("xiaohongshu.com"))
        downloadableUrl = await getXiaohongshuDownloadableUrl(originalUrl)
    else if (originalUrl.includes("weibo.c"))
        downloadableUrl = await getWeiboDownloadableUrl(originalUrl)
    if (!downloadableUrl) return
    console.log("Generated:", downloadVideo)
    await downloadVideo(downloadableUrl)
    const next = () => {
        try {
            msg.say(FileBox.fromFile(filePath))
            msg.say("正在上传，请稍后。#视频下载机器人")
        } catch (e) {
            console.log("upload failed")
        }
    }
    const compressVideo = async () => {
        const execOptions = {
            scriptPath: '.',
            args: ["data", "download.mp4"],
            pythonPath: './venv/Scripts/python.exe'
        }
        PythonShell.run('test.py', execOptions, next)
    }
    await compressVideo()
}
export { sendVideo }