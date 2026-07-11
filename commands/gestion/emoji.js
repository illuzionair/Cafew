const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { hasAdminPerm } = require('../../util/checkPerm');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('emoji')
    .setDescription('Ajouter ou supprimer un emoji du serveur')
    .addSubcommand(sub =>
      sub.setName('add').setDescription('Ajouter un emoji')
        .addStringOption(o => o.setName('emoji').setDescription('Emoji a copier (custom)').setRequired(true))
        .addStringOption(o => o.setName('nom').setDescription('Nom a donner').setRequired(false))
    )
    .addSubcommand(sub =>
      sub.setName('remove').setDescription('Supprimer un emoji')
        .addStringOption(o => o.setName('emoji').setDescription('Emoji ou nom ou ID').setRequired(true))
    ),

  async execute(interaction) {
    if (!await hasAdminPerm(interaction.client, interaction.member)) {
      return interaction.reply({ content: 'Permission refusee.', ephemeral: true });
    }

    const sub = interaction.options.getSubcommand();

    if (sub === 'add') {
      const emojiStr = interaction.options.getString('emoji');
      const customName = interaction.options.getString('nom');
      // Extraire ID et animated depuis la string custom emoji <a:name:id> ou <:name:id>
      const match = emojiStr.match(/<?a?:?(\w+):(\d+)>?/);
      if (!match) return interaction.reply({ content: 'Emoji custom invalide. Utilise un emoji custom Discord.', ephemeral: true });
      const animated = emojiStr.startsWith('<a:');
      const emojiId = match[2];
      const emojiName = customName || match[1];
      const url = `https://cdn.discordapp.com/emojis/${emojiId}.${animated ? 'gif' : 'png'}`;
      await interaction.guild.emojis.create({ attachment: url, name: emojiName }).catch(err => {
        return interaction.reply({ content: `Erreur: ${err.message}`, ephemeral: true });
      });
      return interaction.reply({ content: `Emoji **${emojiName}** ajoute avec succes !`, ephemeral: true });
    }

    if (sub === 'remove') {
      const query = interaction.options.getString('emoji');
      const match = query.match(/<?a?:?(\w+):(\d+)>?/);
      const emoji = match
        ? interaction.guild.emojis.cache.get(match[2])
        : interaction.guild.emojis.cache.find(e => e.name === query) ||
          interaction.guild.emojis.cache.get(query);
      if (!emoji) return interaction.reply({ content: `Emoji introuvable sur ce serveur.`, ephemeral: true });
      await emoji.delete();
      return interaction.reply({ content: `Emoji **${emoji.name}** supprime.`, ephemeral: true });
    }
  }
};
