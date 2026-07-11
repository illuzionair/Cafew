const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits
} = require('discord.js');
const { addSanction, sendModLog, dmUser } = require('../../util/mod');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Bannir un membre du serveur')
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addUserOption(o => o.setName('membre').setDescription('Membre à bannir').setRequired(true))
    .addStringOption(o => o.setName('raison').setDescription('Raison du ban').setRequired(false))
    .addIntegerOption(o => o.setName('supprimer').setDescription('Supprimer les messages des X derniers jours (0-7)').setMinValue(0).setMaxValue(7).setRequired(false)),

  async execute(interaction) {
    const target  = interaction.options.getMember('membre');
    const raison  = interaction.options.getString('raison') || 'Aucune raison';
    const delDays = interaction.options.getInteger('supprimer') || 0;
    const guild   = interaction.guild;
    const mod     = interaction.member;

    if (!target) return interaction.reply({ content: 'Membre introuvable.', ephemeral: true });
    if (!target.bannable)
      return interaction.reply({ content: 'Je ne peux pas bannir ce membre (rôle supérieur ou non bannable).', ephemeral: true });
    if (target.id === mod.id)
      return interaction.reply({ content: 'Tu ne peux pas te bannir toi-même.', ephemeral: true });

    await dmUser(target.user, guild, { type: 'banni', reason: raison });
    await target.ban({ reason: `[${mod.user.tag}] ${raison}`, deleteMessageSeconds: delDays * 86400 });

    const sanctionId = await addSanction(guild.id, target.id, {
      type: 'BAN',
      reason: raison,
      moderatorId: mod.id
    });

    await sendModLog(guild, {
      type: 'BAN',
      target: target.user,
      moderator: mod.user,
      reason: raison,
      color: 0xe74c3c
    });

    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(0xe74c3c)
          .setTitle('🔨 Bannissement')
          .setDescription(`**${target.user.tag}** a été banni.`)
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
