import axios from "axios"
import { Message } from "wechaty"
import { removeKeyword, say } from "./utils"

const key: string | undefined = process.env["WEATHER_KEY"]
const days = ["今天", "明天", "后天"]
const errorMessage = "机器人掉线了，不知道天气如何哦。#天气机器人"
type Location = {
    name: string,
    id: string,
}

class LocationNotFound extends Error {
    constructor(msg: string) {
        super(msg)
        Object.setPrototypeOf(this, LocationNotFound.prototype)
    }
}

class KeyNotFoundError extends Error {
    constructor(msg: string = "机器人钥匙丢了，查不到天气如何哦。#天气机器人") {
        super(msg)
        Object.setPrototypeOf(this, KeyNotFoundError.prototype)
    }
}


const locationLookup = async (location: string): Promise<Location | string> => {
    const url = "https://geoapi.qweather.com/v2/city/lookup"
    const params = { location, key }
    try {
        if (!key) throw new KeyNotFoundError()
        const data = (await axios.get(url, { params })).data
        if (data.code === "404")
            throw new LocationNotFound(`机器人不知道"${location}"在哪里哦。#天气机器人`)
        const { name, id } = data.location[0]
        return { name, id }
    } catch (e) {
        if (e instanceof Error) return e.message
        return errorMessage
    }
}
type weatherType = {
    fxDate: string,
    sunrise: string,
    sunset: string,
    moonrise: string,
    moonset: string,
    moonPhase: string,
    moonPhaseIcon: string,
    tempMax: string,
    tempMin: string,
    iconDay: string,
    textDay: string,
    iconNight: string,
    textNight: string,
    wind360Day: string,
    windDirDay: string,
    windScaleDay: string,
    windSpeedDay: string,
    wind360Night: string,
    windDirNight: string,
    windScaleNight: string,
    windSpeedNight: string,
    humidity: string,
    precip: string,
    pressure: string,
    vis: string,
    cloud: string,
    uvIndex: string,
}
type locationWeatherType = {
    name: string,
    weather: weatherType[],
}

const getLocationWeather = async (locationName: string): Promise<locationWeatherType | string> => {
    try {
        if (!key) throw new KeyNotFoundError()
        const url = "https://devapi.qweather.com/v7/weather/3d"
        const location = await (locationLookup(locationName))
        if (typeof location === "string")
            return location
        const params = { location: location.id, key }
        const weather = (await axios.get(url, { params, timeout: 10 * 1000 })).data.daily
        return { name: location.name, weather }
    } catch (e) {
        if (e instanceof Error) return e.message
        return errorMessage
    }
}

// do not ask me why i have to offset the timezone. JS is weird.
const dateToChineseDayName = (date: string): string => {
    let parsedDate = new Date(Date.parse(date))
    const timezoneOffset = parsedDate.getTimezoneOffset() * 60 * 1000
    parsedDate = new Date(parsedDate.getTime() + timezoneOffset)
    const dayName = parsedDate.toLocaleString("zh-CN", { weekday: "short" })
    return dayName
}

const weatherSummary = async (locationName: string, day?: string): Promise<string> => {
    try {
        if (!key) throw new KeyNotFoundError()
        const locationWeather = await getLocationWeather(locationName)
        if (typeof locationWeather == "string") return locationWeather

        const weatherSummary = locationWeather.weather.map(e =>
            `${e.fxDate} ${dateToChineseDayName(e.fxDate)}
白天：${e.textDay} 夜间：${e.textNight}
${e.tempMin}-${e.tempMax} ℃`
        )

        let result: string = `${locationWeather.name}天气\n- - - - - - - - -\n`
        if (day) {
            const dayNumber = days.findIndex(e => e === day)
            result += weatherSummary[dayNumber] as string
        } else {
            result += weatherSummary.join("\n- - - - - - - - -\n")
        }
        result += "\n#天气机器人"
        return result
    } catch (e) {
        if (e instanceof Error) return e.message
        return errorMessage
    }
}

const weatherForecast = async (msg: Message) => {
    const text = removeKeyword(msg, "天气预报")
    if (text === null) return false
    try {
        for (let day of days) {
            if (text.includes(day)) {
                const locationName = text.replace(day, "")
                const weather = await weatherSummary(locationName, day)
                say(msg, weather)
                return true
            }
        }
        const weather = await weatherSummary(text)
        say(msg, weather)
    } catch (e) {
        if (e instanceof Error) {
            say(msg, e.message)
        } else {
            say(msg, errorMessage)
        }
    } finally {
        return true
    }
}

export { weatherForecast }
