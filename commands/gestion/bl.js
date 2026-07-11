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
    .setName('bl')
    .setDescription('Gestion de la blacklist (bannissement automatique)')
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addSubcommand(sub =>
      sub.setName('add').setDescription('Ajouter un membre à la blacklist')
        .addUserOption(o => o.setName('membre').setDescription('Membre à blacklister').setRequired(true))
        .addStringOption(o => o.setName('raison').setDescription('Raison').setRequired(false))
    )
    .addSubcommand(sub =>
      sub.setName('remove').setDescription('Retirer un membre de la blacklist')
        .addUserOption(o => o.setName('membre').setDescription('Membre à retirer').setRequired(true))
    )
    .addSubcommand(sub => sub.setName('list').setDescription('Voir la blacklist'))
    .addSubcommand(sub => sub.setName('clear').setDescription('Vider la blacklist')),

  async execute(interaction) {
    if (!await isOwnerBot(interaction.client, interaction.user.id)) {
      return interaction.reply({ content: 'Tu dois être owner bot.', ephemeral: true });
    }

    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;

    if (sub === 'add') {
      const user = interaction.options.getUser('membre');
      const raison = interaction.options.getString('raison') || 'Aucune raison';
      const already = await db.get(`bl_${guildId}_${user.id}`);
      if (already) return interaction.reply({ content: `${user.tag} est déjà blacklisté.`, ephemeral: true });
      await db.set(`bl_${guildId}_${user.id}`, { raison, addedBy: interaction.user.id, date: Date.now() });
      // Tenter de ban si le membre est sur le serveur
      await interaction.guild.members.ban(user.id, { reason: `[Blacklist] ${raison}` }).catch(() => {});
      return interaction.reply({ content: `🔨 **${user.tag}** blacklisté et banni. Raison: ${raison}`, ephemeral: true });
    }

    if (sub === 'remove') {
      const user = interaction.options.getUser('membre');
      const exists = await db.get(`bl_${guildId}_${user.id}`);
      if (!exists) return interaction.reply({ content: `${user.tag} n'est pas blacklisté.`, ephemeral: true });
      await db.delete(`bl_${guildId}_${user.id}`);
      await interaction.guild.bans.remove(user.id).catch(() => {});
      return interaction.reply({ content: `✅ **${user.tag}** retiré de la blacklist et unban.`, ephemeral: true });
    }

    if (sub === 'clear') {
      const all = await db.startsWith(`bl_${guildId}_`);
      for (const e of all) await db.delete(e.id);
      return interaction.reply({ content: `🗑️ **${all.length}** membre(s) retirés de la blacklist.`, ephemeral: true });
    }

    if (sub === 'list') {
      await interaction.deferReply({ ephemeral: true });
      const all = await db.startsWith(`bl_${guildId}_`);
      if (all.length === 0) return interaction.editReply('La blacklist est vide.');
      const lines = all.map((e, i) => {
        const uid = e.id.replace(`bl_${guildId}_`, '');
        const data = e.value || {};
        return `${i + 1}. <@${uid}> — ${data.raison || '?'} (par <@${data.addedBy || '?'}>)`;
      });
      return interaction.editReply({ embeds: [
        new EmbedBuilder()
          .setTitle(`Blacklist — ${all.length} membre(s)`)
          .setColor(0xe74c3c)
          .setDescription(lines.join('\n'))
      ]});
    }
  }
};
