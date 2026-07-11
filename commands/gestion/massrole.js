const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { hasAdminPerm } = require('../../util/checkPerm');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('massrole')
    .setDescription('Ajouter ou retirer un role a tous les membres')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addSubcommand(sub =>
      sub.setName('add').setDescription('Ajouter un role a tous')
        .addRoleOption(o => o.setName('role').setDescription('Le role a ajouter').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('remove').setDescription('Retirer un role a tous')
        .addRoleOption(o => o.setName('role').setDescription('Le role a retirer').setRequired(true))
    ),

  async execute(interaction) {
    if (!await hasAdminPerm(interaction.client, interaction.member)) {
      return interaction.reply({ content: 'Permission refusee.', ephemeral: true });
    }

    await interaction.deferReply({ ephemeral: true });
    const sub = interaction.options.getSubcommand();
    const role = interaction.options.getRole('role');
    const members = await interaction.guild.members.fetch();
    let count = 0;

    for (const [, member] of members) {
      if (member.user.bot) continue;
      try {
        if (sub === 'add' && !member.roles.cache.has(role.id)) {
          await member.roles.add(role);
          count++;
        } else if (sub === 'remove' && member.roles.cache.has(role.id)) {
          await member.roles.remove(role);
          count++;
        }
        // Petit delai pour eviter le rate limit
        await new Promise(r => setTimeout(r, 300));
      } catch {}
    }

    const action = sub === 'add' ? 'ajoute a' : 'retire de';
    return interaction.editReply(`Role **${role.name}** ${action} **${count}** membre(s).`);
  }
};
