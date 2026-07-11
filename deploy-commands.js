require('dotenv').config();
const { REST, Routes } = require('discord.js');
const { readdirSync } = require('fs');

const commands = [];
const folders = readdirSync('./commands');
for (const folder of folders) {
  const files = readdirSync(`./commands/${folder}`).filter(f => f.endsWith('.js'));
  for (const file of files) {
    const cmd = require(`./commands/${folder}/${file}`);
    if (cmd.data) commands.push(cmd.data.toJSON());
  }
}

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log('Deploiement des slash commands...');
    await rest.put(
      Routes.applicationCommands(process.env.APPLICATION_ID),
      { body: commands }
    );
    console.log('Slash commands deployees avec succes !');
  } catch (err) {
    console.error(err);
  }
})();
