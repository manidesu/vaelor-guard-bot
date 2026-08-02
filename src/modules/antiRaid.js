const config = require('../config');
const { isImmune, punishByStrippingRoles } = require('../utils/punish');
const { sendGuardLog, sendViolatorLog } = require('../utils/log');
const { addIncident } = require('../utils/incidents');

let joinTimestamps = [];
let raidAlertSentUntil = 0;

function register(client) {
  if (!config.antiRaid.enabled) return;

  client.on('guildMemberAdd', async (member) => {
    const now = Date.now();
    joinTimestamps = joinTimestamps.filter((t) => now - t < config.antiRaid.windowMs);
    joinTimestamps.push(now);

    if (joinTimestamps.length < config.antiRaid.maxJoins) return;

    // Raid modu tetiklendi - aynı pencere için tekrar tekrar genel uyarı atma
    if (now > raidAlertSentUntil) {
      await sendGuardLog(member.guild, {
        title: '🚨 Raid Şüphesi Tespit Edildi',
        color: 0xE74C3C,
        fields: [
          { name: 'Detay', value: `${config.antiRaid.windowMs / 1000} saniye içinde ${joinTimestamps.length}+ katılım tespit edildi.`, inline: false },
        ],
      });
      raidAlertSentUntil = now + config.antiRaid.windowMs;
    }

    if (isImmune(member, member.guild)) return;

    const accountAgeMs = now - member.user.createdTimestamp;
    const isNewAccount = accountAgeMs < config.antiRaid.newAccountAgeMs;
    if (!isNewAccount) return; // eski hesaplar raid tetiklemesinde otomatik hedef alınmıyor

    // Raid penceresinde katılan şüpheli (yeni) hesabın olası rollerini (autorole vb.) al
    const stripped = await punishByStrippingRoles(member, 'Anti-raid: raid penceresinde şüpheli yeni hesap girişi');

    let caseId = null;
    if (stripped) {
      caseId = addIncident({
        userId: member.id,
        userTag: member.user.tag,
        guildId: member.guild.id,
        type: 'anti-raid',
        reason: 'Raid penceresinde şüpheli yeni hesap girişi',
        result: 'Olası roller alındı, karantinaya alındı',
      });
      await sendViolatorLog(member.guild, member, { caseId, type: 'Anti-Raid' });
    }

    await sendGuardLog(member.guild, {
      title: '🛡️ Anti-Raid: Şüpheli Katılım',
      color: 0xE67E22,
      fields: [
        { name: 'Kullanıcı', value: `${member} (${member.user.tag})`, inline: false },
        { name: 'Hesap Yaşı', value: `${Math.floor(accountAgeMs / (1000 * 60 * 60 * 24))} gün`, inline: true },
        { name: 'Sonuç', value: stripped ? '✅ Olası roller alındı' : 'ℹ️ Alınacak rol yoktu', inline: true },
        { name: 'Case', value: caseId ? `#${caseId}` : '—', inline: true },
      ],
    });
  });
}

module.exports = { register };
