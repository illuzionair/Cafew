const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { QuickDB } = require('quick.db');
const { isOwnerBot } = require('../../util/checkPerm');
const db = new QuickDB();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('perm')
    .setDescription('Gerer les roles admin/owner du serveur')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(sub =>
      sub.setName('addadmin').setDescription('Ajouter un role admin')
        .addRoleOption(o => o.setName('role').setDescription('Role a promouvoir admin').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('removeadmin').setDescription('Retirer un role admin')
        .addRoleOption(o => o.setName('role').setDescription('Role a retirer').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('addowner').setDescription('Ajouter un role owner serveur')
        .addRoleOption(o => o.setName('role').setDescription('Role a promouvoir owner').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('removeowner').setDescription('Retirer un role owner serveur')
        .addRoleOption(o => o.setName('role').setDescription('Role a retirer').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('list').setDescription('Lister les roles admin/owner')
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;
    const role = interaction.options.getRole('role');
    const color = interaction.client.config.color;

    if (sub === 'addadmin') {
      await db.set(`admin_${guildId}_${role.id}`, true);
      return interaction.reply({ content: `${role} est maintenant **admin**.`, ephemeral: true });
    }
    if (sub === 'removeadmin') {
      await db.delete(`admin_${guildId}_${role.id}`);
      return interaction.reply({ content: `${role} n est plus admin.`, ephemeral: true });
    }
    if (sub === 'addowner') {
      await db.set(`ownerp_${guildId}_${role.id}`, true);
      return interaction.reply({ content: `${role} est maintenant **owner serveur**.`, ephemeral: true });
    }
    if (sub === 'removeowner') {
      await db.delete(`ownerp_${guildId}_${role.id}`);
      return interaction.reply({ content: `${role} n est plus owner serveur.`, ephemeral: true });
    }
    if (sub === 'list') {
      await interaction.deferReply({ ephemeral: true });
      const admins = await db.startsWith(`admin_${guildId}_`);
      const owners = await db.startsWith(`ownerp_${guildId}_`);
      const fmtRoles = (arr, prefix) =>
        arr.length === 0
          ? 'Aucun'
          : arr.map(e => `<@&${e.id.replace(prefix, '')}>`).join(', ');
      const embed = new EmbedBuilder()
        .setTitle('Roles de permission')
        .setColor(color)
        .addFields(
          { name: 'Admins', value: fmtRoles(admins, `admin_${guildId}_`) },
          { name: 'Owners serveur', value: fmtRoles(owners, `ownerp_${guildId}_`) },
        );
      return interaction.editReply({ embeds: [embed] });
    }
  }
};
