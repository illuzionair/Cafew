const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits
} = require('discord.js');
const { removeSanction, getSanctions } = require('../../util/mod');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unwarn')
    .setDescription('Retirer un avertissement d\'un membre')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption(o => o.setName('membre').setDescription('Membre concerné').setRequired(true))
    .addStringOption(o => o.setName('id').setDescription('ID de la sanction (visible dans /sanctions)').setRequired(true)),

  async execute(interaction) {
    const target     = interaction.options.getUser('membre');
    const sanctionId = parseInt(interaction.options.getString('id'));
    const guild      = interaction.guild;

    if (isNaN(sanctionId)) return interaction.reply({ content: 'ID invalide.', ephemeral: true });

    const removed = await removeSanction(guild.id, target.id, sanctionId);
    if (!removed) return interaction.reply({ content: 'Sanction introuvable avec cet ID.', ephemeral: true });

    const remaining = await getSanctions(guild.id, target.id);

    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(0x2ecc71)
          .setTitle('✅ Avertissement retiré')
          .setDescription(`La sanction \`${sanctionId}\` de **${target.tag}** a été supprimée.`)
          .addFields({ name: 'Sanctions restantes', value: `${remaining.length}`, inline: true })
          .setTimestamp()
      ],
      ephemeral: true
    });
  }
};
