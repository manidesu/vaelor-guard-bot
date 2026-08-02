const config = require('../config');

async function sendGuardLog(guild, { title, color, fields }) {
  if (!config.logChannelId) return;
  try {
    const channel = await guild.channels.fetch(config.logChannelId).catch(() => null);
    if (!channel) return;
    await channel.send({
      embeds: [{
        title,
        color,
        fields,
        timestamp: new Date().toISOString(),
      }],
    });
  } catch (err) {
    console.error('[GUARD] Log gönderilemedi:', err.message);
  }
}

// İhlal yapıp cezalandırılan (rolleri alınan) kişinin ID + etiketli halini ayrı kanala düşürür.
async function sendViolatorLog(guild, member, { caseId, type } = {}) {
  if (!config.violatorLogChannelId) return;
  try {
    const channel = await guild.channels.fetch(config.violatorLogChannelId).catch(() => null);
    if (!channel) return;
    await channel.send({
      embeds: [{
        title: `🚫 İhlal Kaydı${caseId ? ` — Case #${caseId}` : ''}`,
        description: `${member} (\`${member.id}\`)\nEtiket: ${member.user.tag}${type ? `\nTür: ${type}` : ''}`,
        color: 0x992D22,
        timestamp: new Date().toISOString(),
      }],
    });
  } catch (err) {
    console.error('[GUARD] İhlal log gönderilemedi:', err.message);
  }
}

module.exports = { sendGuardLog, sendViolatorLog };
