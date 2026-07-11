const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
  ChannelType
} = require('discord.js');
const { QuickDB } = require('quick.db');
const { hasAdminPerm } = require('../../util/checkPerm');
const db = new QuickDB();

const COUNTER_TYPES = [
  { key: 'members',  label: '👥 Membres',    template: '👥 Membres : {count}' },
  { key: 'bots',     label: '🤖 Bots',       template: '🤖 Bots : {count}' },
  { key: 'humans',   label: '🧑 Humains',    template: '🧑 Humains : {count}' },
  { key: 'vocal',    label: '🔊 Vocal',       template: '🔊 En vocal : {count}' },
  { key: 'channels', label: '📚 Salons',      template: '📚 Salons : {count}' },
  { key: 'roles',    label: '🏷️ Rôles',      template: '🏷️ Rôles : {count}' },
];

async function getCount(guild, key) {
  switch (key) {
    case 'members':  return guild.memberCount;
    case 'channels': return guild.channels.cache.size;
    case 'roles':    return guild.roles.cache.size;
    // Pour bots/humans/vocal on a besoin du cache members
    case 'bots':     return guild.members.cache.filter(m => m.user.bot).size;
    case 'humans':   return guild.members.cache.filter(m => !m.user.bot).size;
    case 'vocal':    return guild.members.cache.filter(m => m.voice.channelId).size;
    default:         return 0;
  }
}

async function updateCounter(guild, key, db) {
  const chId = await db.get(`counter_${key}_${guild.id}`);
  if (!chId) return;
  const ch = guild.channels.cache.get(chId);
  if (!ch) return;
  const count = await getCount(guild, key);
  const tmpl = await db.get(`counter_${key}_template_${guild.id}`) ||
    COUNTER_TYPES.find(t => t.key === key).template;
  await ch.setName(tmpl.replace('{count}', count)).catch(() => {});
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('counter')
    .setDescription('Configurer les compteurs de membres dans des salons vocaux')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(sub =>
      sub.setName('set').setDescription('Définir un salon compteur')
        .addStringOption(o => o.setName('type').setDescription('Type de compteur').setRequired(true)
          .addChoices(...COUNTER_TYPES.map(t => ({ name: t.label, value: t.key })))
        )
        .addChannelOption(o => o.setName('salon').setDescription('Salon vocal à utiliser').addChannelTypes(ChannelType.GuildVoice).setRequired(true))
        .addStringOption(o => o.setName('template').setDescription('Template ex: 👥 Membres: {count}').setRequired(false))
    )
    .addSubcommand(sub =>
      sub.setName('remove').setDescription('Supprimer un compteur')
        .addStringOption(o => o.setName('type').setDescription('Type à supprimer').setRequired(true)
          .addChoices(...COUNTER_TYPES.map(t => ({ name: t.label, value: t.key })))
        )
    )
    .addSubcommand(sub => sub.setName('list').setDescription('Voir les compteurs actifs'))
    .addSubcommand(sub => sub.setName('refresh').setDescription('Forcer la mise à jour de tous les compteurs')),

  async execute(interaction) {
    if (!await hasAdminPerm(interaction.client, interaction.member)) {
      return interaction.reply({ content: 'Permission refusée.', ephemeral: true });
    }

    const sub = interaction.options.getSubcommand();
    const guild = interaction.guild;

    if (sub === 'set') {
      const key  = interaction.options.getString('type');
      const ch   = interaction.options.getChannel('salon');
      const tmpl = interaction.options.getString('template');
      if (!ch) return interaction.reply({ content: 'Salon introuvable. Mentionne un salon vocal.', ephemeral: true });
      await db.set(`counter_${key}_${guild.id}`, ch.id);
      if (tmpl) await db.set(`counter_${key}_template_${guild.id}`, tmpl);
      await updateCounter(guild, key, db);
      return interaction.reply({ content: `Compteur **${key}** configuré sur ${ch} !`, ephemeral: true });
    }

    if (sub === 'remove') {
      const key = interaction.options.getString('type');
      await db.delete(`counter_${key}_${guild.id}`);
      await db.delete(`counter_${key}_template_${guild.id}`);
      return interaction.reply({ content: `Compteur **${key}** supprimé.`, ephemeral: true });
    }

    if (sub === 'list') {
      await interaction.deferReply({ ephemeral: true });
      const lines = [];
      for (const t of COUNTER_TYPES) {
        const chId = await db.get(`counter_${t.key}_${guild.id}`);
        const ch = chId ? guild.channels.cache.get(chId) : null;
        lines.push(`${t.label}: ${ch ? `<#${ch.id}>` : ':x:'}`);
      }
      return interaction.editReply({ embeds: [
        new EmbedBuilder()
          .setTitle('Compteurs actifs')
          .setColor(interaction.client.config.color)
          .setDescription(lines.join('\n'))
      ]});
    }

    if (sub === 'refresh') {
      await interaction.deferReply({ ephemeral: true });
      for (const t of COUNTER_TYPES) await updateCounter(guild, t.key, db);
      return interaction.editReply('Tous les compteurs ont été mis à jour !');
    }
  },

  updateCounter
};
