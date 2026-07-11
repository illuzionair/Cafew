const { Events } = require('discord.js');
const { QuickDB } = require('quick.db');
const { isWhitelisted, applySanction } = require('../../util/antiraid');
const db = new QuickDB();

const INVITE_REGEX = /discord(?:\.gg|app\.com\/invite)\/[a-zA-Z0-9]+/i;
const LINK_REGEX   = /https?:\/\/[^\s]+/i;

module.exports = {
  name: Events.MessageCreate,
  customName: 'messageCreate_antilink',
  async execute(message) {
    if (!message.guild || message.author.bot) return;
    const guildId = message.guild.id;

    const active = await db.get(`link_${guildId}`);
    if (!active) return;

    const type    = await db.get(`linktype_${guildId}`) || 'invite';
    const wlEnabled = await db.get(`linkwl_${guildId}`);

    const hasInvite = INVITE_REGEX.test(message.content);
    const hasLink   = LINK_REGEX.test(message.content);

    const triggered = type === 'all' ? hasLink : hasInvite;
    if (!triggered) return;

    // Supprimer le message
    await message.delete().catch(() => {});

    if (message.author.id === message.guild.ownerId) return;
    if (!wlEnabled && await isWhitelisted(guildId, message.author.id)) return;

    const member = await message.guild.members.fetch(message.author.id).catch(() => null);
    if (!member) return;

    await applySanction(member, 'kick', '[Antiraid] Envoi de lien interdit');
  }
};
