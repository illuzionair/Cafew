const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { writeFileSync, readFileSync } = require('fs');
const path = require('path');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setgrade')
    .setDescription('Configure un grade du systeme de niveau (1 a 5)')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addIntegerOption(opt =>
      opt.setName('numero').setDescription('Numero du grade (1 a 5)').setRequired(true).setMinValue(1).setMaxValue(5)
    )
    .addStringOption(opt =>
      opt.setName('nom').setDescription('Nom du grade').setRequired(true)
    )
    .addIntegerOption(opt =>
      opt.setName('niveau_min').setDescription('Niveau minimum pour ce grade').setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('couleur').setDescription('Couleur hex ex: #f1c40f').setRequired(false)
    )
    .addRoleOption(opt =>
      opt.setName('role').setDescription('Role Discord a attribuer').setRequired(false)
    ),

  async execute(interaction) {
    const index = interaction.options.getInteger('numero') - 1;
    const nom = interaction.options.getString('nom');
    const niveauMin = interaction.options.getInteger('niveau_min');
    const couleur = interaction.options.getString('couleur');
    const role = interaction.options.getRole('role');

    const configPath = path.join(process.cwd(), 'config.json');
    const config = JSON.parse(readFileSync(configPath, 'utf8'));

    config.grades[index] = {
      name: nom,
      minLevel: niveauMin,
      color: couleur || config.grades[index]?.color || '#5865F2',
      roleId: role ? role.id : (config.grades[index]?.roleId || null)
    };
    config.grades.sort((a, b) => a.minLevel - b.minLevel);
    writeFileSync(configPath, JSON.stringify(config, null, 2));
    interaction.client.config = config;

    const g = config.grades[index];
    const embed = new EmbedBuilder()
      .setTitle('Grade mis a jour')
      .setColor(g?.color || '#5865F2')
      .addFields(
        { name: 'Nom', value: nom, inline: true },
        { name: 'Niveau min', value: `${niveauMin}`, inline: true },
        { name: 'Couleur', value: couleur || 'Inchangee', inline: true },
        { name: 'Role', value: role ? role.toString() : 'Aucun', inline: true }
      );
    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
