const { QuickDB } = require('quick.db');
const { AttachmentBuilder } = require('discord.js');
const { generateWelcomeCard } = require('../../util/canvas/welcomeCard');
const db = new QuickDB();

module.exports = async (client, member) => {
  const guild = member.guild;

  const autoRoleId = await db.get(`autorole_${guild.id}`);
  if (autoRoleId) {
    const role = guild.roles.cache.get(autoRoleId);
    if (role) member.roles.add(role).catch(() => {});
  }

  const channelId = await db.get(`welcomechannel_${guild.id}`);
  if (!channelId) return;
  const channel = guild.channels.cache.get(channelId);
  if (!channel) return;

  try {
    const buffer = await generateWelcomeCard(member, client);
    const attachment = new AttachmentBuilder(buffer, { name: 'welcome.png' });
    const msg = client.config.welcomeMessage
      .replace('{user}', `<@${member.user.id}>`)
      .replace('{username}', member.user.username)
      .replace('{guild}', guild.name)
      .replace('{count}', guild.memberCount);
    channel.send({ content: msg, files: [attachment] });
  } catch (err) {
    console.error('[WELCOME]', err);
  }
};
