const { EmbedBuilder, AuditLogEvent } = require('discord.js');
const { QuickDB } = require('quick.db');
const db = new QuickDB();

/**
 * Enregistre une sanction en DB.
 */
async function addSanction(guildId, targetId, { type, reason, moderatorId, duration = null }) {
  const key = `sanctions_${guildId}_${targetId}`;
  const list = (await db.get(key)) || [];
  const id = Date.now();
  list.push({ id, type, reason, moderatorId, duration, date: id });
  await db.set(key, list);
  return id;
}

/**
 * Supprime une sanction par ID.
 */
async function removeSanction(guildId, targetId, sanctionId) {
  const key = `sanctions_${guildId}_${targetId}`;
  const list = (await db.get(key)) || [];
  const newList = list.filter(s => s.id !== sanctionId);
  await db.set(key, newList);
  return list.length !== newList.length;
}

/**
 * Récupère toutes les sanctions d'un utilisateur.
 */
async function getSanctions(guildId, targetId) {
  return (await db.get(`sanctions_${guildId}_${targetId}`)) || [];
}

/**
 * Envoie un log de modération dans le salon de logs configuré.
 */
async function sendModLog(guild, { type, target, moderator, reason, duration = null, color = 0xe74c3c }) {
  const logChannelId = await db.get(`modlog_${guild.id}`);
  if (!logChannelId) return;
  const ch = guild.channels.cache.get(logChannelId);
  if (!ch) return;

  const embed = new EmbedBuilder()
    .setColor(color)
    .setTitle(`🛡️ Sanction — ${type}`)
    .addFields(
      { name: '👤 Membre', value: `${target.tag || target} (\`${target.id || target}\`)`, inline: true },
      { name: '👮 Modérateur', value: `${moderator.tag} (\`${moderator.id}\`)`, inline: true },
      { name: '📝 Raison', value: reason || 'Aucune raison', inline: false },
    )
    .setTimestamp()
    .setFooter({ text: guild.name, iconURL: guild.iconURL() });

  if (duration) embed.addFields({ name: '⏱️ Durée', value: duration, inline: true });

  await ch.send({ embeds: [embed] }).catch(() => {});
}

/**
 * Tente d'envoyer un DM à l'utilisateur sanctionné.
 */
async function dmUser(user, guild, { type, reason, duration = null }) {
  const embed = new EmbedBuilder()
    .setColor(0xe74c3c)
    .setTitle(`Tu as été ${type} sur ${guild.name}`)
    .addFields(
      { name: 'Raison', value: reason || 'Aucune raison' },
    );
  if (duration) embed.addFields({ name: 'Durée', value: duration });
  await user.send({ embeds: [embed] }).catch(() => {});
}

module.exports = { addSanction, removeSanction, getSanctions, sendModLog, dmUser };
