const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { isOwnerBot } = require('../../util/checkPerm');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('server')
    .setDescription('Gestion des serveurs du bot (owner only)')
    .addSubcommand(sub =>
      sub.setName('list').setDescription('Liste tous les serveurs du bot')
    )
    .addSubcommand(sub =>
      sub.setName('leave').setDescription('Faire quitter un serveur au bot')
        .addStringOption(o => o.setName('id').setDescription('ID ou nom du serveur').setRequired(false))
    )
    .addSubcommand(sub =>
      sub.setName('invite').setDescription('Generer un lien d invitation vers un serveur')
        .addStringOption(o => o.setName('id').setDescription('ID ou nom du serveur').setRequired(true))
    ),

  async execute(interaction) {
    if (!await isOwnerBot(interaction.client, interaction.user.id)) {
      return interaction.reply({ content: 'Tu dois etre owner bot.', ephemeral: true });
    }

    await interaction.deferReply({ ephemeral: true });
    const sub = interaction.options.getSubcommand();
    const client = interaction.client;

    if (sub === 'list') {
      const guilds = [...client.guilds.cache.values()];
      const lines = guilds.map((g, i) => `${i + 1}. **${g.name}** (${g.id}) — ${g.memberCount} membres`);
      const chunks = [];
      while (lines.length) chunks.push(lines.splice(0, 20).join('\n'));
      const embed = new EmbedBuilder()
        .setTitle(`Serveurs (${client.guilds.cache.size})`)
        .setDescription(chunks[0] || 'Aucun')
        .setColor(client.config.color);
      return interaction.editReply({ embeds: [embed] });
    }

    if (sub === 'leave') {
      const query = interaction.options.getString('id') || interaction.guildId;
      const guild = client.guilds.cache.get(query) ||
        client.guilds.cache.find(g => g.name.toLowerCase().includes(query.toLowerCase()));
      if (!guild) return interaction.editReply(`Aucun serveur trouvé pour \`${query}\`.`);
      await guild.leave();
      return interaction.editReply(`J ai quitte le serveur **${guild.name}**.`);
    }

    if (sub === 'invite') {
      const query = interaction.options.getString('id');
      const guild = client.guilds.cache.get(query) ||
        client.guilds.cache.find(g => g.name.toLowerCase().includes(query.toLowerCase()));
      if (!guild) return interaction.editReply(`Aucun serveur trouvé pour \`${query}\`.`);
      const channel = guild.channels.cache.find(
        ch => ch.isTextBased() && ch.permissionsFor(guild.members.me).has('CreateInstantInvite')
      );
      if (!channel) return interaction.editReply('Impossible de creer une invitation sur ce serveur.');
      const invite = await channel.createInvite({ temporary: false, maxAge: 0 });
      return interaction.editReply(invite.url);
    }
  }
};
