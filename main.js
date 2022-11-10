const TeleBot = require('telebot')
const fs = require('fs');
const path = require('path');
require('dotenv').config()
const { isBanned, toggleBlackList, getStatus, getUser, addUser, updateAll, updateSuccess } = require('./database')
const token = process.env.API_KEY
const bot = new TeleBot({
    token: token,
    usePlugins: ['floodProtection',]
})
const admin = require('./admin')
const status = []
const count = { all: 0, success: 0 }
const admins = process.env.ADMINS.split(",").map(Number)
const categories = ['amature', 'anal', 'bdsm', 'blacked', 'blowjob', 'boobs', 'brazzers', 'creampie', 'gif', 'irani', 'massage', 'milf', 'public', 'random', 'teen', 'threesome', 'tiktok']
// < --- Custom Functions --- >
function randInt(min, max) { // min and max included 
    return Math.floor(Math.random() * (max - min + 1) + min)
}

const send_log = (bot, msg) => {
    bot.sendMessage(process.env.LOG_CHANNEL_ID, msg).catch(console.log)
}
const getDir = (dir) => {
    return new Promise((resolve, reject) => {
        fs.readdir(dir, (err, files) => {
            if (err) reject(err)
            resolve(files)
        })
    })

}

var videos = {  }
categories.forEach(async category => {
    const files = await getDir(`./videos/${category}/`)
    videos[category] = files
    console.log(`[>] ${category} files loaded.`);
})

// < --- End --- >

process.on('unhandledRejection', error => {
    console.log(error)
    // pass
});

bot.on(['/start', '/hello'], (msg) => msg.reply.text('Salam Eshgham').catch(console.log))

bot.on('/user', msg => {
    const is_admin = (admins.indexOf(msg.from.id) >= 0)
    if (is_admin) {
        admin.searchUser(msg)
    }
})

bot.on('/joom', msg => {
    const is_admin = (admins.indexOf(msg.from.id) >= 0)
    if (is_admin)
        getStatus()
            .then(res => {
                bot.sendMessage(msg.from.id ,`Users: ${res.users}\n\nMemory:\n${"\t".repeat(4)} All ${count.all} \n${"\t".repeat(4)} Success ${count.success} \n\nDatabase:\n ${"\t".repeat(4)}All ${res.all} \n${"\t".repeat(4)} Success ${res.success}`)
            })
            .catch((e) => send_log(bot, `User: ${msg.from.id}\nQuery: ${msg.query}\nError: ${JSON.stringify(e)}`))
})

bot.on('/send', async msg => {
    const is_admin = (admins.indexOf(msg.from.id) >= 0)
    try {
        if (is_admin) {
            const query = msg.text.split('\n')
            const user_id = query[0].split(' ')[1]
            const sender = await getUser(msg.from.id)
            query.shift()
            admin.sendToUser(bot, msg, sender.firstname, user_id, query.join('\n'))
        }
    }
    catch (e) {
        send_log(bot, `User: ${msg.from.id}\nQuery: ${msg.query}\nError: ${JSON.stringify(e)}`)
    }
})

bot.on(/\/toggleBlackList(.*)/, async (msg, match) => {
    const is_admin = (admins.indexOf(msg.from.id) >= 0)
    if (!is_admin) return 
    const targetId = match.match[1].split(" ")[1]
    console.log(`Added to Blacklist: ${targetId}`)
    const status = await toggleBlackList(targetId)
    if (status) {
        getUser(targetId).then(user => {
            msg.reply.text(`User with Id ${targetId} has been ${user.banned ? 'added to' : 'removed from'} Blacklist`).then(message => {
                bot.sendMessage(targetId, user.banned ? `⚠️ شما وارد لیست سیاه شدید و دیگر امکان استفاده از ربات را ندارید.
                در صورت نیاز با ادمین در ارتباط باشید.
                @NiGhTFuRyZz`: `🌹 شما از لیست سیاه خارج شدید.`)
            }).catch(e => console.log(e))
            
        })
    }

})

async function main(msg, category, previous_message=null) {
        if (previous_message)
            bot.deleteMessage(msg.chat.id, previous_message.message_id).catch(console.log)
        // <-- pre-checks -->
        const is_banned = await isBanned(msg.from.id)
        if (is_banned) return
        console.log(category)
        // console.log(videos)
        function sendChannelJoinErr() {
            const message = `ناموسا برای حمایت از ما و استفاده از ربات لطفا اول تو کانالمون عضو شو 🙂🌹\n 😹 @nemesisdevteam 🍑`
            bot.sendMessage(msg.from.id, message).catch(err => console.log(err))
            return
        }
        const memebership = await bot.getChatMember(-1001404127129, msg.from.id)
        if (!["member", "administrator", "creator"].includes(memebership.status)){
            sendChannelJoinErr()
            return
        }
        if (status[msg.from.id]) {
            msg.reply.text("[❗] Please wait until your last query is completed.").catch(console.log)
            return
        }
        // < --- User Details --- >
        count.all++
        const chatID = msg.chat.id
        const userID = msg.from.id
        const username = msg.from.username
        const firstname = msg.from.first_name
        const lastname = !msg.from.last_name ? null : msg.from.last_name
        // < --- End --- >
        const waitMsg = await bot.sendMessage(chatID, "[🔞] Thinking ...").catch(console.log)
        addUser(username, firstname, lastname, userID, chatID)
            .then(() => {
                updateAll(userID)
                    .catch((e) => send_log(bot, `UserID: ${userID}\nQuery: ${msg.text}\n${JSON.stringify(e)}`))
            })
            .catch((e) => send_log(bot, `UserID: ${userID}\nQuery: ${msg.text}\n${JSON.stringify(e)}`))

        // < --- End --- >
        status[msg.from.id] = true
        const videoNum = randInt(0, videos[category].length)
        const filename = videos[category][videoNum]
        const filepath = path.join(__dirname, `videos/${category}/${filename}`)
        console.log(videoNum, filepath)

        // Timeout Error Handle
        const dl_timeout = setTimeout(() => {
            status[msg.from.id] = false
            bot.editMessageText({ chatId: chatID, messageId: waitMsg.message_id }, `[❗] Failed retrying ...`)
                .then(() => {
                    send_log(bot, `10 Sec Err for user-> id: ${msg.from.id} username: @${username} firstname: ${firstname} lastname: ${lastname}`)
                    main(msg, category, waitMsg)
                })
                .catch(console.log)
        }, 7000)
        // < -- End -- >
        // < -- Send Video -- > 
        bot.sendVideo(msg.from.id, filepath, {caption: "🍑@superology_bot🤤"})
            .then(() => {
                clearTimeout(dl_timeout)
                bot.deleteMessage(msg.from.id, waitMsg.message_id).catch(console.log)
                count.success++
                status[msg.from.id] = false
                updateSuccess(userID)
                    .catch((e) => send_log(bot, `UserID: ${userID}\nQuery: ${msg.text}\n${JSON.stringify(e)}`))
            })
            .catch(err => send_log(bot, `UserID: ${userID}\nQuery: ${msg.text}\n${JSON.stringify(e)}`))
        // < -- End -- >
}

categories.forEach(async category => {
    bot.on(`/${category}`, async (msg) => {
        main(msg, category)
    })

})

bot.start()