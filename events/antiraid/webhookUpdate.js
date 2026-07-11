const { Events, AuditLogEvent } = require('discord.js');
const { antiraidCheck } = require('../../util/antiraid');

module.exports = {
  name: Events.WebhooksUpdate,
  async execute(channel) {
    if (!channel.guild) return;
    // On détecte création via audit log (WebhookCreate)
    await antiraidCheck({
      guild: channel.guild,
      dbKey: 'webhook',
      auditAction: AuditLogEvent.WebhookCreate,
      reason: `Création de webhook dans : #${channel.name}`
    });
  }
};
