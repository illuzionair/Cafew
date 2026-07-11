const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
const { QuickDB } = require('quick.db');
const { generateRankCard } = require('../../util/canvas/rankCard');
const { getUserData } = require('../../util/levelSystem');
const db = new QuickDB();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rank')
    .setDescription('Affiche ta carte de rang ou celle d\'un autre membre')
    .addUserOption(opt =>
      opt.setName('membre')
        .setDescription('Le membre dont tu veux voir le rang')
        .setRequired(false)
    ),

  async execute(interaction) {
    await interaction.deferReply();
    const target = interaction.options.getMember('membre') || interaction.member;
    const guildId = interaction.guild.id;
    const userId = target.user.id;
    const userData = await getUserData(guildId, userId, interaction.client.config);
    const allLevels = await db.startsWith(`level_${guildId}_`);
    const sorted = allLevels.sort((a, b) => b.value - a.value);
    const rank = sorted.findIndex(e => e.id === `level_${guildId}_${userId}`) + 1;
    try {
      const buffer = await generateRankCard(target, userData, rank || 1);
      const attachment = new AttachmentBuilder(buffer, { name: 'rank.png' });
      await interaction.editReply({ files: [attachment] });
    } catch (err) {
      console.error('[RANK CMD]', err);
      await interaction.editReply(`Niveau **${userData.level}** | XP: ${userData.xp}/${userData.xpNeeded} | Grade: **${userData.grade.name}**`);
    }
  }
};
