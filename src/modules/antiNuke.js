const { AuditLogEvent } = require('discord.js');
const config = require('../config');
const { isImmune, punishByStrippingRoles } = require('../utils/punish');
const { sendGuardLog, sendViolatorLog } = require('../utils/log');
const { addIncident } = require('../utils/incidents');

// userId -> timestamp[] (her eylem türü için ayrı takip)
const channelDeleteTracker = new Map();
const roleDeleteTracker = new Map();
const banTracker = new Map();

function trackAndCheck(tracker, userId, windowMs, limit) {
  const now = Date.now();
  const arr = (tracker.get(userId) || []).filter((t) => now - t < windowMs);
  arr.push(now);
  tracker.set(userId, arr);
  return arr.length >= limit;
}

async function fetchExecutor(guild, auditLogType, targetId) {
  try {
    const logs = await guild.fetchAuditLogs({ type: auditLogType, limit: 5 });
    const entry = logs.entries.find(
      (e) => e.target?.id === targetId && Date.now() - e.createdTimestamp < 10000,
    );
    return entry?.executor || null;
  } catch (err) {
    console.error('[GUARD] Audit log alınamadı:', err.message);
    return null;
  }
}

async function handleDestructiveAction(guild, executor, actionLabel) {
  if (!executor || executor.bot) return;
  const member = await guild.members.fetch(executor.id).catch(() => null);
  if (!member) return;
  if (isImmune(member, guild)) return;

  const stripped = await punishByStrippingRoles(member, `Anti-nuke: ${actionLabel}`);

  let caseId = null;
  if (stripped) {
    caseId = addIncident({
      userId: member.id,
      userTag: member.user.tag,
      guildId: guild.id,
      type: 'anti-nuke',
      reason: actionLabel,
      result: 'Tüm rolleri alındı, karantinaya alındı',
    });
    await sendViolatorLog(guild, member, { caseId, type: 'Anti-Nuke' });
  }

  await sendGuardLog(guild, {
    title: '🛡️ Anti-Nuke Tetiklendi',
    color: 0xE74C3C,
    fields: [
      { name: 'Kullanıcı', value: `${member} (${member.user.tag})`, inline: false },
      { name: 'Eylem', value: actionLabel, inline: false },
      { name: 'Sonuç', value: stripped ? '✅ Tüm rolleri alındı, karantinaya alındı' : '⚠️ Rol alınamadı (yetki/hiyerarşi sorunu)', inline: true },
      { name: 'Case', value: caseId ? `#${caseId}` : '—', inline: true },
    ],
  });
}

function register(client) {
  if (!config.antiNuke.enabled) return;

  client.on('channelDelete', async (channel) => {
    if (!channel.guild) return;
    const executor = await fetchExecutor(channel.guild, AuditLogEvent.ChannelDelete, channel.id);
    if (!executor) return;
    if (trackAndCheck(channelDeleteTracker, executor.id, config.antiNuke.windowMs, config.antiNuke.maxChannelDeletes)) {
      await handleDestructiveAction(
        channel.guild,
        executor,
        `${config.antiNuke.windowMs / 1000} saniye içinde ${config.antiNuke.maxChannelDeletes}+ kanal silme`,
      );
    }
  });

  client.on('roleDelete', async (role) => {
    const executor = await fetchExecutor(role.guild, AuditLogEvent.RoleDelete, role.id);
    if (!executor) return;
    if (trackAndCheck(roleDeleteTracker, executor.id, config.antiNuke.windowMs, config.antiNuke.maxRoleDeletes)) {
      await handleDestructiveAction(
        role.guild,
        executor,
        `${config.antiNuke.windowMs / 1000} saniye içinde ${config.antiNuke.maxRoleDeletes}+ rol silme`,
      );
    }
  });

  client.on('guildBanAdd', async (ban) => {
    const executor = await fetchExecutor(ban.guild, AuditLogEvent.MemberBanAdd, ban.user.id);
    if (!executor) return;
    if (trackAndCheck(banTracker, executor.id, config.antiNuke.windowMs, config.antiNuke.maxBans)) {
      await handleDestructiveAction(
        ban.guild,
        executor,
        `${config.antiNuke.windowMs / 1000} saniye içinde ${config.antiNuke.maxBans}+ ban`,
      );
    }
  });
}

module.exports = { register };
