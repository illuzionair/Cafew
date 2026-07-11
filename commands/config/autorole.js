const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { QuickDB } = require('quick.db');
const db = new QuickDB();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('autorole')
    .setDescription('Definit le role attribue automatiquement a l\'arrivee')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addRoleOption(opt =>
      opt.setName('role').setDescription('Le role a attribuer').setRequired(true)
    ),
  async execute(interaction) {
    const role = interaction.options.getRole('role');
    await db.set(`autorole_${interaction.guild.id}`, role.id);
    await interaction.reply({ content: `Auto-role defini sur ${role}`, ephemeral: true });
  }
};
