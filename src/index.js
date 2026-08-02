const { Client, GatewayIntentBits, Partials, ActivityType } = require('discord.js');
const { joinVoiceChannel } = require('@discordjs/voice');
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
    GatewayIntentBits.GuildVoiceStates, // ses kanalına katılmak için gerekli
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

  // Durum: "Oynuyor: Blessed by Mani"
  client.user.setActivity(config.voice.activityName, { type: ActivityType.Playing });

  // Belirtilen ses kanalına otomatik katıl
  if (config.voice.enabled && config.voice.channelId) {
    const channel = client.channels.cache.get(config.voice.channelId);
    if (channel) {
      joinVoiceChannel({
        channelId: channel.id,
        guildId: channel.guild.id,
        adapterCreator: channel.guild.voiceAdapterCreator,
        selfDeaf: true,
        selfMute: true,
      });
      console.log(`[GUARD] Ses kanalına katılındı: ${channel.name} (${channel.id})`);
    } else {
      console.error(`[GUARD] Ses kanalı bulunamadı: ${config.voice.channelId}`);
    }
  }
});

client.login(config.token);
