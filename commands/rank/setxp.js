const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { QuickDB } = require('quick.db');
const { isOwnerBot } = require('../../util/checkPerm');
const { getGrade } = require('../../util/levelSystem');
const db = new QuickDB();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setxp')
    .setDescription('Modifier l\'XP ou le niveau d\'un membre')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(sub =>
      sub.setName('set-xp')
        .setDescription('Définir l\'XP exact d\'un membre')
        .addUserOption(o => o.setName('membre').setDescription('Membre cible').setRequired(true))
        .addIntegerOption(o => o.setName('xp').setDescription('Valeur XP').setRequired(true).setMinValue(0))
    )
    .addSubcommand(sub =>
      sub.setName('set-level')
        .setDescription('Définir le niveau exact d\'un membre')
        .addUserOption(o => o.setName('membre').setDescription('Membre cible').setRequired(true))
        .addIntegerOption(o => o.setName('niveau').setDescription('Niveau').setRequired(true).setMinValue(1))
    )
    .addSubcommand(sub =>
      sub.setName('add-xp')
        .setDescription('Ajouter de l\'XP à un membre')
        .addUserOption(o => o.setName('membre').setDescription('Membre cible').setRequired(true))
        .addIntegerOption(o => o.setName('xp').setDescription('XP à ajouter').setRequired(true).setMinValue(1))
    )
    .addSubcommand(sub =>
      sub.setName('remove-xp')
        .setDescription('Retirer de l\'XP à un membre')
        .addUserOption(o => o.setName('membre').setDescription('Membre cible').setRequired(true))
        .addIntegerOption(o => o.setName('xp').setDescription('XP à retirer').setRequired(true).setMinValue(1))
    )
    .addSubcommand(sub =>
      sub.setName('reset')
        .setDescription('Réinitialiser l\'XP et le niveau d\'un membre')
        .addUserOption(o => o.setName('membre').setDescription('Membre cible').setRequired(true))
    ),

  async execute(interaction) {
    if (!await isOwnerBot(interaction.client, interaction.user.id))
      return interaction.reply({ content: 'Tu dois être owner bot pour utiliser cette commande.', ephemeral: true });

    const sub     = interaction.options.getSubcommand();
    const target  = interaction.options.getUser('membre');
    const guildId = interaction.guild.id;
    const config  = interaction.client.config;
    const color   = config.color;

    const xpKey  = `xp_${guildId}_${target.id}`;
    const lvlKey = `level_${guildId}_${target.id}`;

    let xp    = (await db.get(xpKey))  || 0;
    let level = (await db.get(lvlKey)) || 1;

    if (sub === 'set-xp') {
      xp = interaction.options.getInteger('xp');
      await db.set(xpKey, xp);
    }

    else if (sub === 'set-level') {
      level = interaction.options.getInteger('niveau');
      xp = 0;
      await db.set(lvlKey, level);
      await db.set(xpKey, 0);
    }

    else if (sub === 'add-xp') {
      const gain = interaction.options.getInteger('xp');
      xp += gain;
      const xpNeeded = level * config.xpPerLevel;
      // Gère les level ups multiples
      while (xp >= level * config.xpPerLevel) {
        xp -= level * config.xpPerLevel;
        level++;
      }
      await db.set(xpKey, xp);
      await db.set(lvlKey, level);
    }

    else if (sub === 'remove-xp') {
      const loss = interaction.options.getInteger('xp');
      xp = Math.max(0, xp - loss);
      await db.set(xpKey, xp);
    }

    else if (sub === 'reset') {
      await db.delete(xpKey);
      await db.delete(lvlKey);
      xp = 0;
      level = 1;
    }

    const grade   = getGrade(level, config);
    const xpNeeded = level * config.xpPerLevel;

    const embed = new EmbedBuilder()
      .setTitle('✅ XP mis à jour')
      .setColor(color)
      .setThumbnail(target.displayAvatarURL({ size: 64 }))
      .addFields(
        { name: 'Membre',  value: `<@${target.id}>`, inline: true },
        { name: 'Niveau',  value: `${level}`,         inline: true },
        { name: 'Grade',   value: grade.name,          inline: true },
        { name: 'XP',      value: `${xp} / ${xpNeeded}`, inline: true },
        { name: 'Action',  value: `\`${sub}\``,        inline: true },
      )
      .setFooter({ text: config.name })
      .setTimestamp();

    return interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
