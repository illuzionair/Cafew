const { Events, AuditLogEvent } = require('discord.js');
const { QuickDB } = require('quick.db');
const { getAuditExecutor, isWhitelisted, applySanction } = require('../../util/antiraid');
const db = new QuickDB();

// Stockage des compteurs de bans par guild/user pour la limite
const banCounters = new Map(); // `${guildId}_${userId}` → { count, timer }

module.exports = {
  name: Events.GuildBanAdd,
  async execute(ban) {
    const guild = ban.guild;
    const guildId = guild.id;

    const active = await db.get(`massban_${guildId}`);
    if (!active) return;

    const sanction = await db.get(`massbansanction_${guildId}`) || 'ban';
    const wlEnabled = await db.get(`massbanwl_${guildId}`);
    const limit    = parseInt(await db.get(`massbannum_${guildId}`)) || 3;
    const timeMs   = parseInt(await db.get(`massbantime_${guildId}`)) || 10000;

    const member = await getAuditExecutor(guild, AuditLogEvent.MemberBanAdd);
    if (!member) return;
    if (member.id === guild.ownerId) return;
    if (!wlEnabled && await isWhitelisted(guildId, member.id)) return;

    const key = `${guildId}_${member.id}`;
    if (!banCounters.has(key)) {
      banCounters.set(key, { count: 0 });
      setTimeout(() => banCounters.delete(key), timeMs);
    }
    const counter = banCounters.get(key);
    counter.count++;

    if (counter.count >= limit) {
      banCounters.delete(key);
      await applySanction(member, sanction, `[Antiraid] Mass-ban détecté (${counter.count} bans)`);
    }
  }
};
