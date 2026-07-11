const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  StringSelectMenuBuilder,
  PermissionFlagsBits
} = require('discord.js');
const { QuickDB } = require('quick.db');
const { isOwnerBot } = require('../../util/checkPerm');
const db = new QuickDB();

const activityTypes = {
  play: { type: 0, label: 'Joue a' },
  stream: { type: 1, label: 'Streame' },
  listen: { type: 2, label: 'Ecoute' },
  watch: { type: 3, label: 'Regarde' },
};

function statusEmoji(s) {
  return s === 'dnd' ? '`🔴`' : s === 'idle' ? '`🟠`' : s === 'online' ? '`🟢`' : '`⚫`';
}

function buildEmbed(client, config, color) {
  const activity = client.user.presence?.activities?.[0];
  const actLabel = activity
    ? `${Object.values(activityTypes).find(a => a.type === activity.type)?.label || 'Joue a'} ${activity.name}`
    : 'Aucune';
  const antijoin = db.get(`antijoinbot_${client.user.id}`);

  return new EmbedBuilder()
    .setTitle('Configuration Bot')
    .setColor(color)
    .setThumbnail(client.user.displayAvatarURL())
    .addFields(
      { name: '📛 Nom', value: `\`${client.user.username}\``, inline: true },
      { name: '🎨 Activite', value: `\`${actLabel}\``, inline: true },
      { name: '🟢 Presence', value: statusEmoji(client.user.presence?.status || 'online'), inline: true },
      { name: '🛡️ Secur invite', value: antijoin === true ? '`✅`' : '`❌`', inline: true },
    );
}

function buildRow() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('bcfg_name').setEmoji('📛').setLabel('Nom').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('bcfg_avatar').setEmoji('🖼️').setLabel('Avatar').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('bcfg_activity').setEmoji('🎨').setLabel('Activite').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('bcfg_status').setEmoji('🟢').setLabel('Presence').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('bcfg_secur').setEmoji('🛡️').setLabel('Secur').setStyle(ButtonStyle.Secondary),
  );
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('botconfig')
    .setDescription('Configure le profil du bot (owner only)'),

  async execute(interaction) {
    if (!await isOwnerBot(interaction.client, interaction.user.id)) {
      return interaction.reply({ content: 'Tu dois etre owner bot.', ephemeral: true });
    }

    const color = interaction.client.config.color;
    const embed = buildEmbed(interaction.client, interaction.client, color);
    const msg = await interaction.reply({ embeds: [embed], components: [buildRow()], fetchReply: true });

    const collector = msg.createMessageComponentCollector({ time: 5 * 60 * 1000 });

    collector.on('collect', async btn => {
      if (btn.user.id !== interaction.user.id) return btn.reply({ content: 'Pas pour toi.', ephemeral: true });

      if (btn.customId === 'bcfg_secur') {
        const current = await db.get(`antijoinbot_${interaction.client.user.id}`);
        await db.set(`antijoinbot_${interaction.client.user.id}`, current === true ? null : true);
        const updated = buildEmbed(interaction.client, interaction.client, color);
        await btn.update({ embeds: [updated], components: [buildRow()] });
        return;
      }

      if (btn.customId === 'bcfg_name') {
        const modal = new ModalBuilder().setCustomId('modal_name').setTitle('Nouveau nom du bot');
        modal.addComponents(new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId('name_input').setLabel('Nom').setStyle(TextInputStyle.Short).setMaxLength(32).setRequired(true)
        ));
        await btn.showModal(modal);
        const modalSubmit = await btn.awaitModalSubmit({ time: 60000 }).catch(() => null);
        if (!modalSubmit) return;
        const newName = modalSubmit.fields.getTextInputValue('name_input');
        await interaction.client.user.setUsername(newName).catch(() => {});
        const updated = buildEmbed(interaction.client, interaction.client, color);
        await modalSubmit.update({ embeds: [updated], components: [buildRow()] });
        return;
      }

      if (btn.customId === 'bcfg_avatar') {
        const modal = new ModalBuilder().setCustomId('modal_avatar').setTitle('Nouvel avatar du bot');
        modal.addComponents(new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId('avatar_input').setLabel('URL de l image').setStyle(TextInputStyle.Short).setRequired(true)
        ));
        await btn.showModal(modal);
        const modalSubmit = await btn.awaitModalSubmit({ time: 60000 }).catch(() => null);
        if (!modalSubmit) return;
        const url = modalSubmit.fields.getTextInputValue('avatar_input');
        await interaction.client.user.setAvatar(url).catch(() => {});
        const updated = buildEmbed(interaction.client, interaction.client, color);
        await modalSubmit.update({ embeds: [updated], components: [buildRow()] });
        return;
      }

      if (btn.customId === 'bcfg_activity') {
        const modal = new ModalBuilder().setCustomId('modal_activity').setTitle('Activite du bot');
        modal.addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('act_type').setLabel('Type: play / stream / listen / watch').setStyle(TextInputStyle.Short).setRequired(true)
          ),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('act_name').setLabel('Texte de l activite').setStyle(TextInputStyle.Short).setRequired(true)
          ),
        );
        await btn.showModal(modal);
        const modalSubmit = await btn.awaitModalSubmit({ time: 60000 }).catch(() => null);
        if (!modalSubmit) return;
        const typeStr = modalSubmit.fields.getTextInputValue('act_type').toLowerCase().trim();
        const actName = modalSubmit.fields.getTextInputValue('act_name');
        const act = activityTypes[typeStr] || activityTypes.play;
        await interaction.client.user.setActivity(actName, { type: act.type });
        const updated = buildEmbed(interaction.client, interaction.client, color);
        await modalSubmit.update({ embeds: [updated], components: [buildRow()] });
        return;
      }

      if (btn.customId === 'bcfg_status') {
        const modal = new ModalBuilder().setCustomId('modal_status').setTitle('Presence du bot');
        modal.addComponents(new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId('status_input').setLabel('online / idle / dnd / invisible').setStyle(TextInputStyle.Short).setRequired(true)
        ));
        await btn.showModal(modal);
        const modalSubmit = await btn.awaitModalSubmit({ time: 60000 }).catch(() => null);
        if (!modalSubmit) return;
        const status = modalSubmit.fields.getTextInputValue('status_input').toLowerCase().trim();
        const valid = ['online','idle','dnd','invisible'];
        if (!valid.includes(status)) return modalSubmit.reply({ content: 'Status invalide.', ephemeral: true });
        await interaction.client.user.setPresence({ status });
        const updated = buildEmbed(interaction.client, interaction.client, color);
        await modalSubmit.update({ embeds: [updated], components: [buildRow()] });
      }
    });

    collector.on('end', () => {
      msg.edit({ components: [] }).catch(() => {});
    });
  }
};
