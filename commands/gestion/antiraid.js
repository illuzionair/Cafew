const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  PermissionFlagsBits
} = require('discord.js');
const { QuickDB } = require('quick.db');
const { isOwnerBot } = require('../../util/checkPerm');
const db = new QuickDB();

const onoff = v => v === true ? '`✅`' : '`❌`';
const wlbypass = v => v === true ? '`❌` (WL ignorée)' : '`✅` (WL bypass)';

const MODULES = [
  { key: 'webhook',        label: 'Création de webhook',               page: 1 },
  { key: 'rolescreate',    label: 'Création de rôle',                  page: 1 },
  { key: 'rolesmod',       label: 'Modification de rôle',              page: 1 },
  { key: 'rolesdel',       label: 'Suppression de rôle',               page: 1 },
  { key: 'rolesadd',       label: 'Ajout de perm dangereuse à un rôle', page: 1 },
  { key: 'update',         label: 'Modification du serveur',           page: 2 },
  { key: 'channelscreate', label: 'Création de salon',                 page: 2 },
  { key: 'channelsmod',    label: 'Modification de salon',             page: 2 },
  { key: 'channelsdel',    label: 'Suppression de salon',              page: 2 },
  { key: 'bot',            label: 'Ajout de bot',                      page: 2 },
  { key: 'massban',        label: 'Bannissement de membre',            page: 3 },
  { key: 'antitoken',      label: 'Anti mass-join',                    page: 3 },
  { key: 'crealimit',      label: 'Compte trop récent (anti-token)',   page: 3 },
  { key: 'antideco',       label: 'Déconnexion de membre',             page: 3 },
  { key: 'link',           label: 'Anti-lien',                         page: 3 },
];

async function getModuleData(guildId, key) {
  const active = await db.get(`${key}_${guildId}`);
  const sanc   = await db.get(`${key}sanction_${guildId}`) || 'derank';
  const wl     = await db.get(`${key}wl_${guildId}`);
  return { active, sanc, wl };
}

async function buildPageEmbed(guildId, page, client) {
  const color = client.config.color;
  const mods  = MODULES.filter(m => m.page === page);
  const lines = [];
  for (const mod of mods) {
    const d = await getModuleData(guildId, mod.key);
    lines.push(`**・ ${mod.label}**\nActif: ${onoff(d.active)} | Sanction: \`${d.sanc}\` | WL bypass: ${wlbypass(d.wl)}`);
  }
  return new EmbedBuilder()
    .setTitle(`🛡️ Configuration Antiraid — Page ${page}/3`)
    .setColor(color)
    .setDescription(lines.join('\n\n'))
    .setFooter({ text: client.config.name });
}

function buildModuleSelect(page, guildId) {
  const mods = MODULES.filter(m => m.page === page);
  return new StringSelectMenuBuilder()
    .setCustomId(`antiraid_mod_${guildId}`)
    .setPlaceholder('Sélectionne un module à configurer')
    .addOptions(mods.map(m =>
      new StringSelectMenuOptionBuilder().setLabel(m.label).setValue(m.key)
    ));
}

function buildActionRow(page, guildId) {
  return [
    new ActionRowBuilder().addComponents(buildModuleSelect(page, guildId)),
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`ar_prev_${guildId}`).setLabel('◀').setStyle(ButtonStyle.Secondary).setDisabled(page === 1),
      new ButtonBuilder().setCustomId(`ar_next_${guildId}`).setLabel('▶').setStyle(ButtonStyle.Secondary).setDisabled(page === 3),
    ),
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`ar_on_${guildId}`).setLabel('Tout activer').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId(`ar_off_${guildId}`).setLabel('Tout désactiver').setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId(`ar_max_${guildId}`).setLabel('Mode MAX').setStyle(ButtonStyle.Success),
    ),
  ];
}

async function applyPreset(guildId, preset) {
  const mods = ['webhook','rolescreate','rolesmod','rolesdel','rolesadd','update',
    'channelscreate','channelsmod','channelsdel','bot','massban','antitoken',
    'crealimit','antideco','link'];
  for (const key of mods) {
    if (preset === 'off') {
      await db.set(`${key}_${guildId}`, null);
    } else {
      await db.set(`${key}_${guildId}`, true);
      await db.set(`${key}sanction_${guildId}`, preset === 'max' ? 'ban' : 'derank');
      await db.set(`${key}wl_${guildId}`, preset === 'max' ? true : null);
    }
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('antiraid')
    .setDescription('Configurer les modules antiraid du serveur')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    // Les modaux Discord ne fonctionnent qu'en slash — bloque le prefix
    if (!interaction.isChatInputCommand || !interaction.isChatInputCommand()) {
      return interaction.reply({ content: '⚠️ Cette commande utilise des formulaires interactifs. Utilise `/antiraid` (slash command) à la place.' });
    }

    if (!await isOwnerBot(interaction.client, interaction.user.id)) {
      return interaction.reply({ content: 'Tu dois être owner bot pour utiliser cette commande.', ephemeral: true });
    }

    const guildId = interaction.guild.id;
    let page = 1;

    const embed = await buildPageEmbed(guildId, page, interaction.client);

    // reply() en slash réelle retourne undefined → on appelle fetchReply()
    const sent = await interaction.reply({
      embeds: [embed],
      components: buildActionRow(page, guildId),
    });

    let msg = (sent && sent.createMessageComponentCollector) ? sent : null;
    if (!msg && typeof interaction.fetchReply === 'function') {
      msg = await interaction.fetchReply().catch(() => null);
    }
    if (!msg) return;

    const collector = msg.createMessageComponentCollector({ time: 10 * 60 * 1000 });

    collector.on('collect', async inter => {
      if (inter.user.id !== interaction.user.id)
        return inter.reply({ content: 'Pas pour toi.', ephemeral: true });

      if      (inter.customId === `ar_prev_${guildId}` && page > 1)  page--;
      else if (inter.customId === `ar_next_${guildId}` && page < 3)  page++;
      else if (inter.customId === `ar_on_${guildId}`)  await applyPreset(guildId, 'on');
      else if (inter.customId === `ar_off_${guildId}`) await applyPreset(guildId, 'off');
      else if (inter.customId === `ar_max_${guildId}`) await applyPreset(guildId, 'max');
      else if (inter.customId === `antiraid_mod_${guildId}`) {
        const key = inter.values[0];
        const mod = MODULES.find(m => m.key === key);
        const d   = await getModuleData(guildId, key);

        const modal = new ModalBuilder()
          .setCustomId(`ar_modal_${key}_${guildId}`)
          .setTitle(`Config: ${mod.label}`);
        modal.addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('actif')
              .setLabel('Actif ? (oui / non)')
              .setStyle(TextInputStyle.Short)
              .setValue(d.active === true ? 'oui' : 'non').setRequired(true)
          ),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('sanction')
              .setLabel('Sanction (ban / kick / derank)')
              .setStyle(TextInputStyle.Short)
              .setValue(d.sanc || 'derank').setRequired(true)
          ),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('wlbypass')
              .setLabel('WL peut bypass ? (oui = bypass autorisé)')
              .setStyle(TextInputStyle.Short)
              .setValue(d.wl === true ? 'non' : 'oui').setRequired(true)
          ),
        );

        await inter.showModal(modal);
        const submit = await inter.awaitModalSubmit({ time: 60_000 }).catch(() => null);
        if (!submit) return;

        const actif  = submit.fields.getTextInputValue('actif').toLowerCase().trim();
        const sanc   = submit.fields.getTextInputValue('sanction').toLowerCase().trim();
        const bypass = submit.fields.getTextInputValue('wlbypass').toLowerCase().trim();

        await db.set(`${key}_${guildId}`, actif === 'oui' ? true : null);
        if (['ban','kick','derank'].includes(sanc))
          await db.set(`${key}sanction_${guildId}`, sanc);
        await db.set(`${key}wl_${guildId}`, bypass === 'non' ? true : null);

        const updEmbed = await buildPageEmbed(guildId, page, interaction.client);
        await submit.update({ embeds: [updEmbed], components: buildActionRow(page, guildId) });
        return;
      }

      const updEmbed = await buildPageEmbed(guildId, page, interaction.client);
      await inter.update({ embeds: [updEmbed], components: buildActionRow(page, guildId) });
    });

    collector.on('end', () => msg.edit({ components: [] }).catch(() => {}));
  }
};
