import axios from "axios"
import { Message } from "wechaty"
import { removeKeyword, say } from "./utils"
import { readFileSync } from "fs"

interface DailyResponse {
    info: {
        fName: string
        dName: string
        time: Date
        daySeq: number
    }
    data: {
        homeName?: string
        awayName?: string
        id?: number
    }[]
}

interface Response {
    status: number
    message: string
    data: {
        list: DailyResponse[]
    }
}

interface MatchInfo {
    homeName: string
    awayName: string
    id: number
}

const footballNickNames: { [index: string]: string[] } = JSON.parse(readFileSync("data/football_nicknames.json", "utf-8"))
const nicknameTeamMap: { [index: string]: string } = {}
for (let team in footballNickNames) {
    for (let nickname of footballNickNames[team] as string[]) {
        nicknameTeamMap[nickname] = team
    }
}

const sportNameCodeMap: { [index: string]: number } = {
    "足球": 1,
    "篮球": 2,
    "高尔夫": 3,
    "网球": 4,
    "斯诺克": 7,
    "棒球": 8,
    "冰球": 9,
    "赛车": 12,
    "NFL": 14,
    "格斗": 42,
}

const apiUrl = "https://www.heibaizhibo.com/api/index/index"
const liveUrl = "https://www.heibaizhibo.com/live/"

const getAllMatches = async (sportCode: number): Promise<MatchInfo[] | void> => {
    const params = {
        subclass: 0,
        class1: sportCode,
        page: 1,
        size: 100,
    }
    try {
        const response = (await axios.get<Response>(apiUrl, { params })).data
        const matches: MatchInfo[] | undefined = response.data.list
            .filter(dailyResponse => dailyResponse.data)
            .map(dailyResponse => dailyResponse.data)
            .filter(dailyData => dailyData.length)
            .reduce((prev, next) => prev.concat(next))
            .map(match => ({
                homeName: match.homeName,
                awayName: match.awayName,
                id: match.id
            } as MatchInfo))
        if (matches && matches.length) {
            return matches
        }
    } catch (e) {
        console.log(e)
    }
}

const searchMatches = async (sportCode: number, teamName: string): Promise<MatchInfo[]> => {
    const matches = await getAllMatches(sportCode)
    if (!matches || !matches.length) return []
    const teamMatches: MatchInfo[] = matches.filter(match => match.homeName.includes(teamName) || match.awayName.includes(teamName))
    return teamMatches
}

const getPirateResponse = async (sportCode: number, teamName: string): Promise<string> => {
    if (!teamName.length) return "机器人不知道你要看谁的比赛哦。#盗版直播机器人"
    const matches = await searchMatches(sportCode, teamName)
    if (!matches.length) return `机器人没有找到${teamName}的直播哦。#盗版直播机器人`
    return matches.map(match => {
        const { homeName, awayName, id } = match
        return `${homeName} vs ${awayName}
${liveUrl + id}`
    }).slice(0, 3).join("\n") + "\n#盗版直播机器人"
}

const pirate = async (msg: Message): Promise<boolean> => {
    const sportNameTeamName = removeKeyword(msg, "直播链接")
    if (sportNameTeamName === null) return false
    for (let sportName in sportNameCodeMap) {
        if (sportNameTeamName.includes(sportName)) {
            let teamName = sportNameTeamName.replace(sportName, "").trim()
            teamName = nicknameTeamMap[teamName] || teamName
            const sportCode = sportNameCodeMap[sportName] as number
            const response = await getPirateResponse(sportCode, teamName)
            say(msg, response)
            return true
        }
    }
    say(msg, `机器人没有找到这个运动哦。支持查找：\n${Object.keys(sportNameCodeMap).join(" ")}\n#盗版直播机器人`)
    return true
}

export { pirate }