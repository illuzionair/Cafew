const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits
} = require('discord.js');
const { QuickDB } = require('quick.db');
const { isOwnerBot } = require('../../util/checkPerm');
const db = new QuickDB();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('wl')
    .setDescription('Gestion de la whitelist antiraid')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(sub =>
      sub.setName('add').setDescription('Ajouter un membre à la whitelist')
        .addUserOption(o => o.setName('membre').setDescription('Membre à ajouter').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('remove').setDescription('Retirer un membre de la whitelist')
        .addUserOption(o => o.setName('membre').setDescription('Membre à retirer').setRequired(true))
    )
    .addSubcommand(sub => sub.setName('list').setDescription('Voir la whitelist'))
    .addSubcommand(sub => sub.setName('clear').setDescription('Vider la whitelist')),

  async execute(interaction) {
    if (!await isOwnerBot(interaction.client, interaction.user.id)) {
      return interaction.reply({ content: 'Tu dois être owner bot.', ephemeral: true });
    }

    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;

    if (sub === 'add') {
      const user = interaction.options.getUser('membre');
      const already = await db.get(`wl_${guildId}_${user.id}`);
      if (already) return interaction.reply({ content: `${user.tag} est déjà en whitelist.`, ephemeral: true });
      await db.set(`wl_${guildId}_${user.id}`, true);
      return interaction.reply({ content: `✅ **${user.tag}** ajouté à la whitelist antiraid.`, ephemeral: true });
    }

    if (sub === 'remove') {
      const user = interaction.options.getUser('membre');
      const exists = await db.get(`wl_${guildId}_${user.id}`);
      if (!exists) return interaction.reply({ content: `${user.tag} n'est pas en whitelist.`, ephemeral: true });
      await db.delete(`wl_${guildId}_${user.id}`);
      return interaction.reply({ content: `✅ **${user.tag}** retiré de la whitelist.`, ephemeral: true });
    }

    if (sub === 'clear') {
      const all = await db.startsWith(`wl_${guildId}_`);
      for (const e of all) await db.delete(e.id);
      return interaction.reply({ content: `🗑️ **${all.length}** membre(s) retirés de la whitelist.`, ephemeral: true });
    }

    if (sub === 'list') {
      await interaction.deferReply({ ephemeral: true });
      const all = await db.startsWith(`wl_${guildId}_`);
      if (all.length === 0) return interaction.editReply('La whitelist est vide.');
      const lines = all.map((e, i) => {
        const uid = e.id.replace(`wl_${guildId}_`, '');
        return `${i + 1}. <@${uid}> (\`${uid}\`)`;
      });
      return interaction.editReply({ embeds: [
        new EmbedBuilder()
          .setTitle(`Whitelist antiraid — ${all.length} membre(s)`)
          .setColor(interaction.client.config.color)
          .setDescription(lines.join('\n'))
      ]});
    }
  }
};
