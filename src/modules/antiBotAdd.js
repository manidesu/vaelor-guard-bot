const { AuditLogEvent } = require('discord.js');
const config = require('../config');
const { isImmune, punishByStrippingRoles } = require('../utils/punish');
const { sendGuardLog, sendViolatorLog } = require('../utils/log');
const { addIncident } = require('../utils/incidents');

function register(client) {
  if (!config.antiBotAdd.enabled) return;

  client.on('guildMemberAdd', async (member) => {
    if (!member.user.bot) return;
    if (config.antiBotAdd.allowedBotIds.includes(member.id)) return;

    // Botu kimin eklediğini audit log'dan öğren
    let inviter = null;
    try {
      const logs = await member.guild.fetchAuditLogs({ type: AuditLogEvent.BotAdd, limit: 5 });
      const entry = logs.entries.find(
        (e) => e.target?.id === member.id && Date.now() - e.createdTimestamp < 10000,
      );
      inviter = entry?.executor || null;
    } catch (err) {
      console.error('[GUARD] Audit log alınamadı:', err.message);
    }

    // Whitelist dışı botu anında at
    await member.kick('Yetkisiz bot - whitelist dışı').catch((err) => {
      console.error('[GUARD] Yetkisiz bot atılamadı:', err.message);
    });

    let inviterResult = 'Bilinmiyor';
    let caseId = null;

    if (inviter) {
      const inviterMember = await member.guild.members.fetch(inviter.id).catch(() => null);
      if (inviterMember && isImmune(inviterMember, member.guild)) {
        inviterResult = `${inviterMember} (${inviterMember.user.tag}) — dokunulmaz, işlem yapılmadı`;
      } else if (inviterMember) {
        const stripped = await punishByStrippingRoles(inviterMember, 'Anti-nuke: yetkisiz bot ekleme');
        if (stripped) {
          caseId = addIncident({
            userId: inviterMember.id,
            userTag: inviterMember.user.tag,
            guildId: member.guild.id,
            type: 'anti-bot-add',
            reason: `Yetkisiz bot ekledi: ${member.user.tag}`,
            result: 'Tüm rolleri alındı, karantinaya alındı',
          });
          await sendViolatorLog(member.guild, inviterMember, { caseId, type: 'Yetkisiz Bot Ekleme' });
        }
        inviterResult = stripped
          ? `${inviterMember} (${inviterMember.user.tag}) — ✅ tüm rolleri alındı`
          : `${inviterMember} (${inviterMember.user.tag}) — ⚠️ rol alınamadı`;
      }
    }

    await sendGuardLog(member.guild, {
      title: '🛡️ Yetkisiz Bot Eklendi ve Atıldı',
      color: 0x992D22,
      fields: [
        { name: 'Bot', value: `${member.user.tag} (${member.id})`, inline: false },
        { name: 'Ekleyen', value: inviterResult, inline: false },
        { name: 'Case', value: caseId ? `#${caseId}` : '—', inline: true },
      ],
    });
  });
}

module.exports = { register };
