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
    const config = interaction.client.config;
    const allLevels = await db.startsWith(`level_${guildId}_`);
    const sorted = allLevels.sort((a, b) => b.value - a.value).slice(0, 10);
    if (sorted.length === 0) return interaction.editReply('Aucun membre classe pour le moment.');
    const lines = [];
    for (let i = 0; i < sorted.length; i++) {
      const uid = sorted[i].id.split('_')[3];
      const level = sorted[i].value;
      const grade = getGrade(level, config);
      const xp = (await db.get(`xp_${guildId}_${uid}`)) || 0;
      const medals = ['🥇','🥈','🥉'];
      const prefix = medals[i] || `**#${i+1}**`;
      lines.push(`${prefix} <@${uid}> — Niv. **${level}** | ${xp} XP | ${grade.name}`);
    }
    const embed = new EmbedBuilder()
      .setTitle(`🏆 Classement de ${interaction.guild.name}`)
      .setDescription(lines.join('\n'))
      .setColor(config.color)
      .setTimestamp();
    await interaction.editReply({ embeds: [embed] });
  }
};
