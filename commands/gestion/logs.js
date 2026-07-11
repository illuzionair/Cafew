const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  PermissionFlagsBits,
  ChannelType
} = require('discord.js');
const { QuickDB } = require('quick.db');
const { hasAdminPerm } = require('../../util/checkPerm');
const db = new QuickDB();

async function buildLogsEmbed(guildId, guild, color) {
  const logmod = await db.get(`logmod_${guildId}`);
  const msglog = await db.get(`msglog_${guildId}`);
  const logvc = await db.get(`logvc_${guildId}`);
  const logmember = await db.get(`logmember_${guildId}`);

  const fmt = (id) => {
    if (!id) return ':x:';
    const ch = guild.channels.cache.get(id);
    return ch ? `<#${id}>` : ':x:';
  };

  return new EmbedBuilder()
    .setTitle('Configuration des Logs')
    .setColor(color)
    .addFields(
      { name: '🛡️ Logs Mods', value: fmt(logmod), inline: true },
      { name: '📩 Logs Messages', value: fmt(msglog), inline: true },
      { name: '🎧 Logs Vocal', value: fmt(logvc), inline: true },
      { name: '👥 Logs Membres', value: fmt(logmember), inline: true },
    )
    .setFooter({ text: 'Utilise le menu pour modifier' });
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('logs')
    .setDescription('Configurer les canaux de logs du serveur')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    if (!await hasAdminPerm(interaction.client, interaction.member)) {
      return interaction.reply({ content: 'Permission refusee.', ephemeral: true });
    }

    const guildId = interaction.guild.id;
    const color = interaction.client.config.color;

    const embed = await buildLogsEmbed(guildId, interaction.guild, color);

    const select = new StringSelectMenuBuilder()
      .setCustomId('logs_menu')
      .setPlaceholder('Choisir une action...')
      .addOptions(
        new StringSelectMenuOptionBuilder().setLabel('Modifier logs mods').setValue('set_logmod').setEmoji('🛡️'),
        new StringSelectMenuOptionBuilder().setLabel('Supprimer logs mods').setValue('del_logmod').setEmoji('🗑️'),
        new StringSelectMenuOptionBuilder().setLabel('Modifier logs messages').setValue('set_msglog').setEmoji('📩'),
        new StringSelectMenuOptionBuilder().setLabel('Supprimer logs messages').setValue('del_msglog').setEmoji('🗑️'),
        new StringSelectMenuOptionBuilder().setLabel('Modifier logs vocal').setValue('set_logvc').setEmoji('🎧'),
        new StringSelectMenuOptionBuilder().setLabel('Supprimer logs vocal').setValue('del_logvc').setEmoji('🗑️'),
        new StringSelectMenuOptionBuilder().setLabel('Modifier logs membres').setValue('set_logmember').setEmoji('👥'),
        new StringSelectMenuOptionBuilder().setLabel('Supprimer logs membres').setValue('del_logmember').setEmoji('🗑️'),
      );

    const row = new ActionRowBuilder().addComponents(select);
    const msg = await interaction.reply({ embeds: [embed], components: [row], fetchReply: true });

    const collector = msg.createMessageComponentCollector({ time: 5 * 60 * 1000 });

    collector.on('collect', async sel => {
      if (sel.user.id !== interaction.user.id) return sel.reply({ content: 'Pas pour toi.', ephemeral: true });
      const val = sel.values[0];

      if (val.startsWith('del_')) {
        const key = val.replace('del_', '');
        await db.delete(`${key}_${guildId}`);
        const updated = await buildLogsEmbed(guildId, interaction.guild, color);
        await sel.update({ embeds: [updated], components: [row] });
        return;
      }

      // set_ : demander le salon via follow-up
      const keyMap = {
        set_logmod: 'logmod',
        set_msglog: 'msglog',
        set_logvc: 'logvc',
        set_logmember: 'logmember'
      };
      const dbKey = keyMap[val];

      await sel.reply({ content: `Mentionne ou donne l ID du salon pour \`${dbKey}\` :`, ephemeral: true });
      const collected = await interaction.channel.awaitMessages({
        filter: m => m.author.id === interaction.user.id,
        max: 1,
        time: 60000
      }).catch(() => null);

      if (!collected || collected.size === 0) return;
      const m = collected.first();
      const channel = m.mentions.channels.first() || interaction.guild.channels.cache.get(m.content.trim());
      await m.delete().catch(() => {});

      if (!channel) return interaction.followUp({ content: 'Salon introuvable.', ephemeral: true });
      await db.set(`${dbKey}_${guildId}`, channel.id);
      const updated = await buildLogsEmbed(guildId, interaction.guild, color);
      await interaction.editReply({ embeds: [updated], components: [row] });
    });

    collector.on('end', () => msg.edit({ components: [] }).catch(() => {}));
  }
};
