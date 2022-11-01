const { getUser } = require('./database')

function sendToUser(bot, msg, sender_firstname, chat_id, message) {
    bot.sendMessage(chat_id, `[❗️] Sent by Admin => ${sender_firstname}:\n\n${message}`)
        .then(() => {
            msg.reply.text(`Message sent\n\nchatID: ${chat_id}\n\nContent:\n${message}`)
        })
        .catch(err => msg.reply.text(`[❗️] Error Sending message: ${err.message}`)) 
}

function searchUser(msg) {
    getUser(msg.text.split(' ')[1])
        .then(res => msg.reply.text(`[User]:\n   username: ${res.username}\n   firstname= ${res.firstname}\n   lastname= ${!res.lastname ? null : res.lastname}\n   user_id= ${res.user_id}\n   chat_id= ${res.chat_id}\n success= ${res.success}\n all=${res.all} `))
        .catch(err => msg.reply.text(`[!] Failed : ${err}`))
}

module.exports = {
    searchUser: searchUser,
    sendToUser: sendToUser
}
