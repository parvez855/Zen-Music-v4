// commands/prefix/autoplay.js
const { EmbedBuilder } = require('discord.js');
const Server = require('../../models/Server');
const shiva = require('../../shiva');

const COMMAND_SECURITY_TOKEN = shiva.SECURITY_TOKEN;

module.exports = {
    name: "autoplay",
    description: "Enable or disable autoplay mode",
    usage: "?autoplay [d]",
    securityToken: COMMAND_SECURITY_TOKEN,

    async execute(message, args, client) {
        if (!shiva || !shiva.validateCore || !shiva.validateCore()) {
            const embed = new EmbedBuilder()
                .setDescription('❌ System core offline - Command unavailable')
                .setColor('#FF0000');
            return message.reply({ embeds: [embed] }).catch(() => {});
        }

        message.shivaValidated = true;
        message.securityToken = COMMAND_SECURITY_TOKEN;

        const ConditionChecker = require('../../utils/checks');
        const checker = new ConditionChecker(client);

        try {
            const conditions = await checker.checkMusicConditions(
                message.guild.id,
                message.author.id,
                message.member.voice?.channelId
            );

            const canUse = await checker.canUseMusic(message.guild.id, message.author.id);
            if (!canUse) {
                const embed = new EmbedBuilder()
                    .setDescription('❌ You need DJ permissions to change autoplay settings!')
                    .setColor('Red');
                return message.reply({ embeds: [embed] })
                    .then(msg => setTimeout(() => msg.delete().catch(() => {}), 3000));
            }

            // args চেক করব
            const enabled = !(args[0] && args[0].toLowerCase() === "d");

            // MongoDB তে save করব
            await Server.findByIdAndUpdate(message.guild.id, {
                'settings.autoplay': enabled
            }, { upsert: true });

            if (conditions.hasActivePlayer) {
                const player = conditions.player;
                player.setAutoplay = enabled;
            }

            const embed = new EmbedBuilder()
                .setDescription(`🎲 Autoplay **${enabled ? 'enabled' : 'disabled'}**`)
                .setColor('Green');
            return message.reply({ embeds: [embed] })
                .then(msg => setTimeout(() => msg.delete().catch(() => {}), 3000));

        } catch (error) {
            console.error('Autoplay prefix command error:', error);
            const embed = new EmbedBuilder()
                .setDescription('❌ An error occurred while toggling autoplay!')
                .setColor('Red');
            return message.reply({ embeds: [embed] })
                .then(msg => setTimeout(() => msg.delete().catch(() => {}), 3000));
        }
    }
};
