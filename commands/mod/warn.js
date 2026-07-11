const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits
} = require('discord.js');
const { addSanction, sendModLog, dmUser } = require('../../util/mod');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Avertir un membre')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption(o => o.setName('membre').setDescription('Membre à avertir').setRequired(true))
    .addStringOption(o => o.setName('raison').setDescription('Raison').setRequired(true)),

  async execute(interaction) {
    const target = interaction.options.getMember('membre');
    const raison = interaction.options.getString('raison');
    const guild  = interaction.guild;
    const mod    = interaction.member;

    if (!target) return interaction.reply({ content: 'Membre introuvable.', ephemeral: true });
    if (target.user.bot) return interaction.reply({ content: 'Tu ne peux pas avertir un bot.', ephemeral: true });
    if (target.id === mod.id) return interaction.reply({ content: 'Tu ne peux pas t’avertir toi-même.', ephemeral: true });

    const sanctionId = await addSanction(guild.id, target.id, {
      type: 'WARN',
      reason: raison,
      moderatorId: mod.id
    });

    await dmUser(target.user, guild, { type: 'averti', reason: raison });

    await sendModLog(guild, {
      type: 'WARN',
      target: target.user,
      moderator: mod.user,
      reason: raison,
      color: 0xf1c40f
    });

    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(0xf1c40f)
          .setTitle('⚠️ Avertissement')
          .setDescription(`**${target.user.tag}** a reçu un avertissement.`)
          .addFields(
            { name: 'Raison', value: raison, inline: true },
            { name: 'ID Sanction', value: `\`${sanctionId}\``, inline: true }
          )
          .setThumbnail(target.user.displayAvatarURL())
          .setTimestamp()
      ]
    });
  }
};
