const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits
} = require('discord.js');
const { addSanction, sendModLog, dmUser } = require('../../util/mod');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Expulser un membre du serveur')
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
    .addUserOption(o => o.setName('membre').setDescription('Membre à expulser').setRequired(true))
    .addStringOption(o => o.setName('raison').setDescription('Raison du kick').setRequired(false)),

  async execute(interaction) {
    const target = interaction.options.getMember('membre');
    const raison = interaction.options.getString('raison') || 'Aucune raison';
    const guild  = interaction.guild;
    const mod    = interaction.member;

    if (!target) return interaction.reply({ content: 'Membre introuvable.', ephemeral: true });
    if (!target.kickable)
      return interaction.reply({ content: 'Je ne peux pas expulser ce membre.', ephemeral: true });
    if (target.id === mod.id)
      return interaction.reply({ content: 'Tu ne peux pas t’expulser toi-même.', ephemeral: true });

    await dmUser(target.user, guild, { type: 'expulsé', reason: raison });
    await target.kick(`[${mod.user.tag}] ${raison}`);

    const sanctionId = await addSanction(guild.id, target.id, {
      type: 'KICK',
      reason: raison,
      moderatorId: mod.id
    });

    await sendModLog(guild, {
      type: 'KICK',
      target: target.user,
      moderator: mod.user,
      reason: raison,
      color: 0xe67e22
    });

    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(0xe67e22)
          .setTitle('👢 Expulsion')
          .setDescription(`**${target.user.tag}** a été expulsé.`)
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
