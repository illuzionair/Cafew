const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
  ChannelType
} = require('discord.js');
const { QuickDB } = require('quick.db');
const db = new QuickDB();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('modlog')
    .setDescription('Configurer le salon des logs de modération')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(sub =>
      sub.setName('set').setDescription('Définir le salon de logs')
        .addChannelOption(o =>
          o.setName('salon').setDescription('Salon texte').addChannelTypes(ChannelType.GuildText).setRequired(true)
        )
    )
    .addSubcommand(sub => sub.setName('disable').setDescription('Désactiver les logs de modération')),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;

    if (sub === 'set') {
      const ch = interaction.options.getChannel('salon');
      await db.set(`modlog_${guildId}`, ch.id);
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0x3498db)
            .setDescription(`✅ Les logs de modération seront envoyés dans ${ch}.`)
        ],
        ephemeral: true
      });
    }

    if (sub === 'disable') {
      await db.delete(`modlog_${guildId}`);
      return interaction.reply({ content: '❌ Logs de modération désactivés.', ephemeral: true });
    }
  }
};
