const Database = require('../database')
const { sendLog } = require('../utils')
module.exports = {
    name: 'status',
    async execute(bot, msg) {
        if (msg.isAdmin)
            Database.getStatus()
                .then(async res => {
                    const statusData = `
                    Users: ${res.users}\n\n
                    Memory:\n${"\t".repeat(4)} 
                        All ${bot.queriesSinceStart}\n\n

                    Database:\n ${"\t".repeat(4)}
                        All ${res.all} \n
                        Success ${res.success} \n
                        `
                    msg.reply.text(statusData).catch(console.log)
                })
                .catch((e) => sendLog(bot, `User: ${msg.from.id}\nQuery: ${msg.query}\nError: ${JSON.stringify(e)}`))
    }
}
// SEE MORE INFORMATION AT : 🌐 https://github.com/mullwar/telebot