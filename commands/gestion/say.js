const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { hasAdminPerm } = require('../../util/checkPerm');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('say')
    .setDescription('Faire dire quelque chose au bot')
    .addStringOption(o =>
      o.setName('message').setDescription('Message a envoyer').setRequired(true)
    )
    .addChannelOption(o =>
      o.setName('salon').setDescription('Salon cible (optionnel)').setRequired(false)
    ),

  async execute(interaction) {
    if (!await hasAdminPerm(interaction.client, interaction.member)) {
      return interaction.reply({ content: 'Permission refusee.', ephemeral: true });
    }

    const text = interaction.options.getString('message');
    const target = interaction.options.getChannel('salon') || interaction.channel;

    if (text.includes('discord.gg/') || text.includes('https://discord.gg/')) {
      return interaction.reply({ content: 'Les liens d invitation Discord sont interdits.', ephemeral: true });
    }
    if ((text.includes('@everyone') || text.includes('@here')) && !interaction.member.permissions.has(PermissionFlagsBits.MentionEveryone)) {
      return interaction.reply({ content: 'Tu n as pas la permission de mentionner @everyone.', ephemeral: true });
    }

    await target.send(text);
    await interaction.reply({ content: `Message envoye dans ${target}.`, ephemeral: true });
  }
};
