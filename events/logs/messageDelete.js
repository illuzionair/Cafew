const { EmbedBuilder, AuditLogEvent } = require('discord.js');
const { sendLog } = require('../../util/sendLog');

module.exports = {
  name: 'messageDelete',
  async execute(message) {
    if (!message.guild || message.author?.bot) return;
    const embed = new EmbedBuilder()
      .setTitle('🗑️ Message supprimé')
      .setColor(0xe74c3c)
      .addFields(
        { name: 'Auteur', value: `<@${message.author?.id}> (${message.author?.tag ?? 'Inconnu'})`, inline: true },
        { name: 'Salon', value: `<#${message.channel.id}>`, inline: true },
        { name: 'Contenu', value: message.content?.slice(0, 1024) || '*Aucun contenu texte*' },
      )
      .setTimestamp();
    await sendLog(message.client, message.guild.id, 'messages', embed);
  }
};
