const { Events, AuditLogEvent } = require('discord.js');
const { QuickDB } = require('quick.db');
const { getAuditExecutor, isWhitelisted, applySanction } = require('../../util/antiraid');
const db = new QuickDB();

module.exports = {
  name: Events.GuildMemberAdd,
  customName: 'guildBotAdd',
  async execute(member) {
    if (!member.user.bot) return;
    const guild = member.guild;
    const guildId = guild.id;

    const active = await db.get(`bot_${guildId}`);
    if (!active) return;

    const sanction = await db.get(`botsanction_${guildId}`) || 'ban';
    const wlEnabled = await db.get(`botwl_${guildId}`);

    // Expulser le bot ajouté
    await member.ban({ reason: '[Antiraid] Ajout de bot non autorisé' }).catch(() => {});

    // Punir celui qui l'a ajouté
    const executor = await getAuditExecutor(guild, AuditLogEvent.BotAdd);
    if (!executor) return;
    if (executor.id === guild.ownerId) return;
    if (!wlEnabled && await isWhitelisted(guildId, executor.id)) return;

    await applySanction(executor, sanction, `[Antiraid] Ajout de bot : ${member.user.tag}`);
  }
};
