const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { QuickDB } = require('quick.db');
const db = new QuickDB();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setwelcomechannel')
    .setDescription('Definit le canal de bienvenue')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addChannelOption(opt =>
      opt.setName('canal').setDescription('Le canal a utiliser').setRequired(true)
    ),
  async execute(interaction) {
    const channel = interaction.options.getChannel('canal');
    await db.set(`welcomechannel_${interaction.guild.id}`, channel.id);
    await interaction.reply({ content: `Canal de bienvenue defini sur ${channel}`, ephemeral: true });
  }
};
