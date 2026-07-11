const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits
} = require('discord.js');
const { STATIONS, playStation, stopStation, setVolume, getSession } = require('../../util/radio');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('radio')
    .setDescription('Système radio dans un salon vocal')
    .addSubcommand(sub =>
      sub.setName('play')
        .setDescription('Lancer une station radio')
        .addStringOption(o =>
          o.setName('station')
            .setDescription('Station prédéfinie')
            .setRequired(false)
            .addChoices(...STATIONS.map(s => ({ name: s.name, value: s.value })))
        )
        .addStringOption(o =>
          o.setName('url')
            .setDescription('URL personnalisée (stream mp3/aac)')
            .setRequired(false)
        )
    )
    .addSubcommand(sub =>
      sub.setName('stop').setDescription('Arrêter la radio')
    )
    .addSubcommand(sub =>
      sub.setName('info').setDescription('Station en cours')
    )
    .addSubcommand(sub =>
      sub.setName('volume')
        .setDescription('Régler le volume (0-200)')
        .addIntegerOption(o =>
          o.setName('valeur').setDescription('Volume en % (défaut 100)').setMinValue(0).setMaxValue(200).setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub.setName('list').setDescription('Voir toutes les stations disponibles')
    ),

  async execute(interaction) {
    const sub   = interaction.options.getSubcommand();
    const guild = interaction.guild;
    const member = interaction.member;
    const voiceChannel = member.voice?.channel;

    // ── LIST ──────────────────────────────────────────────────────────────
    if (sub === 'list') {
      const lines = STATIONS.map((s, i) => `**${i + 1}.** ${s.name} — \`/radio play station:${s.value}\``);
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0x9b59b6)
            .setTitle('📻 Stations disponibles')
            .setDescription(lines.join('\n'))
            .setFooter({ text: 'Tu peux aussi passer une URL personnalisée avec /radio play url:...' })
        ],
        ephemeral: true
      });
    }

    // ── STOP ──────────────────────────────────────────────────────────────
    if (sub === 'stop') {
      const stopped = stopStation(guild.id);
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(stopped ? 0xe74c3c : 0x95a5a6)
            .setDescription(stopped ? '⏹️ Radio arrêtée.' : '❌ Aucune radio en cours.')
        ]
      });
    }

    // ── INFO ──────────────────────────────────────────────────────────────
    if (sub === 'info') {
      const session = getSession(guild.id);
      if (!session || !session.station) {
        return interaction.reply({ content: '❌ Aucune radio en cours.', ephemeral: true });
      }
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0x9b59b6)
            .setTitle('📻 Radio en cours')
            .addFields(
              { name: 'Station', value: session.station.name, inline: true },
              { name: 'Volume',  value: `${session.volume}%`, inline: true },
              { name: 'URL',     value: `\`${session.station.url}\``, inline: false },
            )
        ]
      });
    }

    // ── VOLUME ────────────────────────────────────────────────────────────
    if (sub === 'volume') {
      const vol = interaction.options.getInteger('valeur');
      const ok  = setVolume(guild.id, vol);
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(ok ? 0x2ecc71 : 0xe74c3c)
            .setDescription(ok ? `🔊 Volume réglé à **${vol}%**.` : '❌ Aucune radio en cours.')
        ],
        ephemeral: true
      });
    }

    // ── PLAY ──────────────────────────────────────────────────────────────
    if (sub === 'play') {
      if (!voiceChannel)
        return interaction.reply({ content: '❌ Rejoins un salon vocal d\'abord.', ephemeral: true });

      const botMember = guild.members.me;
      if (!voiceChannel.permissionsFor(botMember).has(PermissionFlagsBits.Connect))
        return interaction.reply({ content: '❌ Je n\'ai pas la permission de rejoindre ce salon.', ephemeral: true });

      const stationValue = interaction.options.getString('station');
      const customUrl    = interaction.options.getString('url');

      // Si ni station ni URL → afficher le select menu
      if (!stationValue && !customUrl) {
        const select = new StringSelectMenuBuilder()
          .setCustomId(`radio_select_${guild.id}`)
          .setPlaceholder('Choisis une station...')
          .addOptions(
            STATIONS.map(s =>
              new StringSelectMenuOptionBuilder().setLabel(s.name).setValue(s.value)
            )
          );
        const row = new ActionRowBuilder().addComponents(select);
        const cancelBtn = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('radio_cancel').setLabel('Annuler').setStyle(ButtonStyle.Secondary)
        );

        const msg = await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(0x9b59b6)
              .setTitle('📻 Choisir une station')
              .setDescription('Sélectionne une station dans le menu ou utilise `/radio play url:...` pour un stream custom.')
          ],
          components: [row, cancelBtn],
          ephemeral: true,
          fetchReply: true
        });

        const coll = msg.createMessageComponentCollector({ time: 30_000 });
        coll.on('collect', async inter => {
          if (inter.user.id !== interaction.user.id) return;
          if (inter.customId === 'radio_cancel') { coll.stop(); return inter.update({ components: [] }); }
          if (inter.customId === `radio_select_${guild.id}`) {
            const val = inter.values[0];
            await inter.update({ components: [], embeds: [
              new EmbedBuilder().setColor(0x9b59b6).setDescription('⏳ Connexion en cours...')
            ]});
            try {
              const station = await playStation(guild, voiceChannel, interaction.channel, val);
              await inter.editReply({
                embeds: [
                  new EmbedBuilder()
                    .setColor(0x9b59b6)
                    .setTitle('📻 Radio lancée !')
                    .addFields(
                      { name: 'Station',  value: station.name,    inline: true },
                      { name: 'Salon',    value: `${voiceChannel}`, inline: true },
                    )
                    .setFooter({ text: 'Utilise /radio stop pour arrêter | /radio volume pour le volume' })
                ],
                components: []
              });
            } catch (e) {
              await inter.editReply({ content: `❌ Erreur : ${e.message}`, components: [] });
            }
            coll.stop();
          }
        });
        coll.on('end', (_, reason) => {
          if (reason === 'time') interaction.editReply({ components: [] }).catch(() => {});
        });
        return;
      }

      // Station ou URL directe
      await interaction.deferReply();
      try {
        const station = await playStation(guild, voiceChannel, interaction.channel, stationValue || 'custom', customUrl);
        return interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setColor(0x9b59b6)
              .setTitle('📻 Radio lancée !')
              .addFields(
                { name: 'Station', value: station.name,       inline: true },
                { name: 'Salon',   value: `${voiceChannel}`,  inline: true },
                { name: 'URL',     value: `\`${station.url}\``, inline: false },
              )
              .setFooter({ text: '/radio stop • /radio volume • /radio info' })
          ]
        });
      } catch (e) {
        return interaction.editReply({ content: `❌ Impossible de lancer la radio : \`${e.message}\`` });
      }
    }
  }
};
