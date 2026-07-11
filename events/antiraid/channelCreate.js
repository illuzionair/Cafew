const { Events, AuditLogEvent } = require('discord.js');
const { antiraidCheck } = require('../../util/antiraid');

module.exports = {
  name: Events.ChannelCreate,
  async execute(channel) {
    if (!channel.guild) return;
    await antiraidCheck({
      guild: channel.guild,
      dbKey: 'channelscreate',
      auditAction: AuditLogEvent.ChannelCreate,
      reason: `Création de salon : ${channel.name}`
    });
  }
};
