const { Events, AuditLogEvent } = require('discord.js');
const { antiraidCheck } = require('../../util/antiraid');

module.exports = {
  name: Events.GuildUpdate,
  async execute(oldGuild, newGuild) {
    await antiraidCheck({
      guild: newGuild,
      dbKey: 'update',
      auditAction: AuditLogEvent.GuildUpdate,
      reason: `Modification du serveur : ${newGuild.name}`
    });
  }
};
