const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const { readdirSync } = require('fs');
const path = require('path');

const CATEGORY_ICONS = {
  bot:     '🤖',
  config:  '⚙️',
  gestion: '🛡️',
  mod:     '🔨',
  music:   '🎵',
  rank:    '🏆',
};

function loadCategories() {
  const categories = [];
  const baseDir = path.join(__dirname, '..');
  const folders = readdirSync(baseDir);
  for (const folder of folders) {
    const files = readdirSync(path.join(baseDir, folder)).filter(f => f.endsWith('.js'));
    const cmds = [];
    for (const file of files) {
      try {
        const cmd = require(path.join(baseDir, folder, file));
        if (cmd.data) cmds.push({ name: cmd.data.name, description: cmd.data.description || 'Aucune description.' });
      } catch {}
    }
    if (cmds.length > 0) categories.push({ name: folder, cmds });
  }
  return categories;
}

function buildEmbed(categories, page, prefix, config) {
  const cat = categories[page];
  const icon = CATEGORY_ICONS[cat.name] || '📁';
  const total = categories.reduce((acc, c) => acc + c.cmds.length, 0);
  const lines = cat.cmds.map(c => `\`${prefix}${c.name}\` — ${c.description}`).join('\n');
  return new EmbedBuilder()
    .setTitle(`${icon} Commandes — ${cat.name.charAt(0).toUpperCase() + cat.name.slice(1)}`)
    .setDescription(lines)
    .setColor(config.color)
    .setFooter({ text: `Page ${page + 1}/${categories.length} • ${total} commandes au total • Prefix : ${prefix}` })
    .setTimestamp();
}

function buildRow(page, total) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('cmds_prev').setLabel('◀ Précédent').setStyle(ButtonStyle.Secondary).setDisabled(page === 0),
    new ButtonBuilder().setCustomId('cmds_next').setLabel('Suivant ▶').setStyle(ButtonStyle.Secondary).setDisabled(page === total - 1),
  );
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('cmds')
    .setDescription('Liste toutes les commandes du bot par catégorie'),

  async execute(interaction) {
    const config = interaction.client.config;
    const prefix = config.prefix || '+';
    const categories = loadCategories();
    if (categories.length === 0) return interaction.reply({ content: 'Aucune commande trouvée.', ephemeral: true });

    let page = 0;
    const authorId = interaction.user?.id ?? interaction.member?.user?.id;

    // Le bridge retourne le Message directement, la vraie slash retourne undefined
    const sent = await interaction.reply({
      embeds: [buildEmbed(categories, page, prefix, config)],
      components: [buildRow(page, categories.length)]
    });

    let msg = (sent && sent.createMessageComponentCollector) ? sent : null;
    if (!msg && typeof interaction.fetchReply === 'function') {
      msg = await interaction.fetchReply().catch(() => null);
    }
    if (!msg) return;

    const collector = msg.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 120_000,
      filter: (btn) => (btn.user?.id ?? btn.member?.user?.id) === authorId,
    });

    collector.on('collect', async (btn) => {
      if (btn.customId === 'cmds_prev' && page > 0) page--;
      if (btn.customId === 'cmds_next' && page < categories.length - 1) page++;
      await btn.update({
        embeds: [buildEmbed(categories, page, prefix, config)],
        components: [buildRow(page, categories.length)]
      }).catch(() => {});
    });

    collector.on('end', () => {
      const disabledRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('cmds_prev').setLabel('◀ Précédent').setStyle(ButtonStyle.Secondary).setDisabled(true),
        new ButtonBuilder().setCustomId('cmds_next').setLabel('Suivant ▶').setStyle(ButtonStyle.Secondary).setDisabled(true),
      );
      msg.edit({ components: [disabledRow] }).catch(() => {});
    });
  },
};
