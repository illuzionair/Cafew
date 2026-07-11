require('dotenv').config();
const { Client, GatewayIntentBits, Partials, Collection } = require('discord.js');
const { readdirSync } = require('fs');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildBans,
    GatewayIntentBits.GuildWebhooks,
    GatewayIntentBits.GuildModeration,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.GuildMember, Partials.User],
});

client.commands       = new Collection();
client.prefixCommands = new Collection();
client.config         = require('./config.json');

// ── Chargement des slash commands ─────────────────────────────────────────
const commandFolders = readdirSync('./commands');
for (const folder of commandFolders) {
  const files = readdirSync(`./commands/${folder}`).filter(f => f.endsWith('.js'));
  for (const file of files) {
    const cmd = require(`./commands/${folder}/${file}`);
    if (cmd.data && cmd.execute) {
      client.commands.set(cmd.data.name, cmd);
      console.log(`[SLASH] ${cmd.data.name}`);
    } else if (cmd.name && cmd.run) {
      client.prefixCommands.set(cmd.name, cmd);
      console.log(`[PREFIX] ${cmd.name}`);
    }
  }
}

// ── Chargement des events ─────────────────────────────────────────────────
function registerEvent(event, source) {
  if (typeof event === 'function') {
    // Ancien format : nom = nom du fichier sans .js (passé en arg)
    return; // géré séparément
  }
  if (event && event.name && typeof event.execute === 'function') {
    client.on(event.name, (...args) => event.execute(...args));
    const label = event.customName || event.name;
    console.log(`[EVT] ${event.name} [${source}] (${label})`);
  }
}

const eventFolders = readdirSync('./events');
for (const folder of eventFolders) {
  const files = readdirSync(`./events/${folder}`).filter(f => f.endsWith('.js'));
  for (const file of files) {
    const raw = require(`./events/${folder}/${file}`);
    const source = `${folder}/${file}`;

    if (typeof raw === 'function') {
      // Ancien format fonction
      const eventName = file.replace('.js', '');
      client.on(eventName, (...args) => raw(client, ...args));
      console.log(`[EVT] ${eventName} [${source}]`);

    } else if (Array.isArray(raw)) {
      // Tableau d'events (ex: guildBan.js)
      for (const event of raw) registerEvent(event, source);

    } else if (raw && raw.name && typeof raw.execute === 'function') {
      // Objet simple
      registerEvent(raw, source);

    } else {
      console.warn(`[EVT WARN] Format inconnu : ${source}`);
    }
  }
}

process.on('unhandledRejection', err => {
  console.error('[ERR] Unhandled rejection:', err);
});

client.login(process.env.TOKEN);
