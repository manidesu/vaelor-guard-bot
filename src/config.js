require('dotenv').config();

module.exports = {
  token: process.env.DISCORD_TOKEN,
  prefix: '.',

  // Tüm guard logları bu kanala düşer.
  logChannelId: '1532724722909970632',

  // İhlal yapıp cezalandırılan (rolleri alınan) kişinin ID + etiketli hali ayrıca bu kanala düşer.
  violatorLogChannelId: '1533303429240197170',

  // Cezalandırılan kişiye TÜM rolleri alındıktan sonra SADECE bu rol verilir (karantina rolü).
  quarantineRoleId: '1532516635464695838',

  // `.ihlal @kullanıcı` komutunu kullanabilecek roller.
  logViewRoleIds: ['1531891827391725618'],

  // Sunucu sahibi ZATEN her zaman dokunulmaz. Buradaki roldeki kişiler de
  // anti-nuke/raid/spam/bot guard'larından etkilenmez.
  // NOT: staffAbuse (yetki kötüye kullanımı) modülü bu listeyi BİLEREK atlar,
  // çünkü asıl amacı yetkisi olan kişilerin bile kötüye kullanımını yakalamak.
  immuneRoleIds: ['1531891827391725618'],

  // ---------- ANTI-NUKE ----------
  // Kısa sürede art arda yıkıcı eylem (kanal silme, rol silme, ban) yapan
  // kişinin TÜM ROLLERİ anında alınır.
  antiNuke: {
    enabled: true,
    windowMs: 10000,       // Bu süre (ms) içindeki eylemler sayılır
    maxChannelDeletes: 3,  // windowMs içinde bu kadar kanal silme -> tetiklenir
    maxRoleDeletes: 3,     // windowMs içinde bu kadar rol silme -> tetiklenir
    maxBans: 3,            // windowMs içinde bu kadar ban -> tetiklenir
  },

  // ---------- ANTI-RAID ----------
  // Kısa sürede çok sayıda üye girişi olursa "raid modu" tetiklenir ve
  // bu pencere içinde katılan YENİ (hesap yaşı küçük) hesapların olası
  // rolleri (autorole vb.) anında alınır.
  antiRaid: {
    enabled: true,
    windowMs: 10000,                            // Bu süre (ms) içindeki katılımlar sayılır
    maxJoins: 8,                                 // windowMs içinde bu kadar katılım -> raid modu
    newAccountAgeMs: 7 * 24 * 60 * 60 * 1000,    // Bu yaştan küçük hesaplar "şüpheli" sayılır (7 gün)
  },

  // ---------- ANTI-SPAM ----------
  // Kısa sürede çok sayıda mesaj atan kişinin mesajları silinir ve
  // TÜM ROLLERİ alınır.
  antiSpam: {
    enabled: true,
    windowMs: 5000,        // Bu süre (ms) içindeki mesajlar sayılır
    maxMessages: 6,        // windowMs içinde bu kadar mesaj -> spam sayılır
    deleteSpamMessages: true,
  },

  // ---------- YETKİSİZ BOT EKLEME KORUMASI ----------
  // Whitelist dışı bir bot sunucuya eklenirse: bot anında atılır,
  // botu ekleyen kişinin TÜM ROLLERİ alınır.
  antiBotAdd: {
    enabled: true,
    // Sunucuda bulunmasına izin verilen bot ID'leri (kendi botların dahil).
    allowedBotIds: [
      '1532827843950678218',
      '1532883380633469030',
      '1532866560492830801',
      '1533305585661907004',
    ],
  },

  // ---------- SES KANALINA OTOMATİK KATILMA ----------
  voice: {
    enabled: true,
    channelId: '1532920131376775208',
    activityName: 'Blessed by Mani',
  },

  // ---------- YETKİ KÖTÜYE KULLANIMI (DİĞER BOTLARDAKİ CEZA KOMUTLARININ İSTİSMARI) ----------
  // .ban/.jail/.mute/.vmute gibi komutlar başka bir botta çalışıyor olsa bile,
  // bu komutlar sonucunda verilen "ceza rolleri" Discord'da görünür. Guard bot
  // bu rollerin kime, ne sıklıkla verildiğini audit log üzerinden izler.
  // Kısa sürede çok fazla kişiye ceza rolü veren kişi "kötüye kullanım" sayılır
  // ve KENDİSİ de karantinaya alınır (dokunulmaz rolü BİLEREK atlanır).
  staffAbuse: {
    enabled: true,
    windowMs: 60000,        // 60 saniye
    maxPunishments: 5,      // 60 saniyede 5+ farklı ceza rolü verme -> tetiklenir
    // inziva-t botundaki ceza rollerinin ID'leri
    watchedRoleIds: [
      '1533048563112607805', // ban rolü
      '1533039122254401639', // jail rolü
      '1533220694060695562', // yazılı susturma (mute) rolü
      '1532854360336236676', // sesli susturma (vmute) rolü
    ],
  },
};
