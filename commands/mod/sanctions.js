const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits
} = require('discord.js');
const { getSanctions } = require('../../util/mod');

const TYPE_EMOJI = { BAN: '🔨', KICK: '👢', MUTE: '🔇', WARN: '⚠️', UNMUTE: '🔊' };

module.exports = {
  data: new SlashCommandBuilder()
    .setName('sanctions')
    .setDescription('Voir l\'historique des sanctions d\'un membre')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption(o => o.setName('membre').setDescription('Membre à consulter').setRequired(true)),

  async execute(interaction) {
    const target = interaction.options.getUser('membre');
    const guild  = interaction.guild;

    await interaction.deferReply({ ephemeral: false });

    const list = await getSanctions(guild.id, target.id);

    if (list.length === 0) {
      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(0x2ecc71)
            .setTitle(`Sanctions — ${target.tag}`)
            .setDescription('Aucune sanction enregistrée. ✅')
            .setThumbnail(target.displayAvatarURL())
        ]
      });
    }

    // Pagination basique : 10 par page
    const page = 1;
    const perPage = 10;
    const paginated = list.slice((page - 1) * perPage, page * perPage);

    const lines = paginated.map(s => {
      const emoji = TYPE_EMOJI[s.type] || '📌';
      const date  = `<t:${Math.floor(s.date / 1000)}:d>`;
      const dur   = s.duration ? ` (${s.duration})` : '';
      return `${emoji} \`${s.id}\` — **${s.type}**${dur} ${date}\n» ${s.reason} — <@${s.moderatorId}>`;
    });

    return interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor(0xe74c3c)
          .setTitle(`🛡️ Sanctions — ${target.tag}`)
          .setDescription(lines.join('\n\n'))
          .setThumbnail(target.displayAvatarURL())
          .setFooter({ text: `${list.length} sanction(s) au total • Page ${page}` })
          .setTimestamp()
      ]
    });
  }
};
