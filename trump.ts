import { FileBox } from 'file-box';
import { Message } from 'wechaty';
import { PythonShell } from 'python-shell';
import { MessageType } from 'wechaty-puppet';
import { say, getMessageText } from './utils';

const videoPath: string = "../mouse_bot/data/trump.mp4"
const generateWithWord = async (word: string, output: string, next: any) => {
    const execOptions = {
        scriptPath: '../Is-Now-Illegal/rotoscope',
        args: [word, '../GIF/new', output],
        pythonPath: '../Is-Now-Illegal/venv/Scripts/python.exe'
    }
    PythonShell.run('generate.py', execOptions, next)
}
const sendTrumpVideo = async (msg: Message) => {
    if (msg.type() == MessageType.Text && getMessageText(msg)?.includes(".mp4")) {
        if (msg.type() != MessageType.Text || !msg.text().includes(".mp4")) return
        const text: string | undefined = getMessageText(msg)!.split(".mp4")[0]
        if (!text) return
        const next = () => say(msg, FileBox.fromFile(videoPath))
        await generateWithWord(text, "../" + videoPath, next)
        return true
    }
    return false
}

export { sendTrumpVideo }