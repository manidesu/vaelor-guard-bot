const { Client, GatewayIntentBits, Partials } = require('discord.js');
const config = require('./config');

const antiNuke = require('./modules/antiNuke');
const antiRaid = require('./modules/antiRaid');
const antiSpam = require('./modules/antiSpam');
const antiBotAdd = require('./modules/antiBotAdd');
const staffAbuse = require('./modules/staffAbuse');
const ihlalCommand = require('./commands/ihlal');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,   // Privileged - Developer Portal'dan aç
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent, // Privileged - Developer Portal'dan aç (.ihlal komutu için gerekli)
    GatewayIntentBits.GuildModeration, // guildBanAdd olayını yakalamak için
  ],
  partials: [Partials.GuildMember, Partials.Message, Partials.Channel],
});

antiNuke.register(client);
antiRaid.register(client);
antiSpam.register(client);
antiBotAdd.register(client);
staffAbuse.register(client);

client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.guild) return;
  if (!message.content.startsWith(config.prefix)) return;

  const args = message.content.slice(config.prefix.length).trim().split(/\s+/);
  const commandName = args.shift().toLowerCase();

  if (commandName === 'ihlal') {
    try {
      await ihlalCommand.handle(message, args);
    } catch (err) {
      console.error(err);
      message.reply('❌ İhlal geçmişi alınırken hata oluştu.');
    }
  }
});

client.once('ready', () => {
  console.log(`${client.user.tag} olarak giriş yapıldı. (Guard Bot aktif)`);
});

client.login(config.token);
