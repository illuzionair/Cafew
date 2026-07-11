const { Events, AuditLogEvent } = require('discord.js');
const { QuickDB } = require('quick.db');
const { getAuditExecutor, isWhitelisted, applySanction } = require('../../util/antiraid');
const db = new QuickDB();

const decoCounters = new Map();

module.exports = {
  name: Events.VoiceStateUpdate,
  async execute(oldState, newState) {
    // Antideco : quelqu'un a été déconnecté de force (channel null, channel différent)
    if (!oldState.channelId || newState.channelId) return;
    // La personne déconnectée doit avoir quitté un salon (kick vocal)
    const guild = oldState.guild;
    const guildId = guild.id;

    const active = await db.get(`antideco_${guildId}`);
    if (!active) return;

    const sanction = await db.get(`antidecosanction_${guildId}`) || 'derank';
    const wlEnabled = await db.get(`antidecowl_${guildId}`);
    const limit    = parseInt(await db.get(`antideconum_${guildId}`)) || 3;
    const timeMs   = parseInt(await db.get(`antidecotime_${guildId}`)) || 10000;

    const member = await getAuditExecutor(guild, AuditLogEvent.MemberDisconnect);
    if (!member) return;
    if (member.id === guild.ownerId) return;
    if (!wlEnabled && await isWhitelisted(guildId, member.id)) return;

    const key = `${guildId}_${member.id}`;
    if (!decoCounters.has(key)) {
      decoCounters.set(key, { count: 0 });
      setTimeout(() => decoCounters.delete(key), timeMs);
    }
    const counter = decoCounters.get(key);
    counter.count++;

    if (counter.count >= limit) {
      decoCounters.delete(key);
      await applySanction(member, sanction, `[Antiraid] Mass-déconnexion vocale (${counter.count})`);
    }
  }
};
