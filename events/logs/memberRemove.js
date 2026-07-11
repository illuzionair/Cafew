const { EmbedBuilder } = require('discord.js');
const { sendLog } = require('../../util/sendLog');

module.exports = {
  name: 'guildMemberRemove',
  customName: 'logs-memberRemove',
  async execute(member) {
    const roles = member.roles.cache
      .filter(r => r.id !== member.guild.id)
      .map(r => `<@&${r.id}>`).join(', ') || 'Aucun';
    const embed = new EmbedBuilder()
      .setTitle('❌ Membre parti')
      .setColor(0xe74c3c)
      .setThumbnail(member.user.displayAvatarURL({ size: 128 }))
      .addFields(
        { name: 'Membre', value: `<@${member.id}> (${member.user.tag})`, inline: true },
        { name: 'ID', value: member.id, inline: true },
        { name: 'Rôles', value: roles.slice(0, 512) },
      )
      .setTimestamp();
    await sendLog(member.client, member.guild.id, 'membres', embed);
  }
};
