const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { QuickDB } = require('quick.db');
const { getGrade } = require('../../util/levelSystem');
const db = new QuickDB();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('Affiche le classement XP du serveur'),

  async execute(interaction) {
    await interaction.deferReply();
    const guildId = interaction.guild.id;
    const config  = interaction.client.config;

    const allLevels = await db.startsWith(`level_${guildId}_`);
    const sorted = allLevels.sort((a, b) => b.value - a.value);

    if (sorted.length === 0)
      return interaction.editReply('Aucun membre classé pour le moment.');

    const lines = [];
    const medals = ['🥇', '🥈', '🥉'];

    for (const entry of sorted) {
      if (lines.length >= 10) break;

      // Clé format : level_GUILDID_USERID
      const parts  = entry.id.split('_');
      const uid    = parts.slice(2).join('_'); // robuste si userId contient des _
      const level  = entry.value;

      // Vérifie que le membre est encore dans le serveur
      const member = interaction.guild.members.cache.get(uid)
        || await interaction.guild.members.fetch(uid).catch(() => null);
      if (!member) continue;

      const grade  = getGrade(level, config);
      const xp     = (await db.get(`xp_${guildId}_${uid}`)) || 0;
      const i      = lines.length;
      const prefix = medals[i] || `**#${i + 1}**`;

      lines.push(`${prefix} ${member} — Niv. **${level}** | ${xp} XP | ${grade.name}`);
    }

    if (lines.length === 0)
      return interaction.editReply('Aucun membre classé pour le moment.');

    const embed = new EmbedBuilder()
      .setTitle(`🏆 Classement de ${interaction.guild.name}`)
      .setDescription(lines.join('\n'))
      .setColor(config.color)
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  }
};
