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
  ],
  partials: [Partials.Message, Partials.Channel, Partials.GuildMember],
});

client.commands      = new Collection(); // slash commands
client.prefixCommands = new Collection(); // prefix commands
client.config        = require('./config.json');

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
      // Legacy prefix command dans commands/
      client.prefixCommands.set(cmd.name, cmd);
      console.log(`[PREFIX] ${cmd.name}`);
    }
  }
}

// ── Chargement des prefix commands dédiées (dossier commands/prefix/) ────
// (optionnel, si tu crées ce dossier plus tard)

// ── Chargement des events ─────────────────────────────────────────────────
// Supporte deux formats :
//   1. module.exports = async (client, ...args) => {}      (ancien format)
//   2. module.exports = { name, execute, customName? }     (nouveau format antiraid)
const eventFolders = readdirSync('./events');
const registeredEvents = new Map(); // eventName -> count (pour debug)

for (const folder of eventFolders) {
  const files = readdirSync(`./events/${folder}`).filter(f => f.endsWith('.js'));
  for (const file of files) {
    const event = require(`./events/${folder}/${file}`);

    if (typeof event === 'function') {
      // Ancien format : nom = nom du fichier sans extension
      const eventName = file.replace('.js', '');
      client.on(eventName, (...args) => event(client, ...args));
      const count = (registeredEvents.get(eventName) || 0) + 1;
      registeredEvents.set(eventName, count);
      console.log(`[EVT] ${eventName} [${folder}/${file}]`);

    } else if (event && event.name && typeof event.execute === 'function') {
      // Nouveau format objet { name, execute }
      client.on(event.name, (...args) => event.execute(...args));
      const label = event.customName || event.name;
      const count = (registeredEvents.get(event.name) || 0) + 1;
      registeredEvents.set(event.name, count);
      console.log(`[EVT] ${event.name} [${folder}/${file}] (${label})`);
    } else {
      console.warn(`[EVT WARN] Format inconnu : ${folder}/${file}`);
    }
  }
}

process.on('unhandledRejection', err => {
  console.error('[ERR] Unhandled rejection:', err);
});

client.login(process.env.TOKEN);
