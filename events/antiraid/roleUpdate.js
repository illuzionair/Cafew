const { Events, AuditLogEvent, PermissionFlagsBits } = require('discord.js');
const { antiraidCheck, getAuditExecutor, isWhitelisted, applySanction } = require('../../util/antiraid');
const { QuickDB } = require('quick.db');
const db = new QuickDB();

// Permissions considérées comme "dangereuses"
const DANGEROUS_PERMS = [
  PermissionFlagsBits.Administrator,
  PermissionFlagsBits.ManageGuild,
  PermissionFlagsBits.ManageRoles,
  PermissionFlagsBits.ManageChannels,
  PermissionFlagsBits.BanMembers,
  PermissionFlagsBits.KickMembers,
  PermissionFlagsBits.ManageWebhooks,
  PermissionFlagsBits.MentionEveryone,
];

module.exports = {
  name: Events.GuildRoleUpdate,
  async execute(oldRole, newRole) {
    const guild = newRole.guild;
    const guildId = guild.id;

    // Vérif ajout de permissions dangereuses → module rolesadd
    const addedPerms = newRole.permissions.toArray().filter(p =>
      !oldRole.permissions.has(p) && DANGEROUS_PERMS.some(dp => PermissionFlagsBits[p] === dp || newRole.permissions.has(dp))
    );
    const gainedDangerous = DANGEROUS_PERMS.some(dp =>
      newRole.permissions.has(dp) && !oldRole.permissions.has(dp)
    );

    if (gainedDangerous) {
      await antiraidCheck({
        guild,
        dbKey: 'rolesadd',
        auditAction: AuditLogEvent.RoleUpdate,
        reason: `Ajout de permissions dangereuses au rôle : ${newRole.name}`
      });
    } else {
      // Modification simple du rôle
      await antiraidCheck({
        guild,
        dbKey: 'rolesmod',
        auditAction: AuditLogEvent.RoleUpdate,
        reason: `Modification de rôle : ${newRole.name}`
      });
    }
  }
};
