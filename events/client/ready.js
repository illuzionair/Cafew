module.exports = async (client) => {
  console.log(`[BOT] Connecte en tant que ${client.user.tag}`);
  client.user.setActivity('Cafew | /rank', { type: 3 });
};
