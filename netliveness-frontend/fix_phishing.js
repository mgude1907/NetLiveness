const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'pages', 'Phishing.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Fix Broken Mappings (Massive cleanup)
const mappings = [
  { from: /MaaÅŸ/g, to: 'Maaş' },
  { from: /Bordrosu GÃ¶rÃ¼ntÃ¼leme/g, to: 'Bordrosu Görüntüleme' },
  { from: /Ä°K/g, to: 'İK' },
  { from: /GiriÅŸ/g, to: 'Giriş' },
  { from: /HazÄ±rlandÄ±/g, to: 'Hazırlandı' },
  { from: /SayÄ±n Ã‡alÄ±ÅŸanÄ±mÄ±z/g, to: 'Sayın Çalışanımız' },
  { from: /dÃ¶nemine/g, to: 'dönemine' },
  { from: /maaÅŸ/g, to: 'maaş' },
  { from: /yÃ¼klenmiÅŸtir/g, to: 'yüklenmiştir' },
  { from: /gÃ¶rÃ¼ntÃ¼lemek/g, to: 'görüntülemek' },
  { from: /dÃ¶kÃ¼mÃ¼nÃ¼zÃ¼/g, to: 'dökümünüzü' },
  { from: /iÃ§in/g, to: 'için' },
  { from: /aÅŸaÄŸÄ±daki/g, to: 'aşağıdaki' },
  { from: /GÃ–RÃœNTÃœLE/g, to: 'GÖRÜNTÜLE' },
  { from: /GÃ¼venliÄŸiniz/g, to: 'Güvenliğiniz' },
  { from: /sisteme giriÅŸ yaparken ÅŸirket/g, to: 'sisteme giriş yaparken şirket' },
  { from: /KotasÄ±/g, to: 'Kotası' },
  { from: /YÃ¼ksek/g, to: 'Yüksek' },
  { from: /AlanÄ±nÄ±z/g, to: 'Alanınız' },
  { from: /âš ï¸ /g, to: '⚠️' },
  { from: /TÃ¼keniyor/g, to: 'Tükeniyor' },
  { from: /ulaÅŸtÄ±/g, to: 'ulaştı' },
  { from: /alÄ±mÄ±nÄ±z/g, to: 'alımınız' },
  { from: /durdurulacaktÄ±r/g, to: 'durdurulacaktır' },
  { from: /BoÅŸaltÄ±n/g, to: 'Boşaltın' },
  { from: /uyarÄ±sÄ±dÄ±r/g, to: 'uyarısıdır' },
  { from: /iÃ§erisinde/g, to: 'içerisinde' },
  { from: /kÄ±sÄ±tlanacaktÄ±r/g, to: 'kısıtlanacaktır' },
  { from: /ToplantÄ±/g, to: 'Toplantı' },
  { from: /Ä°letiÅŸim/g, to: 'İletişim' },
  { from: /YÄ±llÄ±k/g, to: 'Yıllık' },
  { from: /BÃ¼tÃ§e/g, to: 'Bütçe' },
  { from: /KatÄ±l/g, to: 'Katıl' },
  { from: /OnayÄ±/g, to: 'Onayı' },
  { from: /Firma AdÄ±na/g, to: 'Firma Adına' },
  { from: /OluÅŸturuldu/g, to: 'Oluşturuldu' },
  { from: /Gelir Ä°daresi/g, to: 'Gelir İdaresi' },
  { from: /gelmiÅŸtir/g, to: 'gelmiştir' },
  { from: /gÃ¶rmek/g, to: 'görmek' },
  { from: /baÄŸlantÄ±yÄ±/g, to: 'bağlantıyı' },
  { from: /oluÅŸturulmuÅŸtur/g, to: 'oluşturulmuştur' },
  { from: /Ãœyelik/g, to: 'Üyelik' },
  { from: /AskÄ±ya AlÄ±ndÄ±/g, to: 'Askıya Alındı' },
  { from: /EÄŸlence/g, to: 'Eğlence' },
  { from: /Ã–demeniz/g, to: 'Ödemeniz' },
  { from: /Ã–nemli/g, to: 'Önemli' },
  { from: /ÃœyeliÄŸiniz/g, to: 'Üyeliğiniz' },
  { from: /gerÃ§ekleÅŸtirilemedi/g, to: 'gerçekleştirilemedi' },
  { from: /Ã¼yeliÄŸinizi/g, to: 'üyeleğinizi' },
  { from: /gÃ¼ncelleyin/g, to: 'güncelleyin' },
  { from: /HESABI GÃœNCELLE/g, to: 'HESABI GÜNCELLE' },
  { from: /GÃ¼venliÄŸi/g, to: 'Güvenliği' },
  { from: /FarklÄ±/g, to: 'Farklı' },
  { from: /Tespit Edildi/g, to: 'Tespit Edildi' },
  { from: /GÃ¼venlik Ekibi/g, to: 'Güvenlik Ekibi' },
  { from: /HesabÄ±/g, to: 'Hesabı' },
  { from: /yapÄ±ldÄ±ÄŸÄ±nÄ±/g, to: 'yapıldığını' },
  { from: /ettik/g, to: 'ettik' },
  { from: /iÅŸlemi/g, to: 'işlemi' },
  { from: /gÃ¼venliÄŸini/g, to: 'güvenliğini' },
  { from: /eriÅŸimi/g, to: 'erişimi' },
  { from: /EtkinliÄŸini GÃ¶zden GeÃ§ir/g, to: 'Etkinliğini Gözden Geçir' },
  { from: /Ä°nsan KaynaklarÄ±/g, to: 'İnsan Kaynakları' },
  { from: /Ãœretim/g, to: 'Üretim' },
  { from: /Ä°hlal gÃ¼nlÃ¼kleri/g, to: 'İhlal günlükleri' },
  { from: /â”€â”€â”€/g, to: '───' },
  { from: /ÄŸ/g, to: 'ğ' },
  { from: /ÅŸ/g, to: 'ş' },
  { from: /Ä±/g, to: 'ı' },
  { from: /Ã¼/g, to: 'ü' },
  { from: /Ã¶/g, to: 'ö' },
  { from: /Ã§/g, to: 'ç' },
  { from: /Åž/g, to: 'Ş' },
  { from: /Ä°/g, to: 'İ' },
  { from: /Ãœ/g, to: 'Ü' },
  { from: /Ã–/g, to: 'Ö' },
  { from: /Ã‡/g, to: 'Ç' },
  { from: /Äž/g, to: 'Ğ' },
  { from: /BaÄŸlantÄ± BaÅŸarÄ±lÄ±/g, to: 'Bağlantı Başarılı' },
  { from: /yanÄ±t verdi/g, to: 'yanıt verdi' },
  { from: /TÄ±klama/g, to: 'Tıklama' },
  { from: /YÃ¶netimi/g, to: 'Yönetimi' },
  { from: /ÅŸablonlarÄ±/g, to: 'şablonları' },
  { from: /dÃ¼zenleyin/g, to: 'düzenleyin' },
  { from: /VARSAYILANA SIFIRLANDI/g, to: 'VARSAYILANA SIFIRLANDI' },
  { from: /â€¢/g, to: '•' },
  { from: /Ã–NÄ°ZLE/g, to: 'ÖNİZLE' },
  { from: /DÃœZENLE/g, to: 'DÜZENLE' },
  { from: /Ä°hlal GÃ¼nlÃ¼kleri/g, to: 'İhlal Günlükleri' },
  { from: /tÄ±klayan/g, to: 'tıklayan' },
  { from: /DIÅžA AKTAR/g, to: 'DIŞA AKTAR' },
  { from: /KullanÄ±cÄ±/g, to: 'Kullanıcı' },
  { from: /Tarih/g, to: 'Tarih' },
  { from: /Durum/g, to: 'Durum' },
  { from: /Linke TÄ±klandÄ±/g, to: 'Linke Tıklandı' },
  { from: /Ä°HLAL/g, to: 'İHLAL' },
  { from: /GÃ¶sterilecek/g, to: 'Gösterilecek' },
  { from: /baÅŸlatÄ±n/g, to: 'başlatın' },
  { from: /YÃ¶netilen/g, to: 'Yönetilen' },
  { from: /KayÄ±tlÄ±/g, to: 'Kayıtlı' },
  { from: /âš /g, to: '⚠️' }
];

mappings.forEach(m => {
  content = content.replace(m.from, m.to);
});

// 2. Fix the "BT. TESTİ" button and implementation
if (content.includes('BT. TESTİ')) {
  content = content.replace(
    /BT. TESTİ/g, 
    'BAĞLANTI TESTİ'
  );
  // Ensure the function call is correct
  content = content.replace(
    /onClick={() => toast.success\('Sunucu yanıt verdi: Bağlantı Başarılı'\)}/g, 
    'onClick={testSmtpConnection}'
  );
}

// 3. Double Check function existence (In case it was also corrupted)
if (!content.includes('const testSmtpConnection')) {
  // Add it after saveTemplates or saveSmtp
  const anchor = 'const saveSmtp = (settings) => {';
  const functionCode = `  const testSmtpConnection = async () => {
    const loadingToast = toast.loading('Bağlantı test ediliyor...');
    try {
      const response = await fetch('http://191.168.1.228:3001/api/test-smtp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ smtp })
      });
      const data = await response.json();
      toast.dismiss(loadingToast);
      if (data.success) {
        toast.success('Bağlantı Başarılı!');
      } else {
        toast.error('Bağlantı Hatası: ' + data.error);
      }
    } catch (err) {
      toast.dismiss(loadingToast);
      toast.error('Sunucuya erişilemiyor.');
    }
  };\n\n`;
  content = content.replace(anchor, functionCode + anchor);
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fix applied successfully.');
