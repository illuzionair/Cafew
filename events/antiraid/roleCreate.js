const { Events, AuditLogEvent } = require('discord.js');
const { antiraidCheck } = require('../../util/antiraid');

module.exports = {
  name: Events.GuildRoleCreate,
  async execute(role) {
    await antiraidCheck({
      guild: role.guild,
      dbKey: 'rolescreate',
      auditAction: AuditLogEvent.RoleCreate,
      reason: `Création de rôle : ${role.name}`
    });
  }
};
