const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits
} = require('discord.js');
const { sendModLog } = require('../../util/mod');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unmute')
    .setDescription('Retirer le timeout (mute) d\'un membre')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption(o => o.setName('membre').setDescription('Membre à unmuter').setRequired(true))
    .addStringOption(o => o.setName('raison').setDescription('Raison').setRequired(false)),

  async execute(interaction) {
    const target = interaction.options.getMember('membre');
    const raison = interaction.options.getString('raison') || 'Aucune raison';
    const guild  = interaction.guild;
    const mod    = interaction.member;

    if (!target) return interaction.reply({ content: 'Membre introuvable.', ephemeral: true });
    if (!target.isCommunicationDisabled())
      return interaction.reply({ content: 'Ce membre n’est pas muté.', ephemeral: true });

    await target.timeout(null, `[${mod.user.tag}] ${raison}`);

    await sendModLog(guild, {
      type: 'UNMUTE',
      target: target.user,
      moderator: mod.user,
      reason: raison,
      color: 0x2ecc71
    });

    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(0x2ecc71)
          .setTitle('🔊 Unmute')
          .setDescription(`**${target.user.tag}** n’est plus muté.`)
          .addFields({ name: 'Raison', value: raison })
          .setThumbnail(target.user.displayAvatarURL())
          .setTimestamp()
      ]
    });
  }
};
