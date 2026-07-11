const { EmbedBuilder } = require('discord.js');
const { sendLog } = require('../../util/sendLog');

module.exports = {
  name: 'messageUpdate',
  async execute(oldMsg, newMsg) {
    if (!newMsg.guild || newMsg.author?.bot) return;
    if (oldMsg.content === newMsg.content) return;
    const embed = new EmbedBuilder()
      .setTitle('✏️ Message modifié')
      .setColor(0xf39c12)
      .addFields(
        { name: 'Auteur', value: `<@${newMsg.author?.id}> (${newMsg.author?.tag ?? 'Inconnu'})`, inline: true },
        { name: 'Salon', value: `<#${newMsg.channel.id}>`, inline: true },
        { name: 'Avant', value: oldMsg.content?.slice(0, 512) || '*Vide*' },
        { name: 'Après', value: newMsg.content?.slice(0, 512) || '*Vide*' },
      )
      .setURL(newMsg.url)
      .setTimestamp();
    await sendLog(newMsg.client, newMsg.guild.id, 'messages', embed);
  }
};
