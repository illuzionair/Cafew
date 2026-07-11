const { QuickDB } = require('quick.db');
const { AttachmentBuilder } = require('discord.js');
const { generateLeaveCard } = require('../../util/canvas/leaveCard');
const db = new QuickDB();

module.exports = async (client, member) => {
  const guild = member.guild;
  const channelId = await db.get(`leavechannel_${guild.id}`);
  if (!channelId) return;
  const channel = guild.channels.cache.get(channelId);
  if (!channel) return;

  try {
    const buffer = await generateLeaveCard(member, client);
    const attachment = new AttachmentBuilder(buffer, { name: 'leave.png' });
    const msg = client.config.leaveMessage
      .replace('{user}', `<@${member.user.id}>`)
      .replace('{username}', member.user.username)
      .replace('{guild}', guild.name)
      .replace('{count}', guild.memberCount);
    channel.send({ content: msg, files: [attachment] });
  } catch (err) {
    console.error('[LEAVE]', err);
  }
};
