const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'pages', 'Phishing.jsx');
// Read as buffer first to avoid encoding mess
let buffer = fs.readFileSync(filePath);
let content = buffer.toString('utf8');

const fixes = [
  ['KullanÄ±cÄ±', 'Kullanıcı'],
  ['Åžifre', 'Şifre'],
  ['BaÄŸlantÄ±', 'Bağlantı'],
  ['BaÅŸarÄ±lÄ±', 'Başarılı'],
  ['yanÄ±t', 'yanıt'],
  ['Ä°hlal', 'İhlal'],
  ['GÃ¶rÃ¼ntÃ¼leme', 'Görüntüleme'],
  ['MaaÅŸ', 'Maaş'],
  ['Bordrosu', 'Bordrosu'],
  ['Ä°K', 'İK'],
  ['GiriÅŸ', 'Giriş'],
  ['HazÄ±rlandÄ±', 'Hazırlandı'],
  ['aÅŸaÄŸÄ±daki', 'aşağıdaki'],
  ['GÃ–RÃœNTÃœLE', 'GÖRÜNTÜLE'],
  ['GÃ¼venliÄŸiniz', 'Güvenliğiniz'],
  ['ÅŸirket', 'şirket'],
  ['KotasÄ±', 'Kotası'],
  ['YÃ¼ksek', 'Yüksek'],
  ['AlanÄ±nÄ±z', 'Alanınız'],
  ['TÃ¼keniyor', 'Tükeniyor'],
  ['ulaÅŸtÄ±', 'ulaştı'],
  ['alÄ±mÄ±nÄ±z', 'alımınız'],
  ['durdurulacaktÄ±r', 'durdurulacaktır'],
  ['BoÅŸaltÄ±n', 'Boşaltın'],
  ['uyarÄ±sÄ±dÄ±r', 'uyarısıdır'],
  ['iÃ§erisinde', 'içerisinde'],
  ['kÄ±sÄ±tlanacaktÄ±r', 'kısıtlanacaktır'],
  ['ToplantÄ±', 'Toplantı'],
  ['Ä°letiÅŸim', 'İletişim'],
  ['YÄ±llÄ±k', 'Yıllık'],
  ['BÃ¼tÃ§e', 'Bütçe'],
  ['KatÄ±l', 'Katıl'],
  ['OnayÄ±', 'Onayı'],
  ['Ãœyelik', 'Üyelik'],
  ['Ã–demeniz', 'Ödemeniz'],
  ['Ã–nemli', 'Önemli'],
  ['â€¢', '•'],
  ['Ã–NÄ°ZLE', 'ÖNİZLE'],
  ['DÃœZENLE', 'DÜZENLE'],
  ['tÄ±klayan', 'tıklayan'],
  ['DIÅžA AKTAR', 'DIŞA AKTAR'],
  ['Tarih', 'Tarih'],
  ['Durum', 'Durum'],
  ['GÃ¶sterilecek', 'Gösterilecek'],
  ['BT. TESTÄ°', 'BAĞLANTI TESTİ'],
  ['BaÄŸlantÄ± BaÅŸarÄ±lÄ±', 'Bağlantı Başarılı'],
  ['TÄ±klama', 'Tıklama'],
  ['YÃ¶netimi', 'Yönetimi'],
  ['ÅŸablonlarÄ±', 'şablonları'],
  ['dÃ¼zenleyin', 'düzenleyin'],
  ['Ä°hlal GÃ¼nlÃ¼kleri', 'İhlal Günlükleri'],
  ['âš ', '⚠️'],
  ['â”€', '─'],
  ['Ã¼', 'ü'],
  ['Ã¶', 'ö'],
  ['Ã§', 'ç'],
  ['ÅŸ', 'ş'],
  ['ÄŸ', 'ğ'],
  ['Ä±', 'ı'],
  ['Åž', 'Ş'],
  ['Ä°', 'İ'],
  ['Ãœ', 'Ü'],
  ['Ã–', 'Ö'],
  ['Ã‡', 'Ç'],
  ['Äž', 'Ğ'],
  ['âž¤', '➤'],
  ['âœ…', '✅']
];

fixes.forEach(([from, to]) => {
  content = content.split(from).join(to);
});

// Implementation of the new test function logic
if (content.includes('onClick={testSmtpConnection}')) {
   // Already there, good.
} else {
   content = content.replace(
     /onClick={() => toast\.success\('Sunucu yanıt verdi: Bağlantı Başarılı'\)}/g,
     'onClick={testSmtpConnection}'
   );
}

// Write back as UTF-8
fs.writeFileSync(filePath, content, 'utf8');
console.log('Final fix applied.');
