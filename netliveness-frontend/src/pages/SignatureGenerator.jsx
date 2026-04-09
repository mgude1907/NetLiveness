import { useState, useRef, useEffect } from 'react';
import { 
  User, Briefcase, Phone, Smartphone, Mail, Globe, MapPin, 
  Copy, Code, CircleCheck, Info, Printer, Search, X, Users, Building2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getPersonnel } from '../api';

const COMPANIES = {
  RET: {
    id: 'RET',
    name: 'RET',
    fullName: 'REPKON Energetic Technologies Makina Sanayi ve Ticaret A.Ş.',
    logo: '/repkon_energetics.png',
    website: 'www.repkonenergetic.com.tr',
    emailSuffix: '@repkonenergetic.com.tr',
    color: '#fdb913',
    address: 'Yaman Evler, İnkılap Mah, Dr. Adnan Büyükdeniz Cd. No:13 34768 Ümraniye, Istanbul, TÜRKİYE',
    fax: '+90 216 739 59 14',
    layout: 'vertical-split',
    hasEcoVadis: true
  },
  RMK: {
    id: 'RMK',
    name: 'RMK',
    fullName: 'REPKON Machine and Tool Industry and Trade Inc.',
    logo: '/rmk_logo.png',
    tagline: '... setting flowforming \'free\'',
    website: 'www.repkon.com.tr',
    emailSuffix: '@repkon.com.tr',
    color: '#fdb913',
    address: 'Balibey Mah. Fabrika Sok. No:1, 34980 Sile – Istanbul TURKEY',
    tel: '+90 850 325 77 77 (Ext.: 186)',
    fax: '+90 216 739 59 14',
    layout: 'horizontal-lined',
    hasEcoVadis: false
  },
  RMT: {
    id: 'RMT',
    name: 'RMT',
    fullName: 'REPKON İMALAT TEKNOLOJİSİ SAN. VE TİC. A.Ş.',
    logo: '/rmt_logo.png',
    website: 'www.repkonimalat.com.tr',
    emailSuffix: '@repkonimalat.com.tr',
    color: '#fdb913',
    address: 'Çerkeşli OSB Mah. İmes 3 Bul. A Blok No: 30 Dilovası / Kocaeli',
    tel: '0262 999 18 40 (Dahili: 3717)',
    fax: '0262 999 18 41', // Default or from draft if provided
    layout: 'horizontal-lined',
    hasEcoVadis: false
  },
  RDN: {
    id: 'RDN',
    name: 'RDN',
    fullName: 'REPKON Savunma ve Silah Sistemleri A.Ş.',
    logo: '/repkon-logo.png',
    website: 'www.repkonsavunma.com.tr',
    emailSuffix: '@repkonsavunma.com.tr',
    color: '#fdb913',
    address: 'Şerifali Mah. Kızılca Sok. No:1 34775 Ümraniye, Istanbul, TÜRKİYE',
    fax: '+90 216 364 38 12',
    layout: 'vertical-split',
    hasEcoVadis: true
  },
  CLR: {
    id: 'CLR',
    name: 'Calor',
    fullName: 'Calor Makine Sanayi Ticaret A.Ş.',
    logo: '/calor_logo.png',
    website: 'www.calor.com.tr',
    emailSuffix: '@calor.com.tr',
    color: '#005596',
    address: 'Çerkeşli OSB Mahallesi, İmes OSB 1 Bulvarı, No:7 PK:41455 Dilovası-Kocaeli/TÜRKİYE',
    tel: '+90 262 999 66 86',
    mobile: '+90 536 903 76 14',
    layout: 'calor-custom',
    hasEcoVadis: false
  },
  RHA: {
    id: 'RHA',
    name: 'RHA',
    fullName: 'REPKON Havacılık ve Uzay Sistemleri A.Ş.',
    logo: '/repkon-logo.png',
    website: 'www.repkon.com.tr',
    emailSuffix: '@repkon.com.tr',
    color: '#fdb913',
    address: 'Şerifali Mah. Kızılca Sok. No:1 34775 Ümraniye, Istanbul, TÜRKİYE',
    fax: '+90 216 364 38 12',
    layout: 'vertical-split',
    hasEcoVadis: true
  }
};

const slugify = (text) => {
  const trMap = {
    'ç': 'c', 'ğ': 'g', 'ı': 'i', 'ö': 'o', 'ş': 's', 'ü': 'u',
    'Ç': 'c', 'Ğ': 'g', 'İ': 'i', 'Ö': 'o', 'Ş': 's', 'Ü': 'u'
  };
  for (let key in trMap) {
    text = text.replace(new RegExp(key, 'g'), trMap[key]);
  }
  return text.toLowerCase().replace(/[^a-z0-9]/g, '');
};

export default function SignatureGenerator() {
  const [selectedCompany, setSelectedCompany] = useState(COMPANIES.RET);
  const [form, setForm] = useState({
    fullName: '',
    title: '',
    email: '',
    phone: '',
    tel: COMPANIES.RET.tel || '',
    website: COMPANIES.RET.website,
    companyName: COMPANIES.RET.fullName,
    address: COMPANIES.RET.address,
    fax: COMPANIES.RET.fax
  });

  const [personnel, setPersonnel] = useState([]);
  const [showPicker, setShowPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [customLogo, setCustomLogo] = useState(null);
  const [copied, setCopied] = useState(false);
  const signatureRef = useRef(null);

  useEffect(() => {
    loadPersonnel();
  }, []);

  const loadPersonnel = async () => {
    try {
      const data = await getPersonnel();
      setPersonnel(data);
    } catch (e) {
      console.error('Personel yüklenemedi:', e);
    }
  };

  const handleCompanyChange = (companyId) => {
    const comp = COMPANIES[companyId];
    setSelectedCompany(comp);
    setForm(prev => ({
      ...prev,
      companyName: comp.fullName,
      website: comp.website,
      address: comp.address,
      fax: comp.fax || '',
      tel: comp.tel || '',
      phone: comp.mobile || prev.phone,
      email: prev.fullName ? (slugify(prev.fullName.split(' ')[0]) + '.' + slugify(prev.fullName.split(' ').slice(-1)[0]) + comp.emailSuffix) : prev.email
    }));
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCustomLogo(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const selectPerson = (p) => {
    const firstName = slugify(p.ad || '');
    const lastName = slugify(p.soyad || '');
    
    setForm({
      ...form,
      fullName: p.adSoyad,
      title: p.gorev || '',
      email: p.email || (firstName + '.' + lastName + selectedCompany.emailSuffix)
    });
    setShowPicker(false);
  };

  const handleCopyVisual = async () => {
    try {
      const range = document.createRange();
      range.selectNode(signatureRef.current);
      window.getSelection().removeAllRanges();
      window.getSelection().addRange(range);
      document.execCommand('copy');
      window.getSelection().removeAllRanges();
      
      toast.success('İmza görsel olarak kopyalandı!');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Kopyalama başarısız oldu.');
    }
  };

  const handleCopyHTML = () => {
    const html = signatureRef.current.innerHTML;
    navigator.clipboard.writeText(html);
    toast.success('HTML kodu kopyalandı!');
  };

  const filteredPersonnel = personnel.filter(p => 
    p.adSoyad?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.sicilNo?.includes(searchQuery)
  );

  return (
    <div className="animate-in">
      <div className="page-header">
        <div>
          <h2>E-posta İmza Oluşturucu</h2>
          <p>Şirket seçimini yapın ve kurumsal taslağa uygun imzanızı hazırlayın.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-ghost" onClick={() => setShowPicker(true)}>
            <Users size={16} /> Personel Seç
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '24px', alignItems: 'start' }}>
        {/* Form Section */}
        <div className="card">
          <div className="card-header">
            <h3><Building2 size={16} /> Şirket Seçimi</h3>
          </div>
          
          <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
            {Object.keys(COMPANIES).map(id => (
              <button 
                key={id}
                className={`btn ${selectedCompany.id === id ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => handleCompanyChange(id)}
                style={{ minWidth: '80px' }}
              >
                {id}
              </button>
            ))}
          </div>

          <div className="card-header" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px', marginTop: '0' }}>
            <h3><User size={16} /> Bilgileri Güncelle</h3>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Ad Soyad</label>
              <div className="search-box">
                <User />
                <input value={form.fullName} onChange={e => setForm({...form, fullName: e.target.value})} placeholder="Örn: Murat IŞIK" />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Unvan (TR / EN)</label>
              <div className="search-box">
                <Briefcase />
                <input value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="Örn: Muhasebe Uzmanı / Accounting" />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>E-posta</label>
              <div className="search-box">
                <Mail />
                <input value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="Örn: hakan.cinar@repkon.com.tr" />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Cep Telefonu</label>
                <div className="search-box">
                  <Smartphone />
                  <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="+905417824753" />
                </div>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Tel (Sabit)</label>
                <div className="search-box">
                  <Phone />
                  <input value={form.tel} onChange={e => setForm({...form, tel: e.target.value})} />
                </div>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Şirket Ünvanı</label>
              <div className="search-box">
                <Building2 />
                <input value={form.companyName} onChange={e => setForm({...form, companyName: e.target.value})} />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Website</label>
                <div className="search-box">
                  <Globe />
                  <input value={form.website} onChange={e => setForm({...form, website: e.target.value})} />
                </div>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Fax</label>
                <div className="search-box">
                  <Printer />
                  <input value={form.fax} onChange={e => setForm({...form, fax: e.target.value})} />
                </div>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Adres</label>
              <div className="search-box">
                <MapPin />
                <input value={form.address} onChange={e => setForm({...form, address: e.target.value})} />
              </div>
            </div>

            <div className="form-group" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '15px' }}>
              <label>Özel Logo (Manuel)</label>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <input 
                  type="file" 
                  id="logo-upload" 
                  hidden 
                  accept="image/*" 
                  onChange={handleLogoUpload} 
                />
                <button className="btn btn-ghost" onClick={() => document.getElementById('logo-upload').click()} style={{ width: '100%' }}>
                   Logo Seç
                </button>
                {customLogo && (
                  <button className="btn btn-icon" onClick={() => setCustomLogo(null)} title="Sıfırla">
                    <X size={16} />
                  </button>
                )}
              </div>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '5px' }}>
                * Kendi logonuzu yükleyebilirsiniz (Şirket logosu yerine kullanılır).
              </p>
            </div>
          </div>
        </div>

        {/* Preview Section */}
        <div style={{ position: 'sticky', top: '20px' }}>
          <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
            <div className="card-header" style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', margin: 0, background: 'var(--bg-secondary)' }}>
              <h3>Yeni Tasarım Önizleme</h3>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn btn-primary" onClick={handleCopyVisual}>
                  {copied ? <CircleCheck size={16} /> : <Copy size={16} />} 
                  Görsel Kopyala
                </button>
                <button className="btn btn-ghost" onClick={handleCopyHTML}>
                  <Code size={16} /> HTML
                </button>
              </div>
            </div>
            
            <div style={{ padding: '30px', background: '#ffffff', minHeight: '350px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div ref={signatureRef} style={{ fontStyle: 'normal', color: '#000000', backgroundColor: '#ffffff' }}>
                
                {/* CONDITIONAL LAYOUT CHOICE */}
                {selectedCompany.layout === 'vertical-split' ? (
                  /* GLOBAL VERTICAL - AGGRESSIVELY DOWNSIZED (320px) */
                  <table cellPadding="0" cellSpacing="0" border="0" style={{ fontFamily: 'Segoe UI, Arial, sans-serif', fontSize: '10px', width: '320px' }}>
                    <tr>
                      <td style={{ verticalAlign: 'top', width: '120px', textAlign: 'center', paddingRight: '12px' }}>
                        <div style={{ marginBottom: '4px', textAlign: 'center' }}>
                          <img 
                            src={customLogo || selectedCompany.logo} 
                            alt={selectedCompany.name} 
                            width="110" 
                            style={{ display: 'block', margin: '0 auto' }} 
                          />
                        </div>
                        <div style={{ marginBottom: '8px', textAlign: 'center' }}>
                          <a href={`https://${form.website}`} target="_blank" style={{ color: '#0a76be', textDecoration: 'underline', fontSize: '8px', fontWeight: 'bold', display: 'block' }}>
                            {form.website}
                          </a>
                        </div>
                        {selectedCompany.hasEcoVadis && (
                          <div style={{ marginTop: '6px', textAlign: 'center' }}>
                            <img src="/ecovadis.png" alt="EcoVadis" width="65" style={{ display: 'block', margin: '0 auto' }} />
                          </div>
                        )}
                      </td>
                      <td style={{ verticalAlign: 'top', paddingLeft: '12px', borderLeft: `1.5px solid ${selectedCompany.color}` }}>
                        <div style={{ marginBottom: '10px' }}>
                          <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#000' }}>{form.fullName || 'Personel Adı'}</div>
                          <div style={{ fontSize: '9px', color: '#666', fontStyle: 'italic', marginTop: '1px' }}>{form.title || 'Personel Unvanı'}</div>
                          <div style={{ marginTop: '5px' }}>
                            <a href={`mailto:${form.email}`} style={{ color: '#000', textDecoration: 'underline', fontWeight: '600' }}>{form.email || 'e-posta@repkon.com.tr'}</a>
                          </div>
                        </div>
                        <div style={{ height: '2px', backgroundColor: selectedCompany.color, width: '100%', marginBottom: '6px' }}></div>
                        <div style={{ fontSize: '9px', fontWeight: 'bold', marginBottom: '4px' }}>{form.companyName}</div>
                        <table cellPadding="0" cellSpacing="0" border="0" style={{ fontSize: '9px', color: '#333', lineHeight: '1.2' }}>
                          <tr><td style={{ verticalAlign: 'top', paddingRight: '5px' }}><b>Adres:</b></td><td><a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(form.address)}`} target="_blank" style={{ color: '#0a76be', textDecoration: 'underline' }}>{form.address}</a></td></tr>
                          {form.tel && <tr><td style={{ paddingTop: '4px' }}><b>Tel:</b></td><td style={{ paddingTop: '4px' }}>{form.tel}</td></tr>}
                          {form.phone && <tr><td style={{ paddingTop: '4px' }}><b>GSM:</b></td><td style={{ paddingTop: '4px' }}>{form.phone}</td></tr>}
                          {form.fax && <tr><td style={{ paddingTop: '4px' }}><b>Fax:</b></td><td style={{ paddingTop: '4px' }}>{form.fax}</td></tr>}
                        </table>
                        <div style={{ marginTop: '12px', display: 'flex', gap: '10px' }}>
                          <a href="https://linkedin.com/company/repkon"><img src="https://cdn-icons-png.flaticon.com/32/174/174857.png" width="14" height="14" alt="LI" /></a>
                          <a href="https://youtube.com/@repkon"><img src="https://cdn-icons-png.flaticon.com/32/1384/1384060.png" width="14" height="14" alt="YT" /></a>
                          <a href="https://x.com/repkon"><img src="https://cdn-icons-png.flaticon.com/32/5969/5969020.png" width="14" height="14" alt="X" /></a>
                          <a href="https://instagram.com/repkon"><img src="https://cdn-icons-png.flaticon.com/32/2111/2111463.png" width="14" height="14" alt="IG" /></a>
                        </div>
                      </td>
                    </tr>
                    <DisclaimerRow />
                  </table>
                ) : selectedCompany.layout === 'calor-custom' ? (
                  /* CALOR CUSTOM LAYOUT - AGGRESSIVELY DOWNSIZED (320px) */
                  <table cellPadding="0" cellSpacing="0" border="0" style={{ fontFamily: 'Segoe UI, Arial, sans-serif', fontSize: '9px', width: '320px', color: '#333' }}>
                    <tr>
                      <td style={{ paddingBottom: '10px' }}>
                        <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#004080' }}>{form.fullName || 'Yunus Aydemir'}</div>
                        <div style={{ fontSize: '9px', color: '#666' }}>{form.title || 'İdari İşler ve Teknik Hizmetler'}</div>
                      </td>
                    </tr>
                    <tr>
                      <td style={{ paddingBottom: '10px' }}>
                        <img src={customLogo || selectedCompany.logo} alt="Calor logo" width="130" style={{ display: 'block' }} />
                      </td>
                    </tr>
                    <tr>
                      <td style={{ paddingBottom: '10px', fontSize: '11px', fontWeight: 'bold' }}>
                        <span style={{ backgroundColor: '#ffcc00', padding: '0 4px', color: '#000' }}>Calor</span> 
                        <span style={{ color: '#004080', marginLeft: '4px' }}>Makine Sanayi Ticaret A.Ş.</span>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <table cellPadding="0" cellSpacing="0" border="0" style={{ fontSize: '9px', color: '#333', lineHeight: '1.4' }}>
                          <tr><td><b>Phone:</b> {form.tel}</td></tr>
                          <tr><td><b>Mobile:</b> {form.phone}</td></tr>
                          <tr>
                            <td>
                              <b>Email:</b> <a href={`mailto:${form.email}`} style={{ color: '#0a76be', textDecoration: 'underline' }}>{form.email}</a> 
                              <span style={{ margin: '0 5px', color: '#ccc' }}>|</span> 
                              <b>Site:</b> <a href={`https://${form.website}`} target="_blank" style={{ color: '#0a76be', textDecoration: 'none' }}>{form.website}</a>
                            </td>
                          </tr>
                          <tr><td style={{ paddingTop: '5px' }}><b>Adres:</b> {form.address}</td></tr>
                        </table>
                      </td>
                    </tr>
                    <DisclaimerRow />
                  </table>
                ) : (
                  /* RMK/RMT LAYOUT (Horizontal) - AGGRESSIVELY DOWNSIZED (350px) */
                  <table cellPadding="0" cellSpacing="0" border="0" style={{ fontFamily: 'Segoe UI, Arial, sans-serif', fontSize: '10px', width: '350px', borderTop: `1px solid ${selectedCompany.color}` }}>
                    <tr>
                      <td style={{ padding: '12px 0', verticalAlign: 'top' }}>
                        <table cellPadding="0" cellSpacing="0" border="0" style={{ width: '100%' }}>
                          <tr>
                            <td style={{ width: '130px', verticalAlign: 'top' }}>
                              <img src={customLogo || selectedCompany.logo} alt={selectedCompany.name} width="120" style={{ display: 'block' }} />
                              <div style={{ fontSize: '8px', color: '#666', fontStyle: 'italic', marginTop: '3px', paddingLeft: '20px' }}>{selectedCompany.tagline}</div>
                            </td>
                            <td style={{ paddingLeft: '20px', verticalAlign: 'middle' }}>
                              <div style={{ fontSize: '12px', fontWeight: 'bold' }}>{form.fullName || 'Personel Adı'}</div>
                              <div style={{ fontSize: '9px', color: '#666', fontStyle: 'italic' }}>{form.title}</div>
                              <div style={{ marginTop: '3px' }}>
                                <a href={`mailto:${form.email}`} style={{ color: '#0a76be', textDecoration: 'underline', fontWeight: '600' }}>{form.email}</a>
                              </div>
                              <div style={{ fontSize: '9px', color: '#666', marginTop: '1px' }}>{form.phone}</div>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    <tr><td style={{ height: '1px', borderBottom: `1px solid ${selectedCompany.color}` }}></td></tr>
                    <tr>
                      <td style={{ padding: '12px 0', verticalAlign: 'top' }}>
                        <table cellPadding="0" cellSpacing="0" border="0" style={{ width: '100%' }}>
                          <tr>
                            <td style={{ width: '130px', verticalAlign: 'top', textAlign: 'center' }}>
                              <a href={`https://${form.website}`} target="_blank" style={{ color: '#0a76be', textDecoration: 'underline', fontWeight: 'bold', fontSize: '9px' }}>{form.website}</a>
                              <div style={{ marginTop: '8px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
                                <a href="https://linkedin.com/company/repkon"><img src="https://cdn-icons-png.flaticon.com/32/174/174857.png" width="14" height="14" alt="LI" /></a>
                                <a href="https://youtube.com/@repkon"><img src="https://cdn-icons-png.flaticon.com/32/1384/1384060.png" width="14" height="14" alt="YT" /></a>
                                <a href="https://x.com/repkon"><img src="https://cdn-icons-png.flaticon.com/32/5969/5969020.png" width="14" height="14" alt="X" /></a>
                                <a href="https://instagram.com/repkon"><img src="https://cdn-icons-png.flaticon.com/32/2111/2111463.png" width="14" height="14" alt="IG" /></a>
                              </div>
                            </td>
                            <td style={{ paddingLeft: '20px', fontSize: '9px', color: '#333' }}>
                              <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#005596', marginBottom: '3px' }}>{form.companyName}</div>
                              <table cellPadding="0" cellSpacing="0" border="0" style={{ fontSize: '9px', color: '#666' }}>
                                <tr><td style={{ verticalAlign: 'top', width: '40px' }}>Address:</td><td>{form.address}</td></tr>
                                <tr><td style={{ paddingTop: '2px' }}>Tel:</td><td style={{ paddingTop: '2px' }}>{form.tel}</td></tr>
                                <tr><td style={{ paddingTop: '2px' }}>Fax:</td><td style={{ paddingTop: '2px' }}>{form.fax}</td></tr>
                              </table>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    <DisclaimerRow />
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showPicker && (
        <div className="modal-overlay" onClick={() => setShowPicker(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3>Personel Seçimi</h3>
              <button className="btn-icon" onClick={() => setShowPicker(false)}><X size={18} /></button>
            </div>
            <div className="toolbar" style={{ marginTop: '0' }}>
              <div className="search-box">
                <Search />
                <input placeholder="İsim veya Sicil No ile ara..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} autoFocus />
              </div>
            </div>
            <div style={{ maxHeight: '400px', overflowY: 'auto', marginTop: '12px' }}>
              {filteredPersonnel.map(p => (
                <div key={p.id} className="list-item" onClick={() => selectPerson(p)} style={{ cursor: 'pointer', padding: '12px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{p.adSoyad}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{p.gorev} | {p.bolum}</div>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{p.firma}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DisclaimerRow() {
  return (
    <tr>
      <td colSpan="3" style={{ paddingTop: '20px', borderTop: '1px solid #eee', fontSize: '8px', color: '#999', textAlign: 'justify', lineHeight: '1.2' }}>
        Bu e-posta ve ekleri gizlidir ve sadece gönderilen kişi veya kuruluşa özeldir. Eğer bu e-postanın alıcısı değilseniz, içeriğini kullanmanız, kopyalamanız veya dağıtmanız kesinlikle yasaktır ve hukuki sorumluluk doğurabilir. 
        <br /><span style={{ color: '#22c55e', fontWeight: 'bold' }}>Enerjinizi boşa harcamayınız, lütfen gereksiz yere çıktı almayarak doğayı koruyunuz.</span>
      </td>
    </tr>
  );
}
