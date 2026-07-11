const { QuickDB } = require('quick.db');
const db = new QuickDB();

/**
 * Verifie si un membre est owner bot, owner serveur ou a un role admin/owner
 */
async function isOwnerBot(client, userId) {
  if (client.config.owner.includes(userId)) return true;
  const ownerMd = await db.get(`ownermd_${client.user.id}_${userId}`);
  return ownerMd === true;
}

async function hasAdminPerm(client, member) {
  if (await isOwnerBot(client, member.user.id)) return true;
  for (const [, role] of member.roles.cache) {
    const isAdmin = await db.get(`admin_${member.guild.id}_${role.id}`);
    const isOwnerP = await db.get(`ownerp_${member.guild.id}_${role.id}`);
    if (isAdmin || isOwnerP) return true;
  }
  return false;
}

module.exports = { isOwnerBot, hasAdminPerm };
