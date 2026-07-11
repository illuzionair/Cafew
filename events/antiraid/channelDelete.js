const { Events, AuditLogEvent } = require('discord.js');
const { antiraidCheck } = require('../../util/antiraid');

module.exports = {
  name: Events.ChannelDelete,
  async execute(channel) {
    if (!channel.guild) return;
    await antiraidCheck({
      guild: channel.guild,
      dbKey: 'channelsdel',
      auditAction: AuditLogEvent.ChannelDelete,
      reason: `Suppression de salon : ${channel.name}`
    });
  }
};
