const { Events } = require('discord.js');
const { QuickDB } = require('quick.db');
const ms = require('ms');
const db = new QuickDB();

// Compteur mass-join
const joinCounters = new Map(); // guildId → { count, timer }

module.exports = {
  name: Events.GuildMemberAdd,
  // Nom unique pour éviter conflit avec l'event welcome existant
  customName: 'guildMemberAddAntiraid',
  async execute(member) {
    const guild = member.guild;
    const guildId = guild.id;

    // ── Anti compte trop récent (crealimit) ──
    const crealimitActive = await db.get(`crealimit_${guildId}`);
    if (crealimitActive) {
      const limitTemps = await db.get(`crealimittemps_${guildId}`) || '1d';
      const limitMs = typeof limitTemps === 'number' ? limitTemps : ms(String(limitTemps).replace('j','d')) || ms('1d');
      const accountAge = Date.now() - member.user.createdTimestamp;
      if (accountAge < limitMs) {
        await member.ban({ reason: `[Antiraid] Compte trop récent (créé il y a ${Math.round(accountAge/60000)}min)` }).catch(() => {});
        return;
      }
    }

    // ── Anti mass-join (antitoken) ──
    const antitokenActive = await db.get(`antitoken_${guildId}`);
    if (!antitokenActive) return;

    const limit = parseInt(await db.get(`antitokenlimmit1_${guildId}`)) || 5;
    const timeMs = (() => {
      const raw = db.get(`antitokenlimmit2_${guildId}`);
      if (!raw) return 10000;
      return typeof raw === 'number' ? raw : ms(String(raw).replace('j','d')) || 10000;
    })();

    if (!joinCounters.has(guildId)) {
      joinCounters.set(guildId, { count: 0 });
      setTimeout(() => joinCounters.delete(guildId), timeMs);
    }
    const counter = joinCounters.get(guildId);
    counter.count++;

    if (counter.count >= limit) {
      // Expulse tous les membres récents dans la fenêtre
      joinCounters.delete(guildId);
      await member.kick('[Antiraid] Mass-join détecté').catch(() => {});
    }
  }
};
