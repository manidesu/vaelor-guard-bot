const config = require('../config');
const { isImmune, punishByStrippingRoles } = require('../utils/punish');
const { sendGuardLog, sendViolatorLog } = require('../utils/log');
const { addIncident } = require('../utils/incidents');

// userId -> { timestamps: number[], messages: Message[] }
const tracker = new Map();

function register(client) {
  if (!config.antiSpam.enabled) return;

  client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.guild || !message.member) return;

    const now = Date.now();
    const record = tracker.get(message.author.id) || { timestamps: [], messages: [] };
    record.timestamps = record.timestamps.filter((t) => now - t < config.antiSpam.windowMs);
    record.timestamps.push(now);
    record.messages.push(message);
    record.messages = record.messages.filter((m) => now - m.createdTimestamp < config.antiSpam.windowMs);
    tracker.set(message.author.id, record);

    if (record.timestamps.length < config.antiSpam.maxMessages) return;

    tracker.delete(message.author.id); // tekrar tekrar tetiklenmesin

    if (isImmune(message.member, message.guild)) return;

    if (config.antiSpam.deleteSpamMessages) {
      for (const m of record.messages) {
        await m.delete().catch(() => {});
      }
    }

    const stripped = await punishByStrippingRoles(message.member, 'Anti-spam: mesaj spam eşiği aşıldı');

    let caseId = null;
    if (stripped) {
      caseId = addIncident({
        userId: message.member.id,
        userTag: message.author.tag,
        guildId: message.guild.id,
        type: 'anti-spam',
        reason: 'Mesaj spam eşiği aşıldı',
        result: 'Tüm rolleri alındı, karantinaya alındı',
      });
      await sendViolatorLog(message.guild, message.member, { caseId, type: 'Anti-Spam' });
    }

    await sendGuardLog(message.guild, {
      title: '🛡️ Anti-Spam Tetiklendi',
      color: 0xF39C12,
      fields: [
        { name: 'Kullanıcı', value: `${message.member} (${message.author.tag})`, inline: false },
        { name: 'Kanal', value: `${message.channel}`, inline: true },
        { name: 'Sonuç', value: stripped ? '✅ Tüm rolleri alındı' : '⚠️ Rol alınamadı / dokunulmaz', inline: true },
        { name: 'Case', value: caseId ? `#${caseId}` : '—', inline: true },
      ],
    });
  });
}

module.exports = { register };
