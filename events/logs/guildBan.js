const { EmbedBuilder } = require('discord.js');
const { sendLog } = require('../../util/sendLog');

module.exports = [
  {
    name: 'guildBanAdd',
    async execute(ban) {
      const embed = new EmbedBuilder()
        .setTitle('🔨 Membre banni')
        .setColor(0xe74c3c)
        .setThumbnail(ban.user.displayAvatarURL({ size: 128 }))
        .addFields(
          { name: 'Utilisateur', value: `<@${ban.user.id}> (${ban.user.tag})`, inline: true },
          { name: 'ID', value: ban.user.id, inline: true },
          { name: 'Raison', value: ban.reason || 'Aucune raison fournie' },
        )
        .setTimestamp();
      await sendLog(ban.client, ban.guild.id, 'moderation', embed);
    }
  },
  {
    name: 'guildBanRemove',
    async execute(ban) {
      const embed = new EmbedBuilder()
        .setTitle('✅ Membre débanni')
        .setColor(0x2ecc71)
        .setThumbnail(ban.user.displayAvatarURL({ size: 128 }))
        .addFields(
          { name: 'Utilisateur', value: `<@${ban.user.id}> (${ban.user.tag})`, inline: true },
          { name: 'ID', value: ban.user.id, inline: true },
        )
        .setTimestamp();
      await sendLog(ban.client, ban.guild.id, 'moderation', embed);
    }
  }
];
