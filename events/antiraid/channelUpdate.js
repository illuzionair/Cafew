const { Events, AuditLogEvent } = require('discord.js');
const { antiraidCheck } = require('../../util/antiraid');

module.exports = {
  name: Events.ChannelUpdate,
  async execute(oldChannel, newChannel) {
    if (!newChannel.guild) return;
    await antiraidCheck({
      guild: newChannel.guild,
      dbKey: 'channelsmod',
      auditAction: AuditLogEvent.ChannelUpdate,
      reason: `Modification de salon : ${newChannel.name}`
    });
  }
};
