const { QuickDB } = require('quick.db');
const { AttachmentBuilder } = require('discord.js');
const { addXp, getGrade } = require('../../util/levelSystem');
const { generateRankCard } = require('../../util/canvas/rankCard');
const db = new QuickDB();

const cooldowns = new Map();

module.exports = async (client, message) => {
  if (!message.guild || message.author.bot) return;
  if (message.content.startsWith(client.config.prefix)) return;

  const userId = message.author.id;
  const guildId = message.guild.id;
  const cooldownKey = `${guildId}_${userId}`;
  const now = Date.now();

  if (cooldowns.has(cooldownKey) && now - cooldowns.get(cooldownKey) < 60000) return;
  cooldowns.set(cooldownKey, now);

  const { levelUp, newLevel, newXp, xpNeeded } = await addXp(guildId, userId, client.config);
  if (!levelUp) return;

  const grade = getGrade(newLevel, client.config);
  if (grade && grade.roleId) {
    const role = message.guild.roles.cache.get(grade.roleId);
    if (role && !message.member.roles.cache.has(role.id)) {
      message.member.roles.add(role).catch(() => {});
      const oldGrades = client.config.grades.filter(g => g.roleId && g.roleId !== grade.roleId);
      for (const g of oldGrades) {
        if (message.member.roles.cache.has(g.roleId)) {
          message.member.roles.remove(g.roleId).catch(() => {});
        }
      }
    }
  }

  const channelId = await db.get(`levelchannel_${guildId}`);
  const channel = channelId ? message.guild.channels.cache.get(channelId) : message.channel;
  if (!channel) return;

  try {
    const allLevels = await db.startsWith(`level_${guildId}_`);
    const sorted = allLevels.sort((a, b) => b.value - a.value);
    const rank = sorted.findIndex(e => e.id === `level_${guildId}_${userId}`) + 1;
    const userData = { level: newLevel, xp: newXp, xpNeeded, grade };
    const buffer = await generateRankCard(message.member, userData, rank || 1);
    const attachment = new AttachmentBuilder(buffer, { name: 'levelup.png' });
    const msg = client.config.levelMessage
      .replace('{user}', `<@${userId}>`)
      .replace('{username}', message.author.username)
      .replace('{level}', newLevel)
      .replace('{grade}', grade.name);
    channel.send({ content: msg, files: [attachment] });
  } catch (err) {
    console.error('[LEVELUP]', err);
  }
};
