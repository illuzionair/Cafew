const { EmbedBuilder, AuditLogEvent } = require('discord.js');
const { sendLog } = require('../../util/sendLog');

// Mappe les actions audit vers nos catégories
const ACTION_MAP = {
  // Serveur
  [AuditLogEvent.GuildUpdate]:          { cat: 'serveur',    title: '⚙️ Serveur modifié' },
  [AuditLogEvent.ChannelCreate]:        { cat: 'serveur',    title: '📢 Salon créé' },
  [AuditLogEvent.ChannelUpdate]:        { cat: 'serveur',    title: '📝 Salon modifié' },
  [AuditLogEvent.ChannelDelete]:        { cat: 'serveur',    title: '🗑️ Salon supprimé' },
  [AuditLogEvent.RoleCreate]:           { cat: 'serveur',    title: '🏷️ Rôle créé' },
  [AuditLogEvent.RoleUpdate]:           { cat: 'serveur',    title: '✏️ Rôle modifié' },
  [AuditLogEvent.RoleDelete]:           { cat: 'serveur',    title: '🗑️ Rôle supprimé' },
  [AuditLogEvent.WebhookCreate]:        { cat: 'serveur',    title: '🔗 Webhook créé' },
  [AuditLogEvent.WebhookDelete]:        { cat: 'serveur',    title: '🗑️ Webhook supprimé' },
  [AuditLogEvent.BotAdd]:               { cat: 'serveur',    title: '🤖 Bot ajouté' },
  // Modération
  [AuditLogEvent.MemberKick]:           { cat: 'moderation', title: '👢 Membre kické' },
  [AuditLogEvent.MemberPrune]:          { cat: 'moderation', title: '🧹 Membres prunés' },
  [AuditLogEvent.MemberUpdate]:         { cat: 'moderation', title: '🔇 Membre modifié (timeout/rôle)' },
  [AuditLogEvent.MemberRoleUpdate]:     { cat: 'moderation', title: '🏷️ Rôles mis à jour' },
  // Antiraid (actions de masse)
  [AuditLogEvent.ChannelOverwriteCreate]: { cat: 'antiraid', title: '🛡️ Permission créée' },
  [AuditLogEvent.ChannelOverwriteUpdate]: { cat: 'antiraid', title: '🛡️ Permission modifiée' },
  [AuditLogEvent.ChannelOverwriteDelete]: { cat: 'antiraid', title: '🛡️ Permission supprimée' },
};

module.exports = {
  name: 'guildAuditLogEntryCreate',
  async execute(entry, guild) {
    const info = ACTION_MAP[entry.action];
    if (!info) return;

    const executor = entry.executor;
    const target   = entry.target;

    const embed = new EmbedBuilder()
      .setTitle(info.title)
      .setColor(info.cat === 'antiraid' ? 0xe74c3c : info.cat === 'moderation' ? 0xe67e22 : 0x3498db)
      .addFields(
        { name: 'Exécuteur', value: executor ? `<@${executor.id}> (${executor.tag})` : 'Inconnu', inline: true },
        { name: 'Cible', value: target?.toString?.()?.slice(0, 100) ?? target?.id ?? 'Inconnue', inline: true },
        { name: 'Raison', value: entry.reason || 'Aucune raison fournie' },
      )
      .setTimestamp();

    // Détails des changements
    if (entry.changes?.length > 0) {
      const changes = entry.changes.slice(0, 5).map(c =>
        `**${c.key}**: ${String(c.old ?? 'N/A').slice(0, 50)} → ${String(c.new ?? 'N/A').slice(0, 50)}`
      ).join('\n');
      embed.addFields({ name: 'Changements', value: changes });
    }

    await sendLog(guild.client, guild.id, info.cat, embed);
  }
};
