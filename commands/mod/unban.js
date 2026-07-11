const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits
} = require('discord.js');
const { sendModLog } = require('../../util/mod');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unban')
    .setDescription('Lever le ban d\'un utilisateur')
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addStringOption(o => o.setName('userid').setDescription('ID Discord de l\'utilisateur').setRequired(true))
    .addStringOption(o => o.setName('raison').setDescription('Raison').setRequired(false)),

  async execute(interaction) {
    const userId = interaction.options.getString('userid');
    const raison = interaction.options.getString('raison') || 'Aucune raison';
    const guild  = interaction.guild;
    const mod    = interaction.member;

    let banned;
    try {
      banned = await guild.bans.fetch(userId);
    } catch {
      return interaction.reply({ content: 'Cet utilisateur n’est pas banni.', ephemeral: true });
    }

    await guild.bans.remove(userId, `[${mod.user.tag}] ${raison}`);

    await sendModLog(guild, {
      type: 'UNBAN',
      target: banned.user,
      moderator: mod.user,
      reason: raison,
      color: 0x2ecc71
    });

    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(0x2ecc71)
          .setTitle('✅ Unban')
          .setDescription(`**${banned.user.tag}** a été débanni.`)
          .addFields({ name: 'Raison', value: raison })
          .setTimestamp()
      ]
    });
  }
};
