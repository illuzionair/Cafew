const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { QuickDB } = require('quick.db');
const db = new QuickDB();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setleavechannel')
    .setDescription('Definit le canal de depart')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addChannelOption(opt =>
      opt.setName('canal').setDescription('Le canal a utiliser').setRequired(true)
    ),
  async execute(interaction) {
    const channel = interaction.options.getChannel('canal');
    await db.set(`leavechannel_${interaction.guild.id}`, channel.id);
    await interaction.reply({ content: `Canal de depart defini sur ${channel}`, ephemeral: true });
  }
};
