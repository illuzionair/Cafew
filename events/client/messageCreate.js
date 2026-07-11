module.exports = async (client, message) => {
  if (message.author.bot) return;
  if (!message.guild) return;

  const prefix = client.config?.prefix;
  if (!prefix || !message.content.startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const commandName = args.shift()?.toLowerCase();
  if (!commandName) return;

  // Securite : prefixCommands peut ne pas exister si index.js pas a jour
  if (!client.prefixCommands) {
    client.prefixCommands = new Map();
  }

  const command =
    client.prefixCommands.get(commandName) ||
    [...client.prefixCommands.values()].find(c => c.aliases?.includes(commandName));

  if (!command) return;

  if (!client.cooldowns) client.cooldowns = new Map();
  const now = Date.now();
  const cooldownKey = `${command.name}_${message.author.id}`;
  const cooldown = (command.cooldown || 3) * 1000;
  if (client.cooldowns.has(cooldownKey)) {
    const expire = client.cooldowns.get(cooldownKey) + cooldown;
    if (now < expire) {
      const left = ((expire - now) / 1000).toFixed(1);
      return message.reply(`⏳ Attends encore **${left}s**.`)
        .then(m => setTimeout(() => m.delete().catch(() => {}), 4000));
    }
  }
  client.cooldowns.set(cooldownKey, now);
  setTimeout(() => client.cooldowns.delete(cooldownKey), cooldown);

  try {
    await command.run(client, message, args, prefix, client.config.color);
  } catch (err) {
    console.error(`[PREFIX CMD ERROR] ${command.name}:`, err);
    message.reply('❌ Une erreur est survenue.').catch(() => {});
  }
};
