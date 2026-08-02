const { AuditLogEvent } = require('discord.js');
const config = require('../config');
const { punishByStrippingRoles } = require('../utils/punish');
const { sendGuardLog, sendViolatorLog } = require('../utils/log');
const { addIncident } = require('../utils/incidents');

// executorId -> timestamp[]
const tracker = new Map();

function register(client) {
  if (!config.staffAbuse.enabled) return;

  client.on('guildMemberUpdate', async (oldMember, newMember) => {
    const addedRoleIds = newMember.roles.cache
      .filter((r) => !oldMember.roles.cache.has(r.id))
      .map((r) => r.id);

    const matchedRoleId = addedRoleIds.find((id) => config.staffAbuse.watchedRoleIds.includes(id));
    if (!matchedRoleId) return;

    // Bu ceza rolünü kim verdi öğren
    let executor = null;
    try {
      const logs = await newMember.guild.fetchAuditLogs({ type: AuditLogEvent.MemberRoleUpdate, limit: 5 });
      const entry = logs.entries.find(
        (e) => e.target?.id === newMember.id && Date.now() - e.createdTimestamp < 10000,
      );
      executor = entry?.executor || null;
    } catch (err) {
      console.error('[GUARD] Audit log alınamadı:', err.message);
    }
    if (!executor || executor.bot) return; // rolü bot verdiyse (örn. otomatik sistem) sayma

    const now = Date.now();
    const arr = (tracker.get(executor.id) || []).filter((t) => now - t < config.staffAbuse.windowMs);
    arr.push(now);
    tracker.set(executor.id, arr);

    if (arr.length < config.staffAbuse.maxPunishments) return;
    tracker.delete(executor.id);

    const executorMember = await newMember.guild.members.fetch(executor.id).catch(() => null);
    if (!executorMember) return;

    // BİLEREK dokunulmaz rol listesi atlanır - amaç yetkisi olan birinin bile
    // kötüye kullanımını yakalamak. Sadece gerçek sunucu sahibi dokunulmaz kalır.
    const stripped = await punishByStrippingRoles(
      executorMember,
      `Yetki kötüye kullanımı: ${config.staffAbuse.windowMs / 1000} sn içinde ${arr.length}+ ceza rolü verdi`,
      { bypassRoleImmunity: true },
    );

    let caseId = null;
    if (stripped) {
      caseId = addIncident({
        userId: executorMember.id,
        userTag: executorMember.user.tag,
        guildId: newMember.guild.id,
        type: 'yetki-kotuye-kullanim',
        reason: `${config.staffAbuse.windowMs / 1000} sn içinde ${arr.length}+ farklı kişiye ceza rolü verdi`,
        result: 'Tüm rolleri alındı, karantinaya alındı',
      });
      await sendViolatorLog(newMember.guild, executorMember, { caseId, type: 'Yetki Kötüye Kullanımı' });
    }

    await sendGuardLog(newMember.guild, {
      title: '🛡️ Yetki Kötüye Kullanımı Tespit Edildi',
      color: 0x8E44AD,
      fields: [
        { name: 'Kullanıcı', value: `${executorMember} (${executorMember.user.tag})`, inline: false },
        { name: 'Detay', value: `${config.staffAbuse.windowMs / 1000} saniye içinde ${arr.length}+ farklı kişiye ceza rolü (ban/jail/mute/vmute) verdi.`, inline: false },
        { name: 'Sonuç', value: stripped ? '✅ Tüm rolleri alındı, karantinaya alındı' : '⚠️ Rol alınamadı (gerçek sunucu sahibi olabilir)', inline: true },
        { name: 'Case', value: caseId ? `#${caseId}` : '—', inline: true },
      ],
    });
  });
}

module.exports = { register };
