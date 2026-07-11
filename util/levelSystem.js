const { QuickDB } = require('quick.db');
const db = new QuickDB();

function getGrade(level, config) {
  const grades = [...config.grades].sort((a, b) => b.minLevel - a.minLevel);
  return grades.find(g => level >= g.minLevel) || config.grades[0];
}

async function addXp(guildId, userId, config) {
  const xpGain = Math.floor(Math.random() * (config.xpPerMessage.max - config.xpPerMessage.min + 1)) + config.xpPerMessage.min;
  const xpKey = `xp_${guildId}_${userId}`;
  const lvlKey = `level_${guildId}_${userId}`;

  let xp = (await db.get(xpKey)) || 0;
  let level = (await db.get(lvlKey)) || 1;

  xp += xpGain;
  const xpNeeded = level * config.xpPerLevel;

  let levelUp = false;
  if (xp >= xpNeeded) {
    xp -= xpNeeded;
    level++;
    levelUp = true;
    await db.set(lvlKey, level);
  }

  await db.set(xpKey, xp);
  return { levelUp, newLevel: level, newXp: xp, xpNeeded: level * config.xpPerLevel };
}

async function getUserData(guildId, userId, config) {
  const xp = (await db.get(`xp_${guildId}_${userId}`)) || 0;
  const level = (await db.get(`level_${guildId}_${userId}`)) || 1;
  const xpNeeded = level * config.xpPerLevel;
  const grade = getGrade(level, config);
  return { xp, level, xpNeeded, grade };
}

module.exports = { addXp, getUserData, getGrade };
