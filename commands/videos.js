const path = require('path')
const { getDir, sendLog } = require("../utils")
const {
    isBanned,
    getUser,
    updateAllSentQueries,
    updateAllsuccessfulVideoQueries
} = require('../database')
const mainChannelId = -1001404127129
const queryInProgress = []
const categories = [
    'amature', 'anal', 'bdsm',
    'blacked', 'blowjob', 'boobs',
    'brazzers', 'creampie', 'gif',
    'irani', 'massage', 'milf', 'public',
    'random', 'teen', 'threesome', 'tiktok'
]
var videos = {}
categories.forEach(async category => {
    try {
        const files = await getDir(`./assets/videos/${category}/`)
        videos[category] = files
        console.log(`[>] ${category} files loaded.`);
    } catch (error) {
        console.log(error);
    }
})

// some required functions
const sendChannelJoinErr = (bot) => {
    const message = `ناموسا برای حمایت از ما و استفاده از ربات لطفا اول تو کانالمون عضو شو 🙂🌹\n 😹 @nemesisdevteam 🍑`
    bot.sendMessage(msg.from.id, message).catch(err => console.log(err))
    return
}
const randInt = (min, max) => { // min and max included 
    return Math.floor(Math.random() * (max - min + 1) + min)
}
// main
module.exports = {
    name: categories,
    execute: async function execute(bot, msg, args, category=null, previous_message = null) {
        // category and previous_message will be used by the bot to
        // determine the category in case of retry.
        // when the bot runs to an error we will recursivly call it 
        // in order to repeat the process and try repeatetively to
        // give the user what they want.

        // removes the wait message which was sent previously.
        if (previous_message)
            bot.deleteMessage(msg.chat.id, previous_message.message_id).catch(console.log)
        // < -- key information -- >
        const chatID = msg.chat.id
        const userID = msg.from.id
        const username = msg.from.username
        const firstname = msg.from.first_name
        const lastname = !msg.from.last_name ? null : msg.from.last_name
        const SelectedCategory = msg.text.split("/")[1]

        const isUserBanned = await isBanned(msg.from.id)
        if (isUserBanned) return

        const memebership = await bot.getChatMember(mainChannelId, msg.from.id)
        if (!["member", "administrator", "creator"].includes(memebership.status)){
            sendChannelJoinErr(bot)
            return
        }

        if (queryInProgress[msg.from.id]) {
            msg.reply.text("[❗] Please wait until your last query is completed.").catch(console.log)
            return
        }

        const waitMsg = await bot.sendMessage(chatID, "[🔞] Thinking ...")
        // initiates a timer so that if the bot got stuck
        // we can handle it
        const dl_timeout = setTimeout(() => {
            queryInProgress[msg.from.id] = false
            bot.editMessageText({ chatId: chatID, messageId: waitMsg.message_id }, `[❗] Failed retrying ...`)
                .then(async () => {
                    sendLog(bot, `10 Sec Err for user-> id: ${msg.from.id} username: @${username} firstname: ${firstname} lastname: ${lastname}`)
                    if (queryInProgress["retries"] > 3) {
                        return msg.reply.text("[❌] An Error has occured, please contact the bot admin.")
                    }
                    queryInProgress["retries"]++
                    execute(bot, msg, null, SelectedCategory, waitMsg)
                })
                .catch(console.log)
        }, 15 * 1000)
        queryInProgress["retries"] = 0
        queryInProgress[msg.from.id] = true
        const videoNum = randInt(0, videos[SelectedCategory].length)
        const filename = videos[SelectedCategory][videoNum]
        const filepath = path.join(path.resolve(__dirname, '..'), `assets/videos/${SelectedCategory}/${filename}`)
        console.log(videoNum, filepath)

        bot.sendVideo(msg.from.id, filepath, {caption: "🍑@superology_bot🤤"})
            .then(async () => {
                clearTimeout(dl_timeout)
                bot.deleteMessage(msg.from.id, waitMsg.message_id).catch(console.log)
                bot.successfulVideoQueries++
                await updateAllsuccessfulVideoQueries(userID)
                queryInProgress[msg.from.id] = false
                updateAllSentQueries(userID)
                    .catch((e) => sendLog(bot, `UserID: ${userID}\nQuery: ${msg.text}\n${JSON.stringify(e)}`))
            })
            .catch(err => {
                console.log(err);
                sendLog(bot, `UserID: ${userID}\nQuery: ${msg.text}\n${JSON.stringify(err)}`)
            })
    }
}