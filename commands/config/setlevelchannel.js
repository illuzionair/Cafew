const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { QuickDB } = require('quick.db');
const db = new QuickDB();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setlevelchannel')
    .setDescription('Definit le canal pour les annonces de level up')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addChannelOption(opt =>
      opt.setName('canal').setDescription('Le canal a utiliser').setRequired(true)
    ),
  async execute(interaction) {
    const channel = interaction.options.getChannel('canal');
    await db.set(`levelchannel_${interaction.guild.id}`, channel.id);
    await interaction.reply({ content: `Canal de level up defini sur ${channel}`, ephemeral: true });
  }
};
