const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('grades')
    .setDescription('Affiche les 5 grades configures'),

  async execute(interaction) {
    const config = interaction.client.config;
    const fields = config.grades.map((g, i) => ({
      name: `Grade ${i+1} — ${g.name}`,
      value: `Niveau min: **${g.minLevel}** | Couleur: \`${g.color}\` | Role: ${g.roleId ? `<@&${g.roleId}>` : 'Aucun'}`,
      inline: false
    }));
    const embed = new EmbedBuilder()
      .setTitle('Grades configures')
      .setColor(config.color)
      .addFields(fields)
      .setFooter({ text: 'Modifiable avec /setgrade' });
    await interaction.reply({ embeds: [embed] });
  }
};
