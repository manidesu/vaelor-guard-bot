const config = require('../config');

// Sunucu sahibi ya da immuneRoleIds'deki role sahip biri hiçbir şekilde cezalandırılmaz.
function isImmune(member, guild) {
  if (!member || !guild) return true;
  if (member.id === guild.ownerId) return true;
  return member.roles.cache.some((role) => config.immuneRoleIds.includes(role.id));
}

function isRealOwner(member, guild) {
  return !!member && !!guild && member.id === guild.ownerId;
}

// Belirtilen üyenin TÜM rollerini alıp yerine SADECE karantina rolünü verir.
// bypassRoleImmunity: true ise immuneRoleIds listesi atlanır, sadece gerçek
// sunucu sahibi dokunulmaz sayılır (staffAbuse modülü bunu kullanır).
async function punishByStrippingRoles(member, reason, { bypassRoleImmunity = false } = {}) {
  if (!member) return false;
  const blocked = bypassRoleImmunity ? isRealOwner(member, member.guild) : isImmune(member, member.guild);
  if (blocked) return false;

  try {
    const newRoles = config.quarantineRoleId ? [config.quarantineRoleId] : [];
    await member.roles.set(newRoles, reason);
    return true;
  } catch (err) {
    console.error('[GUARD] Roller alınamadı:', err.message);
    return false;
  }
}

module.exports = { isImmune, isRealOwner, punishByStrippingRoles };
