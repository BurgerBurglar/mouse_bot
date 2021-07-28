import axios from "axios"
const getBotChatReply = async (input: string) => {
    input = input
        .split("田鼠").join("菲菲")
        .split(/@\S+/).join("")
    console.log(input)

    const reply: string = await axios
        .get(encodeURI(`https://api.qingyunke.com/api.php?key=free&appid=0&msg=${input}`))
        .then(res => res.data.content)
        .then(res => res.split("菲菲").join("田鼠"))
        .then(res => res.split("姐").join("弟弟"))
        .then(res => res.split("好女人就是").join("好男人就是"))
        .then(res => res.split(/\{face\:\d+\}/).join(""))
    return reply
}
// .then(res => res.replaceAll("菲菲", "田鼠"))

getBotChatReply("@毅只田鼠 你干嘛")
    .then(res => console.log(res))