const { EmbedBuilder } = require('discord.js');
const { sendLog } = require('../../util/sendLog');

module.exports = {
  name: 'userUpdate',
  async execute(oldUser, newUser) {
    // On doit retrouver dans quels serveurs communs logger
    const guilds = newUser.client.guilds.cache.filter(g => g.members.cache.has(newUser.id));

    for (const [, guild] of guilds) {
      // Changement d'avatar
      if (oldUser.avatar !== newUser.avatar) {
        const embed = new EmbedBuilder()
          .setTitle('🖼️ Avatar modifié')
          .setColor(0x9b59b6)
          .addFields(
            { name: 'Utilisateur', value: `<@${newUser.id}> (${newUser.tag})`, inline: true },
          )
          .setThumbnail(newUser.displayAvatarURL({ size: 256 }))
          .setImage(oldUser.displayAvatarURL({ size: 256 }))
          .setFooter({ text: 'En haut: nouveau • En bas: ancien' })
          .setTimestamp();
        await sendLog(newUser.client, guild.id, 'profil', embed);
      }

      // Changement de pseudo global (username)
      if (oldUser.username !== newUser.username) {
        const embed = new EmbedBuilder()
          .setTitle('✏️ Pseudo modifié')
          .setColor(0x3498db)
          .setThumbnail(newUser.displayAvatarURL({ size: 128 }))
          .addFields(
            { name: 'Utilisateur', value: `<@${newUser.id}>`, inline: true },
            { name: 'Ancien pseudo', value: oldUser.username, inline: true },
            { name: 'Nouveau pseudo', value: newUser.username, inline: true },
          )
          .setTimestamp();
        await sendLog(newUser.client, guild.id, 'profil', embed);
      }
    }
  }
};
