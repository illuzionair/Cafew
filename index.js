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
  ],
  partials: [Partials.Message, Partials.Channel, Partials.GuildMember],
});

client.commands = new Collection();
client.config = require('./config.json');

// Chargement des commandes
const commandFolders = readdirSync('./commands');
for (const folder of commandFolders) {
  const commandFiles = readdirSync(`./commands/${folder}`).filter(f => f.endsWith('.js'));
  for (const file of commandFiles) {
    const command = require(`./commands/${folder}/${file}`);
    if (command.data && command.execute) {
      client.commands.set(command.data.name, command);
      console.log(`[CMD] Charge: ${command.data.name}`);
    }
  }
}

// Chargement des events
const eventFolders = readdirSync('./events');
for (const folder of eventFolders) {
  const eventFiles = readdirSync(`./events/${folder}`).filter(f => f.endsWith('.js'));
  for (const file of eventFiles) {
    const event = require(`./events/${folder}/${file}`);
    const eventName = file.split('.')[0];
    client.on(eventName, (...args) => event(client, ...args));
    console.log(`[EVT] Charge: ${eventName} [${folder}]`);
  }
}

process.on('unhandledRejection', err => {
  console.error('[ERR] Unhandled rejection:', err);
});

client.login(process.env.TOKEN);
