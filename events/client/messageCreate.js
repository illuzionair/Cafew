const { createFakeInteraction } = require('../../util/prefixBridge');

module.exports = async (client, message) => {
  if (message.author.bot) return;
  if (!message.guild) return;

  const prefix = client.config?.prefix;
  if (!prefix || !message.content.startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const commandName = args.shift()?.toLowerCase();
  if (!commandName) return;

  if (!client.prefixCommands) client.prefixCommands = new Map();

  // 1. Cherche dans les prefix commands natives
  let command =
    client.prefixCommands.get(commandName) ||
    [...client.prefixCommands.values()].find(c => c.aliases?.includes(commandName));

  // 2. Fallback : bridge vers la slash command du même nom
  if (!command) {
    const slashCmd = client.commands?.get(commandName);
    if (slashCmd) {
      // Cooldown
      if (!client.cooldowns) client.cooldowns = new Map();
      const now = Date.now();
      const cooldownKey = `${commandName}_${message.author.id}`;
      const cooldown = 3000;
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
        const fakeInteraction = await createFakeInteraction(message, args, slashCmd);
        await slashCmd.execute(fakeInteraction);
      } catch (err) {
        console.error(`[BRIDGE ERROR] ${commandName}:`, err);
        message.reply('❌ Une erreur est survenue.').catch(() => {});
      }
      return;
    }
    return; // commande inconnue
  }

  // Prefix command native
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
