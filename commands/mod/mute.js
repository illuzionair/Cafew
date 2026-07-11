const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits
} = require('discord.js');
const ms = require('ms');
const { addSanction, sendModLog, dmUser } = require('../../util/mod');

const DURATIONS = [
  { name: '60 secondes', value: '60s' },
  { name: '5 minutes',   value: '5m'  },
  { name: '10 minutes',  value: '10m' },
  { name: '30 minutes',  value: '30m' },
  { name: '1 heure',     value: '1h'  },
  { name: '6 heures',    value: '6h'  },
  { name: '12 heures',   value: '12h' },
  { name: '1 jour',      value: '1d'  },
  { name: '3 jours',     value: '3d'  },
  { name: '1 semaine',   value: '7d'  },
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('mute')
    .setDescription('Mettre en timeout (mute) un membre')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption(o => o.setName('membre').setDescription('Membre à muter').setRequired(true))
    .addStringOption(o =>
      o.setName('duree').setDescription('Durée du mute').setRequired(true)
        .addChoices(...DURATIONS)
    )
    .addStringOption(o => o.setName('raison').setDescription('Raison').setRequired(false)),

  async execute(interaction) {
    const target  = interaction.options.getMember('membre');
    const duree   = interaction.options.getString('duree');
    const raison  = interaction.options.getString('raison') || 'Aucune raison';
    const guild   = interaction.guild;
    const mod     = interaction.member;

    if (!target) return interaction.reply({ content: 'Membre introuvable.', ephemeral: true });
    if (!target.moderatable)
      return interaction.reply({ content: 'Je ne peux pas muter ce membre.', ephemeral: true });
    if (target.id === mod.id)
      return interaction.reply({ content: 'Tu ne peux pas te muter toi-même.', ephemeral: true });

    const durationMs = ms(duree);
    if (!durationMs || durationMs > ms('28d'))
      return interaction.reply({ content: 'Durée invalide (max 28 jours).', ephemeral: true });

    await target.timeout(durationMs, `[${mod.user.tag}] ${raison}`);
    await dmUser(target.user, guild, { type: 'muté', reason: raison, duration: duree });

    const sanctionId = await addSanction(guild.id, target.id, {
      type: 'MUTE',
      reason: raison,
      moderatorId: mod.id,
      duration: duree
    });

    await sendModLog(guild, {
      type: 'MUTE',
      target: target.user,
      moderator: mod.user,
      reason: raison,
      duration: duree,
      color: 0xf39c12
    });

    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(0xf39c12)
          .setTitle('🔇 Mute (Timeout)')
          .setDescription(`**${target.user.tag}** a été muté.`)
          .addFields(
            { name: 'Durée',    value: duree, inline: true },
            { name: 'Raison',   value: raison, inline: true },
            { name: 'ID Sanction', value: `\`${sanctionId}\``, inline: true }
          )
          .setThumbnail(target.user.displayAvatarURL())
          .setTimestamp()
      ]
    });
  }
};
