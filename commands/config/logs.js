const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { QuickDB } = require('quick.db');
const db = new QuickDB();

const CATEGORIES = [
  { key: 'antiraid',   label: '🛡️ Antiraid' },
  { key: 'serveur',    label: '⚙️ Serveur' },
  { key: 'moderation', label: '🔨 Modération' },
  { key: 'messages',   label: '💬 Messages' },
  { key: 'membres',    label: '👥 Membres' },
  { key: 'profil',     label: '🖼️ Profil (avatar/pseudo)' },
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('logs')
    .setDescription('Configurer les salons de logs')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(sub =>
      sub.setName('set').setDescription('Définir un salon de logs')
        .addStringOption(o => o.setName('categorie').setDescription('Catégorie de logs').setRequired(true)
          .addChoices(...CATEGORIES.map(c => ({ name: c.label, value: c.key })))
        )
        .addChannelOption(o => o.setName('salon').setDescription('Salon texte').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('remove').setDescription('Supprimer un salon de logs')
        .addStringOption(o => o.setName('categorie').setDescription('Catégorie à supprimer').setRequired(true)
          .addChoices(...CATEGORIES.map(c => ({ name: c.label, value: c.key })))
        )
    )
    .addSubcommand(sub =>
      sub.setName('list').setDescription('Voir tous les salons de logs configurés')
    ),

  async execute(interaction) {
    const sub      = interaction.options.getSubcommand();
    const guildId  = interaction.guild.id;
    const color    = interaction.client.config.color;

    if (sub === 'set') {
      const cat = interaction.options.getString('categorie');
      const ch  = interaction.options.getChannel('salon');
      if (!ch) return interaction.reply({ content: 'Salon introuvable.', ephemeral: true });
      await db.set(`logs_${cat}_${guildId}`, ch.id);
      return interaction.reply({ content: `✅ Logs **${cat}** → ${ch}`, ephemeral: true });
    }

    if (sub === 'remove') {
      const cat = interaction.options.getString('categorie');
      await db.delete(`logs_${cat}_${guildId}`);
      return interaction.reply({ content: `🗑️ Logs **${cat}** supprimés.`, ephemeral: true });
    }

    if (sub === 'list') {
      const lines = [];
      for (const c of CATEGORIES) {
        const chId = await db.get(`logs_${c.key}_${guildId}`);
        lines.push(`${c.label}: ${chId ? `<#${chId}>` : '`non configuré`'}`);
      }
      const embed = new EmbedBuilder()
        .setTitle('📋 Configuration des logs')
        .setColor(color)
        .setDescription(lines.join('\n'));
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }
  }
};
