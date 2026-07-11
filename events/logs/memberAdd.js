const { EmbedBuilder } = require('discord.js');
const { sendLog } = require('../../util/sendLog');

module.exports = {
  name: 'guildMemberAdd',
  customName: 'logs-memberAdd',
  async execute(member) {
    const created = Math.floor(member.user.createdTimestamp / 1000);
    const embed = new EmbedBuilder()
      .setTitle('✅ Membre rejoint')
      .setColor(0x2ecc71)
      .setThumbnail(member.user.displayAvatarURL({ size: 128 }))
      .addFields(
        { name: 'Membre', value: `<@${member.id}> (${member.user.tag})`, inline: true },
        { name: 'ID', value: member.id, inline: true },
        { name: 'Compte créé', value: `<t:${created}:R>`, inline: true },
        { name: 'Membres total', value: `${member.guild.memberCount}`, inline: true },
      )
      .setTimestamp();
    await sendLog(member.client, member.guild.id, 'membres', embed);
  }
};
