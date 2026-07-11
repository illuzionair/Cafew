const { QuickDB } = require('quick.db');
const db = new QuickDB();

/**
 * Envoie un embed dans le salon de logs configuré pour la catégorie donnée.
 * @param {Client} client
 * @param {string} guildId
 * @param {string} category  antiraid | serveur | moderation | messages | membres | profil
 * @param {EmbedBuilder} embed
 */
async function sendLog(client, guildId, category, embed) {
  const channelId = await db.get(`logs_${category}_${guildId}`);
  if (!channelId) return;
  const channel = client.channels.cache.get(channelId);
  if (!channel) return;
  channel.send({ embeds: [embed] }).catch(() => {});
}

module.exports = { sendLog };
