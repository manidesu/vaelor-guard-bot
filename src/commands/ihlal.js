const config = require('../config');
const { getIncidentsForUser } = require('../utils/incidents');

const TYPE_LABELS = {
  'anti-nuke': '🛡️ Anti-Nuke',
  'anti-raid': '🚨 Anti-Raid',
  'anti-spam': '💬 Anti-Spam',
  'anti-bot-add': '🤖 Yetkisiz Bot Ekleme',
  'yetki-kotuye-kullanim': '⚠️ Yetki Kötüye Kullanımı',
};

async function handle(message, args) {
  const hasPermission = message.member.roles.cache.some((role) =>
    config.logViewRoleIds.includes(role.id),
  );
  if (!hasPermission) {
    return message.reply('❌ Bu komutu kullanma yetkin yok.');
  }

  const targetArg = args[0];
  if (!targetArg) {
    return message.reply(`Kullanım: \`${config.prefix}ihlal @kullanıcı/ID\``);
  }
  const targetId = targetArg.replace(/[<@!>]/g, '');

  const records = getIncidentsForUser(targetId);
  if (records.length === 0) {
    return message.reply('✅ Bu kullanıcının kayıtlı bir ihlali yok.');
  }

  const targetUser = await message.client.users.fetch(targetId).catch(() => null);

  const lines = records.slice(0, 15).map((r) => {
    const date = new Date(r.timestamp).toLocaleString('tr-TR');
    return `**#${r.caseId}** — ${TYPE_LABELS[r.type] || r.type}\n   Sebep: ${r.reason}\n   Sonuç: ${r.result}\n   Tarih: ${date}`;
  });

  return message.reply({
    embeds: [{
      title: `📋 ${targetUser ? targetUser.tag : targetId} — İhlal Geçmişi`,
      description: lines.join('\n\n'),
      color: 0x8E44AD,
      footer: { text: `Toplam ${records.length} ihlal${records.length > 15 ? ' (son 15 tanesi gösteriliyor)' : ''}` },
    }],
  });
}

module.exports = { handle };
