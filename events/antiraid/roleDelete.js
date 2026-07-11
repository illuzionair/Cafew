const { Events, AuditLogEvent } = require('discord.js');
const { antiraidCheck } = require('../../util/antiraid');

module.exports = {
  name: Events.GuildRoleDelete,
  async execute(role) {
    await antiraidCheck({
      guild: role.guild,
      dbKey: 'rolesdel',
      auditAction: AuditLogEvent.RoleDelete,
      reason: `Suppression de rôle : ${role.name}`
    });
  }
};
