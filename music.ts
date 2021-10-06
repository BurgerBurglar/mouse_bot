import { Message, UrlLink } from 'wechaty'
import { getMessageText } from './utils'
const qqMusic = require('qq-music-api')
const SpotifyWebApi = require('spotify-web-api-node')

const getQQMusicUrlLink = async (key: string): Promise<UrlLink> => {
    const song = (await qqMusic.api("search", { key })).data.list[0]

    const title = song.songname
    const artistNames = song.singer.map((singer: { name: string }) => singer?.name)
    const songid = song.songid
    const albummid = song.albummid

    const payload = {
        title,
        description: artistNames.join(", "),
        thumbnailUrl: `https://y.gtimg.cn/music/photo_new/T002R300x300M000${albummid}.jpg`,
        url: `https://i.y.qq.com/v8/playsong.html?songid=${songid}&songtype=0#webchat_redirect`,
    }
    console.log(payload)
    const link = new UrlLink(payload)
    return link
}

const getSpotifyUrlLink = async (key: string) => {
    const spotifyApi = new SpotifyWebApi({
        clientId: "d76944360ff044c98c3997beba353a32",
        clientSecret: "4df8ac94aa124122956ac51128b339b8"
    })
    const auth = await spotifyApi.clientCredentialsGrant()
    spotifyApi.setAccessToken(auth.body['access_token'])
    const data = (await spotifyApi.searchTracks(key)).body.tracks?.items[0]
    const payload = {
        title: data.name,
        description: data.artists.map((e: { name: string }) => e.name).join(", "),
        thumbnailUrl: data.album.images[0].url,
        url: data.external_urls.spotify + "?si=e78443a4992c4a4d",
    }
    return new UrlLink(payload)
}

const sendSong = async (msg: Message) => {
    const text = getMessageText(msg)
    try {
        if (text?.includes("点歌") || text?.toLowerCase().includes("spotify")) {
            if (text?.includes("点歌")) {
                const key: string = text.replace("点歌", "")
                const link: string | UrlLink = await getQQMusicUrlLink(key)
                msg.say(link)
            } else {
                const key: string = text.toLowerCase().replace("spotify", "")
                const link: string | UrlLink = await getSpotifyUrlLink(key)
                msg.say(link)
            }
            return true
        }
        return false
    } catch (e) {
        console.error(e)
        msg.say("机器人找不到这首歌哦 #点歌机器人")
        return true
    }
}
// getQQMusicUrlLink("追梦赤子心").then(e => console.log(e))
export { sendSong }