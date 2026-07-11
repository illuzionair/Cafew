const { QuickDB } = require('quick.db');
const db = new QuickDB();

/**
 * Vérifie si un user est whitelisté pour l'antiraid sur ce serveur.
 */
async function isWhitelisted(guildId, userId) {
  return await db.get(`wl_${guildId}_${userId}`) === true;
}

/**
 * Applique la sanction antiraid sur un membre.
 * @param {GuildMember} member
 * @param {'ban'|'kick'|'derank'} sanction
 * @param {string} reason
 */
async function applySanction(member, sanction, reason) {
  if (!member || !member.manageable) return;
  try {
    if (sanction === 'ban') {
      await member.ban({ reason, deleteMessageSeconds: 0 });
    } else if (sanction === 'kick') {
      await member.kick(reason);
    } else if (sanction === 'derank') {
      const roles = member.roles.cache.filter(r => r.id !== member.guild.id && r.managed === false);
      for (const [, role] of roles) {
        await member.roles.remove(role, reason).catch(() => {});
      }
    }
  } catch (e) {
    // member already left or no perms
  }
}

/**
 * Récupère le GuildMember depuis un audit log entry.
 * @param {Guild} guild
 * @param {import('discord.js').AuditLogEvent} action
 * @returns {Promise<GuildMember|null>}
 */
async function getAuditExecutor(guild, action) {
  try {
    await new Promise(r => setTimeout(r, 500));
    const logs = await guild.fetchAuditLogs({ limit: 1, type: action });
    const entry = logs.entries.first();
    if (!entry) return null;
    if (Date.now() - entry.createdTimestamp > 5000) return null;
    return guild.members.fetch(entry.executor.id).catch(() => null);
  } catch {
    return null;
  }
}

/**
 * Logique commune antiraid :
 * - vérifie si module actif
 * - récupère l'executor via audit log
 * - vérifie si l'executor est l'owner ou whitelisté
 * - applique la sanction
 */
async function antiraidCheck({
  guild,
  dbKey,          // ex: 'rolescreate'
  auditAction,    // AuditLogEvent.RoleCreate
  reason          // string affiché dans la sanction
}) {
  const guildId = guild.id;
  const active = await db.get(`${dbKey}_${guildId}`);
  if (!active) return;

  const sanction = await db.get(`${dbKey}sanction_${guildId}`) || 'derank';
  const wlEnabled = await db.get(`${dbKey}wl_${guildId}`); // true = WL ne bypass PAS

  const member = await getAuditExecutor(guild, auditAction);
  if (!member) return;

  // Jamais punir l'owner du serveur
  if (member.id === guild.ownerId) return;
  // Jamais punir le bot lui-même
  if (member.user.bot && member.id === guild.members.me?.id) return;

  // Si wlEnabled est null → la WL bypass (les whitelistés sont épargnés)
  if (!wlEnabled) {
    if (await isWhitelisted(guildId, member.id)) return;
  }
  // Si wlEnabled est true → WL ne bypass pas, tout le monde est puni

  await applySanction(member, sanction, `[Antiraid] ${reason}`);
}

module.exports = { isWhitelisted, applySanction, getAuditExecutor, antiraidCheck };
