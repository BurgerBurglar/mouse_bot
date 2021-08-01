import axios from "axios"
import { Dictionary } from "lodash"

const getDaysUntil = (releaseTime: Date) => {
    const now = Date.now()
    return Math.floor((+releaseTime - now) / (1000 * 60 * 60 * 24))
}
const getEldenRingResponse = async (text: string | undefined) => {
    if (!text) return "我没听说这个游戏，再试试看？ #游戏计时机器人"
    const q: string = text.substring(1)  // #EldenRing -> EldenRing
    const result = await axios.get<Dictionary<string>>(encodeURI(`http://localhost:8000/games/${q}`))
        .then(res => res.data)
        .catch(() => null)

    if (!result) return "我没听说这个游戏，再试试看？ #游戏计时机器人"
    let output = ""
    for (let gameName of Object.keys(result)) {
        const releaseDate: string | undefined = result[gameName]
        if (releaseDate) {
            const days: number = getDaysUntil(new Date(`${releaseDate}T00:00+08:00`))
            output += `距离${gameName}发售还有${days}天`
        }
    }
    if (!output) output = "我没听说这个游戏，再试试看？"
    return `${output} #游戏计时机器人`
}
const text = "距离 #eldenring 还有多少天"
const query: string[] | null = text.match(/#\S+/)
if (query) {
    getEldenRingResponse(query[0])
        .then(res => { console.log(res) })
}