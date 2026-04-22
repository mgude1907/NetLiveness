import { useState, useRef, useEffect, useCallback } from 'react';
import { 
  User, Briefcase, Phone, Smartphone, Mail, Globe, MapPin, 
  Copy, Code, CircleCheck, Info, Printer, Search, X, Users, Building2,
  PenTool, Layout, Palette, Share2, Stars, Check, ChevronRight,
  Download, Eye, Instagram, Linkedin, Youtube, Twitter, Facebook,
  ArrowLeft
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getPersonnel } from '../api';
import { useLocation, useNavigate } from 'react-router-dom';

const COMPANIES = {
  RET: {
    id: 'RET',
    name: 'RET',
    fullName: 'REPKON Energetic Technologies Makina Sanayi ve Ticaret A.Ş.',
    logo: '/repkon_energetics.png',
    website: 'www.repkonenergetic.com.tr',
    emailSuffix: '@repkonenergetic.com.tr',
    color: '#f59e0b',
    address: 'Yaman Evler, İnkılap Mah, Dr. Adnan Büyükdeniz Cd. No:13 34768 Ümraniye, Istanbul, TÜRKİYE',
    fax: '+90 216 739 59 14',
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
    color: '#f59e0b',
    address: 'Balibey Mah. Fabrika Sok. No:1, 34980 Sile – Istanbul TURKEY',
    tel: '+90 850 325 77 77 (Ext.: 186)',
    fax: '+90 216 739 59 14',
    hasEcoVadis: false
  },
  RMT: {
    id: 'RMT',
    name: 'RMT',
    fullName: 'REPKON İMALAT TEKNOLOJİSİ SAN. VE TİC. A.Ş.',
    logo: '/rmt_logo.png',
    website: 'www.repkonimalat.com.tr',
    emailSuffix: '@repkonimalat.com.tr',
    color: '#f59e0b',
    address: 'Çerkeşli OSB Mah. İmes 3 Bul. A Blok No: 30 Dilovası / Kocaeli',
    tel: '0262 999 18 40 (Dahili: 3717)',
    fax: '0262 999 18 41',
    hasEcoVadis: false
  },
  RDN: {
    id: 'RDN',
    name: 'RDN',
    fullName: 'REPKON Savunma ve Silah Sistemleri A.Ş.',
    logo: '/repkon-logo.png',
    website: 'www.repkonsavunma.com.tr',
    emailSuffix: '@repkonsavunma.com.tr',
    color: '#f59e0b',
    address: 'Şerifali Mah. Kızılca Sok. No:1 34775 Ümraniye, Istanbul, TÜRKİYE',
    fax: '+90 216 364 38 12',
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
    hasEcoVadis: false
  },
  RHA: {
    id: 'RHA',
    name: 'RHA',
    fullName: 'REPKON Havacılık ve Uzay Sistemleri A.Ş.',
    logo: '/repkon-logo.png',
    website: 'www.repkon.com.tr',
    emailSuffix: '@repkon.com.tr',
    color: '#f59e0b',
    address: 'Şerifali Mah. Kızılca Sok. No:1 34775 Ümraniye, Istanbul, TÜRKİYE',
    fax: '+90 216 364 38 12',
    hasEcoVadis: true
  }
};

const TEMPLATES = [
  { id: 'enterprise', name: 'Enterprise', desc: 'Klasik dikey bölünmüş tasarım', icon: Layout },
  { id: 'minimal', name: 'Minimal', desc: 'Yalın ve modern yatay çizgi', icon: Search },
  { id: 'executive', name: 'Executive', desc: 'Kompakt kart tasarımı', icon: Stars }
];

const slugify = (text) => {
  if (!text) return '';
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
  const location = useLocation();
  const navigate = useNavigate();
  const isPublic = location.pathname === '/imza';
  
  const [selectedCompany, setSelectedCompany] = useState(COMPANIES.RET);
  const [template, setTemplate] = useState('enterprise');
  const [form, setForm] = useState({
    fullName: '', title: '', email: '', phone: '',
    tel: COMPANIES.RET.tel || '', website: COMPANIES.RET.website,
    companyName: COMPANIES.RET.fullName, address: COMPANIES.RET.address,
    fax: COMPANIES.RET.fax
  });

  const [personnel, setPersonnel] = useState([]);
  const [showPicker, setShowPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);
  
  const signatureRef = useRef(null);

  const loadPersonnel = useCallback(async () => {
    try {
      const data = await getPersonnel();
      setPersonnel(Array.isArray(data) ? data : []);
    } catch { console.error('Personel yüklenemedi'); }
  }, []);

  useEffect(() => {
    loadPersonnel();
  }, [loadPersonnel]);

  const update = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const handleCompanyChange = (id) => {
    const comp = COMPANIES[id];
    setSelectedCompany(comp);
    setForm(prev => ({
      ...prev,
      companyName: comp.fullName,
      website: comp.website,
      address: comp.address,
      fax: comp.fax || '',
      tel: comp.tel || '',
      email: prev.fullName ? (slugify(prev.fullName.split(' ')[0]) + '.' + slugify(prev.fullName.split(' ').slice(-1)[0]) + comp.emailSuffix) : prev.email
    }));
  };

  const selectPerson = (p) => {
    const fn = (p.ad || '').trim();
    const ln = (p.soyad || '').trim();
    update('fullName', p.adSoyad);
    update('title', p.gorev || '');
    update('email', p.email || (slugify(fn) + '.' + slugify(ln) + selectedCompany.emailSuffix));
    update('phone', p.gsm || '');
    setShowPicker(false);
  };

  const copyVisual = () => {
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
    } catch { toast.error('Kopyalama başarısız.'); }
  };

  const copyHTML = () => {
    const html = signatureRef.current.innerHTML;
    navigator.clipboard.writeText(html);
    toast.success('HTML kodu kopyalandı!');
  };

  const filteredPersonnel = personnel.filter(p => 
    p.adSoyad?.toLocaleLowerCase('tr').includes(searchQuery.toLocaleLowerCase('tr')) ||
    p.sicilNo?.includes(searchQuery)
  );

  return (
    <div className={`signature-hub ${isPublic ? 'public-mode' : ''}`} style={{ 
      display: 'flex', flexDirection: 'column', gap: 24, 
      ...(isPublic && { padding: '40px 80px', background: 'var(--bg-page)', minHeight: '100vh' })
    }}>
      
      {/* ─── Header ─── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
           <button 
             type="button" 
             className="icon-btn" 
             onClick={() => navigate(isPublic ? '/login' : '/')}
             style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', width: 44, height: 44, borderRadius: 12 }}
           >
             <ArrowLeft size={20} />
           </button>
           <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
                 <div className="icon-box-sm icon-amber">
                   <PenTool size={18} />
                 </div>
                 <h2 style={{ fontSize: 24, fontWeight: 900, color: 'var(--text-1)', letterSpacing: '-0.5px' }}>İmza Tasarım Merkezi</h2>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-2)', fontWeight: 500 }}>Kurumsal kimliğinize uygun, profesyonel e-posta imzası oluşturun.</p>
           </div>
        </div>
        
        {isPublic ? (
           <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ textAlign: 'right' }}>
                 <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-3)' }}>ŞİRKET</div>
                 <div style={{ fontSize: 13, fontWeight: 900, color: 'var(--amber-text)' }}>REPKON HOLDİNG</div>
              </div>
           </div>
        ) : (
          <button className="btn btn-secondary" onClick={() => setShowPicker(true)}>
             <Users size={16} /> Personel Rehberinden Seç
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '420px 1fr', gap: 24, alignItems: 'start' }}>
        
        {/* ─── Sidebar Panel ─── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {/* Company & Template Selection */}
          <div className="card" style={{ padding: 20, borderRadius: 24 }}>
             <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 900, color: 'var(--text-3)', marginBottom: 12, letterSpacing: 1 }}>ŞİRKET SEÇİMİ</div>
                <div className="tab-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)' }}>
                   {Object.keys(COMPANIES).map(id => (
                     <button 
                       key={id} 
                       className={`tab-item ${selectedCompany.id === id ? 'active' : ''}`}
                       onClick={() => handleCompanyChange(id)}
                       style={{ justifyContent: 'center' }}
                     >
                       {id}
                     </button>
                   ))}
                </div>
             </div>

             <div>
                <div style={{ fontSize: 11, fontWeight: 900, color: 'var(--text-3)', marginBottom: 12, letterSpacing: 1 }}>TASARIM ŞABLONU</div>
                <div className="segmented-control" style={{ width: '100%' }}>
                   {TEMPLATES.map(t => (
                     <button 
                       key={t.id} 
                       className={template === t.id ? 'active' : ''}
                       onClick={() => setTemplate(t.id)}
                       style={{ flex: 1 }}
                     >
                       {t.name}
                     </button>
                   ))}
                </div>
             </div>
          </div>

          {/* Details Form */}
          <div className="card" style={{ padding: 24, borderRadius: 28 }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
                <div className="icon-box-sm icon-slate">
                   <User size={16} />
                </div>
                <span style={{ fontWeight: 800, fontSize: 15 }}>Kişisel Bilgiler</span>
             </div>

             <div style={{ display: 'grid', gap: 16 }}>
                <div className="form-group">
                   <label className="form-label">Ad Soyad</label>
                   <div className="input-wrapper">
                      <div className="input-icon"><User size={14} /></div>
                      <input className="form-input" value={form.fullName} onChange={e => update('fullName', e.target.value)} placeholder="Örn: Hakan Arslan" />
                   </div>
                </div>

                <div className="form-group">
                   <label className="form-label">Unvan (TR/EN)</label>
                   <div className="input-wrapper">
                      <div className="input-icon"><Briefcase size={14} /></div>
                      <input className="form-input" value={form.title} onChange={e => update('title', e.target.value)} placeholder="Örn: BT Müdürü / IT Manager" />
                   </div>
                </div>

                <div className="form-group">
                   <label className="form-label">E-posta</label>
                   <div className="input-wrapper">
                      <div className="input-icon"><Mail size={14} /></div>
                      <input className="form-input" value={form.email} onChange={e => update('email', e.target.value)} placeholder="hakan.arslan@repkon.com.tr" />
                   </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                   <div className="form-group">
                      <label className="form-label">GSM</label>
                      <input className="form-input" value={form.phone} onChange={e => update('phone', e.target.value)} placeholder="+90 5XX..." />
                   </div>
                   <div className="form-group">
                      <label className="form-label">Sabit Tel</label>
                      <input className="form-input" value={form.tel} onChange={e => update('tel', e.target.value)} />
                   </div>
                </div>

                <div className="form-group">
                   <label className="form-label">Ofis Adresi</label>
                   <div className="input-wrapper">
                      <div className="input-icon"><MapPin size={14} /></div>
                      <input className="form-input" value={form.address} onChange={e => update('address', e.target.value)} />
                   </div>
                </div>
             </div>
          </div>
        </div>

        {/* ─── Canvas Preview ─── */}
        <div style={{ position: 'sticky', top: isPublic ? 40 : 100 }}>
           <div className="card" style={{ padding: 0, borderRadius: 32, overflow: 'hidden', border: '1px solid var(--border-focus)' }}>
              <div style={{ padding: '24px 32px', background: 'var(--amber-soft)', borderBottom: '1px solid var(--amber-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Eye size={20} color="var(--amber)" />
                    <span style={{ fontWeight: 900, color: 'var(--amber-text)', fontSize: 14 }}>CANLI TASLAK ÖNİZLEME</span>
                 </div>
                 <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-primary" onClick={copyVisual}>
                       {copied ? <Check size={16} /> : <Copy size={16} />}
                       GÖRSEL KOPYALA
                    </button>
                    <button className="btn btn-secondary" onClick={copyHTML}>
                       <Code size={16} /> HTML KODU
                    </button>
                 </div>
              </div>

              <div style={{ padding: 60, background: '#fff', minHeight: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                 <div ref={signatureRef} style={{ background: '#fff' }}>
                    <SignatureCanvas template={template} company={selectedCompany} form={form} />
                 </div>
              </div>

              <div style={{ padding: '20px 32px', background: 'var(--bg-inset)', display: 'flex', alignItems: 'center', gap: 12 }}>
                 <Info size={16} color="var(--text-3)" />
                 <span style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 600 }}>
                    Kopyaladıktan sonra Outlook ayarlarından imza alanına yapıştırmanız yeterlidir.
                 </span>
              </div>
           </div>
           
           {isPublic && (
              <div className="card" style={{ marginTop: 24, padding: 24, borderRadius: 24, background: 'rgba(255, 255, 255, 0.7)', backdropFilter: 'blur(20px)', color: '#0f172a', border: '1px solid rgba(15, 23, 42, 0.05)', boxShadow: '0 10px 30px rgba(15, 23, 42, 0.03)' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div className="icon-box-aura" style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                       <Check size={20} />
                    </div>
                    <div>
                        <div style={{ fontWeight: 800, fontSize: 14 }}>Kurumsal Standart Doğrulandı</div>
                        <div style={{ fontSize: 12, color: 'rgba(15, 23, 42, 0.5)', marginTop: 2, fontWeight: 500 }}>Bu imza REPKON Holding bilişim politikalarına %100 uyumludur.</div>
                    </div>
                 </div>
              </div>
           )}
        </div>
      </div>

      {/* Personnel Picker Modal */}
      {showPicker && (
        <div className="modal-overlay" onClick={() => setShowPicker(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 640 }}>
            <div className="modal-header">
              <h2><Users size={20} /> Personel Arama</h2>
              <button className="icon-btn" onClick={() => setShowPicker(false)}><X size={18} /></button>
            </div>
            
            <div className="search-bar" style={{ marginBottom: 16 }}>
               <Search size={18} />
               <input 
                 className="form-input" 
                 style={{ border: 'none', boxShadow: 'none' }}
                 placeholder="İsim, Departman veya Sicil No ile ara..." 
                 value={searchQuery} 
                 onChange={e => setSearchQuery(e.target.value)}
                 autoFocus
               />
            </div>

            <div style={{ maxHeight: 450, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
               {filteredPersonnel.map(p => (
                 <div 
                   key={p.id} 
                   className="list-item" 
                   onClick={() => selectPerson(p)}
                   style={{ 
                     padding: '12px 16px', borderRadius: 12, cursor: 'pointer',
                     display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                     transition: 'all 0.15s', border: '1px solid transparent'
                   }}
                   onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-inset)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
                   onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; }}
                 >
                   <div>
                      <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--text-1)' }}>{p.adSoyad}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 600 }}>{p.gorev} — {p.bolum}</div>
                   </div>
                   <div style={{ textAlign: 'right' }}>
                      <span className="badge badge-amber" style={{ fontSize: 10 }}>{p.firma}</span>
                      <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>{p.sicilNo}</div>
                   </div>
                 </div>
               ))}
               {filteredPersonnel.length === 0 && (
                 <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)' }}>Eşleşen personel bulunamadı.</div>
               )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SignatureCanvas({ template, company, form }) {
  const primaryColor = company.color;
  const logoUrl = company.logo; // In real app, make sure these are absolute or correctly handled
  
  if (template === 'minimal') {
    return (
      <table cellPadding="0" cellSpacing="0" border="0" style={{ fontFamily: 'Segoe UI, Arial, sans-serif', width: 450 }}>
         <tr>
            <td style={{ paddingBottom: 15 }}>
               <img src={logoUrl} alt={company.name} width="140" style={{ display: 'block' }} />
            </td>
         </tr>
         <tr>
            <td style={{ height: 2, background: primaryColor, width: '100%' }}></td>
         </tr>
         <tr>
            <td style={{ paddingTop: 15 }}>
               <div style={{ fontSize: 16, fontWeight: 'bold', color: '#000' }}>{form.fullName || 'Personel Adı'}</div>
               <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{form.title || 'Kurumsal Unvan'}</div>
               
               <table cellPadding="0" cellSpacing="0" border="0" style={{ marginTop: 15, fontSize: 12, color: '#334155' }}>
                  <tr>
                     <td style={{ paddingRight: 20 }}>
                        <div style={{ fontWeight: 'bold', color: primaryColor, fontSize: 10, letterSpacing: 1 }}>EMAIL</div>
                        <a href={`mailto:${form.email}`} style={{ color: '#334155', textDecoration: 'none' }}>{form.email}</a>
                     </td>
                     <td>
                        <div style={{ fontWeight: 'bold', color: primaryColor, fontSize: 10, letterSpacing: 1 }}>MOBILE</div>
                        <div>{form.phone}</div>
                     </td>
                  </tr>
               </table>
            </td>
         </tr>
         <DisclaimerRow />
      </table>
    );
  }

  if (template === 'executive') {
    return (
      <table cellPadding="0" cellSpacing="0" border="0" style={{ fontFamily: 'Segoe UI, Arial, sans-serif', border: `1px solid #e2e8f0`, borderRadius: 12, padding: 25, width: 400 }}>
         <tr>
            <td>
               <div style={{ fontSize: 20, fontWeight: 900, color: '#0f172a' }}>{form.fullName || 'Personel Adı'}</div>
               <div style={{ fontSize: 12, color: primaryColor, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginTop: 4 }}>{form.title}</div>
               
               <div style={{ marginTop: 25, height: 1.5, background: '#f1f5f9' }}></div>
               <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ fontSize: 12, color: '#475569' }}>
                     <span style={{ fontWeight: 800, color: '#0f172a' }}>E:</span> {form.email}
                  </div>
                  <div style={{ fontSize: 12, color: '#475569' }}>
                     <span style={{ fontWeight: 800, color: '#0f172a' }}>W:</span> {form.website}
                  </div>
                  <div style={{ fontSize: 12, color: '#475569' }}>
                     <span style={{ fontWeight: 800, color: '#0f172a' }}>A:</span> {form.address}
                  </div>
               </div>
               
               <div style={{ marginTop: 30, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <img src={logoUrl} alt="Logo" width="100" />
                  <SocialIcons color={primaryColor} />
               </div>
            </td>
         </tr>
         <DisclaimerRow />
      </table>
    );
  }

  // DEFAULT: ENTERPRISE (SPLIT)
  return (
    <table cellPadding="0" cellSpacing="0" border="0" style={{ fontFamily: 'Segoe UI, Arial, sans-serif', width: 480 }}>
      <tr>
        {/* Left Side: Branding */}
        <td style={{ width: 160, textAlign: 'center', verticalAlign: 'top', paddingRight: 20, borderRight: `2px solid ${primaryColor}` }}>
           <img src={logoUrl} alt={company.name} width="140" style={{ display: 'block', margin: '0 auto' }} />
           <div style={{ marginTop: 15 }}>
              <a href={`https://${form.website}`} target="_blank" rel="noopener noreferrer" style={{ color: primaryColor, fontWeight: 800, textDecoration: 'none', fontSize: 11 }}>{form.website}</a>
           </div>
           
           {company.hasEcoVadis && (
             <div style={{ marginTop: 20 }}>
                <img src="/ecovadis.png" alt="EcoVadis" width="80" />
             </div>
           )}
           
           <div style={{ marginTop: 20 }}>
              <SocialIcons color={primaryColor} />
           </div>
        </td>
        
        {/* Right Side: Details */}
        <td style={{ paddingLeft: 24, verticalAlign: 'top' }}>
           <div style={{ fontSize: 18, fontWeight: 900, color: '#000', marginBottom: 2 }}>{form.fullName || 'Ad Soyad'}</div>
           <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, fontStyle: 'italic', marginBottom: 16 }}>{form.title}</div>
           
           <div style={{ fontSize: 12, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>{form.companyName}</div>
           
           <table cellPadding="0" cellSpacing="0" border="0" style={{ fontSize: 11, color: '#334155', lineHeight: '1.6' }}>
              <tr>
                 <td style={{ fontWeight: 800, width: 50 }}>Adres:</td>
                 <td>{form.address}</td>
              </tr>
              {form.tel && (
                 <tr>
                    <td style={{ fontWeight: 800 }}>Tel:</td>
                    <td>{form.tel}</td>
                 </tr>
              )}
              {form.phone && (
                 <tr>
                    <td style={{ fontWeight: 800 }}>GSM:</td>
                    <td>{form.phone}</td>
                 </tr>
              )}
              {form.email && (
                 <tr>
                    <td style={{ fontWeight: 800 }}>E-posta:</td>
                    <td><a href={`mailto:${form.email}`} style={{ color: primaryColor, textDecoration: 'none', fontWeight: 700 }}>{form.email}</a></td>
                 </tr>
              )}
           </table>
        </td>
      </tr>
      <DisclaimerRow />
    </table>
  );
}

function DisclaimerRow() {
  return (
    <tr>
      <td colSpan="2" style={{ paddingTop: 30, borderTop: '1px solid #f1f5f9', marginTop: 20 }}>
         <div style={{ fontSize: 9, color: '#94a3b8', textAlign: 'justify', lineHeight: '1.4' }}>
            <strong>GİZLİLİK NOTU:</strong> Bu e-posta iletisi (varsa ekleri ile birlikte) münhasıran gönderildiği kişi veya kuruluşa özeldir ve gizli bilgiler içerebilir. Eğer bu ileti size yanlışlıkla ulaşmışsa, içeriğini açıklamanız, kopyalamanız veya dağıtmanız yasaktır. 
            <br />
            <span style={{ color: '#10b981', fontWeight: 700 }}>Gereksiz çıktı almayarak doğayı koruduğunuz için teşekkür ederiz.</span>
         </div>
      </td>
    </tr>
  );
}

function SocialIcons({ _color }) {
  // Static URLs for production icons (using common CDN paths)
  return (
    <div style={{ display: 'flex', gap: 10 }}>
       <a href="#"><img src="https://cdn-icons-png.flaticon.com/32/174/174857.png" width="16" alt="LI" /></a>
       <a href="#"><img src="https://cdn-icons-png.flaticon.com/32/1384/1384060.png" width="16" alt="YT" /></a>
       <a href="#"><img src="https://cdn-icons-png.flaticon.com/32/5969/5969020.png" width="16" alt="X" /></a>
       <a href="#"><img src="https://cdn-icons-png.flaticon.com/32/2111/2111463.png" width="16" alt="IG" /></a>
    </div>
  );
}
