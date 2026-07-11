const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { QuickDB } = require('quick.db');
const { isOwnerBot } = require('../../util/checkPerm');
const db = new QuickDB();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('owner')
    .setDescription('Gestion des owners bot (owner config only)')
    .addSubcommand(sub =>
      sub.setName('add').setDescription('Ajouter un owner bot')
        .addUserOption(o => o.setName('membre').setDescription('Membre a ajouter').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('remove').setDescription('Retirer un owner bot')
        .addUserOption(o => o.setName('membre').setDescription('Membre a retirer').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('list').setDescription('Lister les owners bot')
    )
    .addSubcommand(sub =>
      sub.setName('clear').setDescription('Supprimer tous les owners bot ajoutés')
    ),

  async execute(interaction) {
    if (!interaction.client.config.owner.includes(interaction.user.id)) {
      return interaction.reply({ content: 'Commande reservee au owner config.json.', ephemeral: true });
    }

    const sub = interaction.options.getSubcommand();
    const botId = interaction.client.user.id;

    if (sub === 'add') {
      const user = interaction.options.getUser('membre');
      if (await isOwnerBot(interaction.client, user.id))
        return interaction.reply({ content: `${user.username} est deja owner bot.`, ephemeral: true });
      await db.set(`ownermd_${botId}_${user.id}`, true);
      return interaction.reply({ content: `${user.username} est maintenant owner bot.`, ephemeral: true });
    }

    if (sub === 'remove') {
      const user = interaction.options.getUser('membre');
      if (!await db.get(`ownermd_${botId}_${user.id}`))
        return interaction.reply({ content: `${user.username} n est pas owner bot.`, ephemeral: true });
      await db.delete(`ownermd_${botId}_${user.id}`);
      return interaction.reply({ content: `${user.username} n est plus owner bot.`, ephemeral: true });
    }

    if (sub === 'clear') {
      const all = await db.startsWith(`ownermd_${botId}_`);
      for (const entry of all) await db.delete(entry.id);
      return interaction.reply({ content: `${all.length} owner(s) supprime(s).`, ephemeral: true });
    }

    if (sub === 'list') {
      await interaction.deferReply({ ephemeral: true });
      const all = await db.startsWith(`ownermd_${botId}_`);
      if (all.length === 0) return interaction.editReply('Aucun owner bot configuré.');
      const lines = all.map((e, i) => {
        const uid = e.id.split('_')[2];
        return `${i + 1}. <@${uid}> (${uid})`;
      });
      const embed = new EmbedBuilder()
        .setTitle('Owners Bot')
        .setDescription(lines.join('\n'))
        .setColor(interaction.client.config.color);
      return interaction.editReply({ embeds: [embed] });
    }
  }
};
