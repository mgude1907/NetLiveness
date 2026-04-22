import React, { useState, useEffect, useCallback } from 'react';
import { getPersonnel, resolveImageUrl } from '../api';
import { 
  CreditCard, ArrowRight, UserCheck, UserX, Search, Users, 
  Mail, Copy, Check, Info, Briefcase, Building2, Repeat, 
  Hash, ShieldCheck, X, ChevronRight, UserCircle, Stars,
  Printer, Image as ImageIcon, Calendar, Shield, BadgeCheck,
  RotateCcw, Save, Eraser
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function CardConverter() {
  const [personnels, setPersonnels] = useState([]);
  const [showPicker, setShowPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [meyer, setMeyer] = useState('');
  const [yazici, setYazici] = useState('');
  const [unilever, setUnilever] = useState('');
  const [macgal, setMacgal] = useState('');
  
  const [personnelMatch, setPersonnelMatch] = useState(null);
  const [isConverting, setIsConverting] = useState(false);
  const [copiedField, setCopiedField] = useState(null);
  
  // Card Printing State
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printData, setPrintData] = useState({ adSoyad: '', gorev: '', sicilNo: '', kartNo: '', photoUrl: '', kgbNo: '', privacyLevel: 'MİLLİ GİZLİ', kgbExpiryDate: '', approvedBy: 'NERGİS ÇELİK', approverTitle: 'GÜVENLİK KOORDİNATÖRÜ' });
  const [printFront, setPrintFront] = useState(true);
  const [printBack, setPrintBack] = useState(true);
  const [activeSide, setActiveSide] = useState('front');
  const navigate = useNavigate();

  const loadPersonnel = useCallback(async () => {
    try {
      const data = await getPersonnel();
      setPersonnels(Array.isArray(data) ? data : []);
    } catch { toast.error('Personel rehberi yüklenemedi.'); }
  }, []);

  // Fetch personnel to match card numbers
  useEffect(() => {
    loadPersonnel();
  }, [loadPersonnel]);

  const checkPersonnel = useCallback((inputVal) => {
    if (!inputVal) {
      setPersonnelMatch(null);
      return;
    }
    // Deep match: handle potential leading zeros and type differences
    const cleanInput = String(inputVal).replace(/^0+/, '');
    const match = personnels.find(p => {
       if (!p.kartNo) return false;
       const cleanKart = String(p.kartNo).replace(/^0+/, '');
       return cleanKart === cleanInput;
    });
    setPersonnelMatch(match || false);
  }, [personnels]);

  // Unified Conversion Logic
  const convertFromMeyer = (val) => {
    const num = parseInt(val, 10);
    if (!isNaN(num) && num >= 0) {
      const m = num >>> 0;
      setMeyer(val);
      setMacgal(m.toString(10));
      setYazici(m.toString(16).toUpperCase().padStart(8, '0'));
      const uni = ((m >>> 24) | ((m >>> 8) & 0x0000FF00) | ((m << 8) & 0x00FF0000) | ((m << 24) >>> 0)) >>> 0;
      setUnilever(uni.toString(10));
      checkPersonnel(m);
    } else {
      clearAll();
      setMeyer(val);
    }
  };

  const handleMeyer = (val) => {
    if (isConverting) return;
    setIsConverting(true);
    convertFromMeyer(val);
    setTimeout(() => setIsConverting(false), 20);
  };

  const handleYazici = (val) => {
    if (isConverting) return;
    setYazici(val);
    const num = parseInt(val, 16);
    if (!isNaN(num) && num >= 0 && val.trim() !== '') {
      setIsConverting(true);
      const y = num >>> 0;
      setMeyer(y.toString(10));
      setMacgal(y.toString(10));
      const uni = ((y >>> 24) | ((y >>> 8) & 0x0000FF00) | ((y << 8) & 0x00FF0000) | ((y << 24) >>> 0)) >>> 0;
      setUnilever(uni.toString(10));
      checkPersonnel(y);
      setTimeout(() => setIsConverting(false), 20);
    } else { clearAll(); setYazici(val); }
  };

  const handleUnilever = (val) => {
    if (isConverting) return;
    setUnilever(val);
    const num = parseInt(val, 10);
    if (!isNaN(num) && num >= 0) {
      setIsConverting(true);
      const u = num >>> 0;
      const y = ((u >>> 24) | ((u >>> 8) & 0x0000FF00) | ((u << 8) & 0x00FF0000) | ((u << 24) >>> 0)) >>> 0;
      setMeyer(y.toString(10));
      setMacgal(y.toString(10));
      setYazici(y.toString(16).toUpperCase().padStart(8, '0'));
      checkPersonnel(y);
      setTimeout(() => setIsConverting(false), 20);
    } else { clearAll(); setUnilever(val); }
  };

  const clearAll = () => {
    setMeyer(''); setYazici(''); setUnilever(''); setMacgal('');
    setPersonnelMatch(null);
  };

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success('Kopyalandı!');
    setTimeout(() => setCopiedField(null), 2000);
  };

  const sendUnileverEmail = () => {
    if (!unilever) {
      toast.error('Önce bir kart numarası seçmelisiniz.');
      return;
    }
    const recipients = "umraniye.cctv@unilever.com, Kemal.Sen@unilever.com";
    const subject = encodeURIComponent("Personel Kart Kaydı Talebi");
    const personName = personnelMatch ? personnelMatch.adSoyad : "[Personel Adı]";
    const body = encodeURIComponent(
      `Sayın yetkili,\n\n${unilever} numaralı (${personName}) kişinin sisteminize eklenmesi konusunda destek olabilirmisiniz?\n\nİyi çalışmalar.`
    );
    window.location.href = `mailto:${recipients}?subject=${subject}&body=${body}`;
  };

  const selectPerson = (p) => {
    if (p.kartNo) {
      setMeyer(p.kartNo);
      convertFromMeyer(p.kartNo);
      setPersonnelMatch(p); // Explicitly set match to avoid lookup failures
      toast.success(`${p.adSoyad} bilgileri yüklendi.`);
    } else {
      setPersonnelMatch(p); // Set match anyway so button shows up
      toast.error('Dikkat: Personel kart no tanımlı değil.');
    }
    setShowPicker(false);
  };

  const filteredPersonnel = personnels.filter(p => 
    p.adSoyad?.toLocaleLowerCase('tr').includes(searchQuery.toLocaleLowerCase('tr')) ||
    p.sicilNo?.includes(searchQuery)
  );

  const openPrintModal = (p) => {
    setPrintData({
      adSoyad: p.adSoyad || `${p.ad} ${p.soyad}`,
      gorev: p.gorev || '',
      sicilNo: p.sicilNo || '',
      kartNo: p.kartNo || '',
      photoUrl: p.photoUrl || '',
      kgbNo: p.kgbNo || '',
      privacyLevel: p.privacyLevel || 'MİLLİ GİZLİ',
      kgbExpiryDate: p.kgbExpiryDate ? new Date(p.kgbExpiryDate).toLocaleDateString('tr-TR') : '',
      approvedBy: p.approvedBy || 'NERGİS ÇELİK',
      approverTitle: p.approverTitle || 'GÜVENLİK KOORDİNATÖRÜ'
    });
    setShowPrintModal(true);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
           <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
              <div className="icon-box-sm icon-green">
                <CreditCard size={18} />
              </div>
              <h2 style={{ fontSize: 24, fontWeight: 900, color: 'var(--text-1)', letterSpacing: '-0.5px' }}>Kart Dönüştürücü & Sorgulama</h2>
           </div>
           <p style={{ fontSize: 13, color: 'var(--text-2)', fontWeight: 500 }}>Sistemler arası otomatik byte sıralama (Endian Swap) ve veri eşleştirme merkezi.</p>
        </div>
        
        <button className="btn btn-primary" onClick={() => setShowPicker(true)}>
           <Search size={16} /> Personel Ara / Kart Bul
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '440px 1fr', gap: 24, alignItems: 'start' }}>
        
        {/* ─── Input Sidebar ─── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          <div className="card" style={{ padding: 24, borderRadius: 28 }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                <div className="icon-box-sm icon-slate">
                   <Repeat size={16} />
                </div>
                <span style={{ fontWeight: 800, fontSize: 15 }}>Değer Girişi</span>
             </div>

             <div style={{ display: 'grid', gap: 18 }}>
                <ConversionInput 
                  label="Meyer (Decimal / Standart)" 
                  value={meyer} 
                  onChange={handleMeyer} 
                  onCopy={() => copyToClipboard(meyer, 'meyer')}
                  isCopied={copiedField === 'meyer'}
                />

                <ConversionInput 
                  label="Yazıcı (Hexadecimal)" 
                  value={yazici} 
                  onChange={handleYazici} 
                  onCopy={() => copyToClipboard(yazici, 'yazici')}
                  isCopied={copiedField === 'yazici'}
                  placeholder="0000XXXX"
                />

                <div className="form-group" style={{ position: 'relative' }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <label className="form-label" style={{ marginBottom: 0 }}>Unilever (Endian Swapped)</label>
                      <button 
                        onClick={sendUnileverEmail}
                        className="btn btn-icon" 
                        style={{ width: 28, height: 28, background: 'var(--blue-soft)', borderColor: 'var(--blue-border)', color: 'var(--blue-text)' }}
                        title="Unilever'e Mail At"
                      >
                         <Mail size={14} />
                      </button>
                   </div>
                   <div style={{ position: 'relative' }}>
                      <input 
                        className="form-input" 
                        style={{ paddingRight: 45, fontWeight: 'bold', letterSpacing: 1 }}
                        value={unilever} 
                        onChange={e => handleUnilever(e.target.value)} 
                        placeholder="Endian Swap Değeri"
                      />
                      <button 
                        onClick={() => copyToClipboard(unilever, 'uni')} 
                        style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-3)' }}
                      >
                         {copiedField === 'uni' ? <Check size={14} color="var(--green)" /> : <Copy size={14} />}
                      </button>
                   </div>
                </div>

                <ConversionInput 
                  label="Macgal (Decimal)" 
                  value={macgal} 
                  onChange={handleMeyer} 
                  onCopy={() => copyToClipboard(macgal, 'macgal')}
                  isCopied={copiedField === 'macgal'}
                />
             </div>

             <div style={{ marginTop: 24, padding: 16, background: 'var(--bg-inset)', borderRadius: 16, border: '1px dashed var(--border)' }}>
                <div style={{ display: 'flex', gap: 10 }}>
                   <Info size={16} color="var(--text-3)" style={{ marginTop: 2 }} />
                   <p style={{ color: 'var(--text-3)', fontWeight: 600, fontSize: '13px', lineHeight: 1.5 }}>Lütfen sorun yaşadığınız cihazı &quot;Cihaz Seçimi&quot; alanından belirtiniz. Destek talebiniz BT ekibimize anında ulaşacaktır.</p>
                   <p style={{ fontSize: 11, color: 'var(--text-3)', lineHeight: 1.5 }}>
                      Herhangi bir alana değer girmeniz yeterlidir. Diğer alanlar <strong>32-bit Matematiksel Dönüşüm</strong> formülleriyle anlık hesaplanır.
                   </p>
                </div>
             </div>
          </div>

          <div className="card" style={{ background: 'linear-gradient(135deg, #1e293b, #0f172a)', color: '#fff', border: 'none', padding: 24, borderRadius: 24 }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyCenter: 'center' }}>
                   <ShieldCheck size={20} color="var(--amber)" />
                </div>
                <span style={{ fontWeight: 800 }}>Teknik Algoritma</span>
             </div>
             <p style={{ fontSize: 12, opacity: 0.7, lineHeight: 1.6 }}>
                Sistem; 32-bit tam sayı değerini byte dizisine ayırır, sırasını tersine çevirir (Endianness) ve yeni tamsayıyı oluşturur. Hexadecimal dönüşümler IEEE bit gösterimine uygundur.
             </p>
          </div>
        </div>

        {/* ─── Result & Status Section ─── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
           
           <div className="card" style={{ padding: 32, borderRadius: 32, border: personnelMatch ? '1.5px solid var(--green-border)' : '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                 <div style={{ 
                    width: 80, height: 80, borderRadius: 24, 
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: personnelMatch === null ? 'var(--bg-inset)' : (personnelMatch ? 'var(--green-soft)' : 'var(--red-soft)'),
                    color: personnelMatch === null ? 'var(--text-3)' : (personnelMatch ? 'var(--green)' : 'var(--red)'),
                    transition: 'all 0.3s'
                 }}>
                    {personnelMatch === null ? <UserCircle size={40} /> : (personnelMatch ? <UserCheck size={40} /> : <UserX size={40} />)}
                 </div>

                 <div style={{ flex: 1 }}>
                    {personnelMatch === null ? (
                      <div>
                        <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--text-1)' }}>Personel Bekleniyor</div>
                        <p style={{ maxWidth: 400, textAlign: 'center', color: 'var(--text-3)', fontWeight: 600 }}>Meyer numarasını veya kart üzerindeki 10 haneli (veya 8 haneli HEX) kodu girin. &apos;İşle&apos; butonuna bastığınızda dönüşüm otomatik olarak yapılır.</p>
                      </div>
                    ) : personnelMatch === false ? (
                      <div>
                        <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--red-text)' }}>Personel Bulunamadı</div>
                        <p style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 4 }}>Bu kart numarası ({meyer}) herhangi bir personele atanmamış.</p>
                      </div>
                    ) : (
                      <div className="animate-in">
                         <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                            <div className="badge badge-green">AKTİF KAYIT</div>
                            <span style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 700 }}>Sicil: {personnelMatch.sicilNo}</span>
                         </div>
                         <div style={{ fontSize: 24, fontWeight: 950, color: 'var(--text-1)', letterSpacing: '-0.5px' }}>{personnelMatch.adSoyad}</div>
                         <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 8 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-2)', fontWeight: 600 }}>
                               <Building2 size={16} color="var(--text-3)" /> {personnelMatch.firma}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-2)', fontWeight: 600 }}>
                               <Hash size={16} color="var(--text-3)" /> Bölüm: {personnelMatch.bolum}
                            </div>
                         </div>
                      </div>
                    )}
                 </div>

                  {personnelMatch && (
                    <div style={{ display: 'flex', gap: 12 }}>
                      <button 
                        onClick={() => openPrintModal(personnelMatch)}
                        className="btn btn-primary" 
                        style={{ borderRadius: 16, padding: '12px 24px', background: 'linear-gradient(135deg, #1e293b, #0f172a)', border: 'none' }}
                      >
                        <Printer size={18} /> KART BAS
                      </button>
                      <button 
                        onClick={() => { navigate(`/cv/${personnelMatch.id}`); }}
                        className="btn btn-ghost" 
                        style={{ borderRadius: 16, padding: '12px 20px' }}
                      >
                        Detaylı Gör <ChevronRight size={16} />
                      </button>
                    </div>
                  )}
               </div>
           </div>

           {/* Visualization of Endian Swap */}
           <div className="card" style={{ padding: 24, borderRadius: 28, background: 'var(--bg-surface)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                 <div className="icon-box-sm icon-amber">
                    <Stars size={16} />
                 </div>
                 <span style={{ fontWeight: 800, fontSize: 15 }}>Unilever Endian Sıralaması</span>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px 0', gap: 10 }}>
                 <ByteBox byte={(yazici?.slice(0, 2) || '00')} label="B1" color="#f59e0b" />
                 <ByteBox byte={(yazici?.slice(2, 4) || '00')} label="B2" color="#475569" />
                 <ByteBox byte={(yazici?.slice(4, 6) || '00')} label="B3" color="#475569" />
                 <ByteBox byte={(yazici?.slice(6, 8) || '00')} label="B4" color="#22c55e" />
                 <div style={{ padding: '0 10px', color: 'var(--text-3)' }}><ArrowRight /></div>
                 <ByteBox byte={(yazici?.slice(6, 8) || '00')} label="B4" color="#22c55e" />
                 <ByteBox byte={(yazici?.slice(4, 6) || '00')} label="B3" color="#475569" />
                 <ByteBox byte={(yazici?.slice(2, 4) || '00')} label="B2" color="#475569" />
                 <ByteBox byte={(yazici?.slice(0, 2) || '00')} label="B1" color="#f59e0b" />
              </div>
              <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-3)', marginTop: 10 }}>
                 Byte dizilimi CPU mimarisine göre <strong>Little-Endian</strong>&apos;dan <strong>Big-Endian</strong>&apos;a dönüştürülür.
              </p>
           </div>
        </div>
      </div>

      {/* Personnel Picker Modal */}
      {showPicker && (
        <div className="modal-overlay" onClick={() => setShowPicker(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 640 }}>
            <div className="modal-header">
              <h2><Users size={20} /> Personel Seçimi</h2>
              <button className="icon-btn" onClick={() => setShowPicker(false)}><X size={18} /></button>
            </div>
            
            <div className="search-bar" style={{ marginBottom: 16 }}>
               <Search size={18} />
               <input 
                 className="form-input" 
                 style={{ border: 'none', boxShadow: 'none' }}
                 placeholder="İsim, Bölüm veya Sicil No ile ara..." 
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
                      <div style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 600 }}>{p.bolum} — Kart: {p.kartNo || 'Tanımsız'}</div>
                   </div>
                   <span className="badge badge-neutral" style={{ fontSize: 10 }}>{p.firma}</span>
                 </div>
               ))}
            </div>
          </div>
        </div>
      )}

      {/* Card Print Preview Modal */}
      {showPrintModal && printData && (
        <div className="modal-overlay" onClick={() => setShowPrintModal(false)} style={{ zIndex: 9999 }}>
          <div className="modal-content print-modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 1000, display: 'flex', gap: 24, padding: 32 }}>
            
            {/* Left Side: Editor */}
            <div className="no-print" style={{ flex: '0 0 350px', borderRight: '1px solid var(--border)', paddingRight: 24 }}>
              <div style={{ marginBottom: 24 }}>
                <h2 style={{ fontSize: 18, fontWeight: 900, marginBottom: 4 }}>Kart Editörü</h2>
                <p style={{ fontSize: 12, color: 'var(--text-3)' }}>Baskı öncesi detayları düzenleyebilirsiniz.</p>
              </div>

              <div style={{ padding: 16, background: 'var(--bg-inset)', borderRadius: 16, border: '1px solid var(--border)', marginBottom: 20 }}>
                <h4 style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-1)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Printer size={16} /> Yazdırma Seçenekleri
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13 }}>
                    <input type="checkbox" checked={printFront} onChange={(e) => setPrintFront(e.target.checked)} style={{ width: 16, height: 16 }} />
                    <span>Ön Tarafı Yazdır / Front Side</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13 }}>
                    <input type="checkbox" checked={printBack} onChange={(e) => setPrintBack(e.target.checked)} style={{ width: 16, height: 16 }} />
                    <span>Arka Tarafı Yazdır / Back Side</span>
                  </label>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">Ad Soyad</label>
                  <input className="form-input" value={printData.adSoyad} onChange={e => setPrintData({...printData, adSoyad: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Görevi</label>
                  <input className="form-input" value={printData.gorev} onChange={e => setPrintData({...printData, gorev: e.target.value})} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">KGB No</label>
                    <input className="form-input" value={printData.kgbNo} onChange={e => setPrintData({...printData, kgbNo: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Kart No</label>
                    <input className="form-input" value={printData.kartNo} onChange={e => setPrintData({...printData, kartNo: e.target.value})} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Geçerlilik Tarihi</label>
                  <input className="form-input" value={printData.kgbExpiryDate} onChange={e => setPrintData({...printData, kgbExpiryDate: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Onaylayan</label>
                  <input className="form-input" value={printData.approvedBy} onChange={e => setPrintData({...printData, approvedBy: e.target.value})} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 24, marginBottom: 24 }}>
                <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowPrintModal(false)}>İPTAL</button>
                <button 
                  className="btn btn-amber" 
                  style={{ flex: 1 }}
                  onClick={async () => {
                    try {
                      const { updatePersonnel } = await import('../api');
                      await updatePersonnel(personnelMatch.id, {
                        ...personnelMatch,
                        adSoyad: printData.adSoyad,
                        gorev: printData.gorev,
                        kgbNo: printData.kgbNo,
                        kartNo: printData.kartNo,
                        approvedBy: printData.approvedBy
                      });
                      toast.success('Değişiklikler kaydedildi.');
                    } catch (error) { 
                      console.error(error);
                      toast.error('Hata oluştu.'); 
                    }
                  }}
                >
                  <Save size={14} /> KAYDET
                </button>
              </div>

              <button className="btn btn-primary" style={{ width: '100%', height: 48 }} onClick={handlePrint}>
                <Printer size={18} /> ŞİMDİ YAZDIR (ZC300)
              </button>
            </div>

            {/* Right Side: Visual Card Preview */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#e2e8f0', borderRadius: 16, padding: 40, height: 'fit-content' }}>
              <div className="card-print-container">
                {activeSide === 'front' ? (
                  <div className="repkon-id-card front print-area">
                    <div className="card-mesh-bg"></div>
                    <div className="card-logo-container">
                      <img src="/repkon_energetics.png" alt="Repkon Energetics" style={{ height: 38, objectFit: 'contain' }} />
                    </div>
                    <div className="diagonal-decoration top-right"></div>
                    <div className="card-body">
                      <div className="photo-section">
                        <div className="photo-frame">
                          {printData.photoUrl ? (
                            <img 
                              src={resolveImageUrl(printData.photoUrl)} 
                              alt="Photo" 
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                              onError={(e) => { e.target.style.display = 'none'; }}
                            />
                          ) : (
                            <div className="photo-placeholder"><UserCircle size={60} color="#cbd5e1" /></div>
                          )}
                        </div>
                        <div className="approver-info">
                          <label>ONAYLAYAN (APPROVED BY)</label>
                          <div className="approver-name">{printData.approvedBy}</div>
                          <div className="approver-title">{printData.approverTitle}</div>
                          <div className="approver-title-en">(SECURITY COORDINATOR)</div>
                        </div>
                      </div>

                      <div className="data-section">
                         <div className="card-no-badge">
                           KART NO / CARD NO: <strong>{printData.kartNo}</strong>
                         </div>

                         <div className="data-field">
                           <label>ADI SOYADI / NAME SURNAME</label>
                           <div className="value large">{printData.adSoyad.toUpperCase()}</div>
                         </div>

                         <div className="data-field">
                           <label>GÖREVİ / POSITION</label>
                           <div className="value">{printData.gorev.toUpperCase()}</div>
                         </div>

                         <div className="data-field">
                           <label>KGB KAYIT NO</label>
                           <div className="value bold">{printData.kgbNo}</div>
                         </div>

                         <div className="data-field">
                           <label>KGB GİZLİLİK DERECESİ</label>
                           <div className="value bold">{printData.privacyLevel}</div>
                         </div>

                         <div className="data-field">
                           <label>KGB GEÇERLİLİK TARİHİ</label>
                           <div className="value bold">{printData.kgbExpiryDate}</div>
                         </div>
                      </div>
                    </div>
                    <div className="diagonal-decoration bottom"></div>
                  </div>
                ) : (
                  <div className="repkon-id-card back print-area">
                    <div style={{ padding: '30px 40px' }}>
                       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                          <div style={{ flex: 1 }}>
                             <h2 style={{ fontSize: 20, fontWeight: 800, color: '#000', margin: 0 }}>Kullanım Talimatı</h2>
                             <div style={{ fontSize: 13, fontWeight: 700, color: '#000' }}>(Instructions for Use)</div>
                          </div>
                          <div className="repkon-logo-minimal no-print">
                             <img src="/repkon_energetics.png" alt="Logo" style={{ height: 30, opacity: 0.8 }} />
                          </div>
                       </div>

                       <div className="instructions-list">
                          <p><strong>1.</strong> İşyerinde bu kart sürekli olarak sağ yakaya veya boyuna asılacaktır.</p>
                          <p><strong>2.</strong> Kartı kaybeden derhal Güvenlik Koordinatörüne bilgi verecektir.</p>
                          <p><strong>3.</strong> Kaybolmuş kartın bulunması halinde lütfen <span style={{ color: 'var(--blue-text)' }}>+90 216 251 50 77</span> No&apos;lu telefona bilgi veriniz.</p>
                          
                          <div style={{ marginTop: 12, borderTop: '1px solid #e2e8f0', paddingTop: 12 }}>
                            <p><strong>1.</strong> While in premises this card must be displayed clearly on your right collar or longitudinal suspended on your neck.</p>
                            <p><strong>2.</strong> Lost cards must be reported to Security Coordinator immediately.</p>
                            <p><strong>3.</strong> In the event of finding lost card please inform us on following phone number <span style={{ color: 'var(--blue-text)' }}>+90 216 251 50 77</span></p>
                          </div>
                       </div>
                    </div>
                    <div className="diagonal-decoration bottom"></div>
                  </div>
                )}
              </div>
            </div>

            {/* HIDDEN PRINT CONTAINER - DYNAMIC DUO/SINGLE PAGE JOBS */}
            <div id="zebra-duplex-print-gate">
               {printFront && (
                 <div className="repkon-id-card front print-page-one">
                    <div className="card-mesh-bg"></div>
                    <div className="card-logo-container">
                        <img src="/repkon_energetics.png" alt="Repkon Energetics" style={{ height: 42, objectFit: 'contain' }} />
                    </div>
                    <div className="diagonal-decoration top-right"></div>
                    <div className="card-body">
                        <div className="photo-section">
                            <div className="photo-frame">
                                {printData.photoUrl ? (
                                    <img src={resolveImageUrl(printData.photoUrl)} alt="Photo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <div className="photo-placeholder"><UserCircle size={60} color="#cbd5e1" /></div>
                                )}
                            </div>
                            <div className="approver-info">
                                <label>ONAYLAYAN (APPROVED BY)</label>
                                <div className="approver-name">{printData.approvedBy}</div>
                                <div className="approver-title">{printData.approverTitle}</div>
                                <div className="approver-title-en">(SECURITY COORDINATOR)</div>
                            </div>
                        </div>
                        <div className="data-section">
                            <div className="card-no-badge">KART NO: <strong>{printData.kartNo}</strong></div>
                            <div className="data-field">
                                <label>ADI SOYADI / NAME SURNAME</label>
                                <div className="value large">{printData.adSoyad.toUpperCase()}</div>
                            </div>
                            <div className="data-field">
                                <label>GÖREVİ / POSITION</label>
                                <div className="value">{printData.gorev.toUpperCase()}</div>
                            </div>
                            <div className="data-field">
                                <label>KGB KAYIT NO</label>
                                <div className="value bold">{printData.kgbNo}</div>
                            </div>
                            <div className="data-field">
                                <label>KGB GİZLİLİK DERECESİ</label>
                                <div className="value bold">{printData.privacyLevel}</div>
                            </div>
                            <div className="data-field">
                                <label>KGB GEÇERLİLİK TARİHİ</label>
                                <div className="value bold">{printData.kgbExpiryDate}</div>
                            </div>
                        </div>
                    </div>
                    <div className="diagonal-decoration bottom"></div>
                 </div>
               )}

               {printBack && (
                 <div className="repkon-id-card back print-page-two">
                    <div style={{ padding: '30px 40px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                            <div style={{ flex: 1 }}>
                                <h2 style={{ fontSize: 20, fontWeight: 800, color: '#000', margin: 0 }}>Kullanım Talimatı</h2>
                                <div style={{ fontSize: 13, fontWeight: 700, color: '#000' }}>(Instructions for Use)</div>
                            </div>
                            <div className="logo-mono" style={{ padding: '8px 16px', background: '#000', color: '#fff', borderRadius: 8, fontWeight: 900, fontSize: 12 }}>REPKON</div>
                        </div>
                        <div className="instructions-list" style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
                            <p>1. Bu kart şahsa özeldir, başkasına devredilemez. (Personal use only.)</p>
                            <p>2. Kayıp durumunda derhal güvenlik birimine haber verilmelidir. (Report loss immediately.)</p>
                            <p>3. Tesisi terk ederken iade edilmesi mecburidir. (Must be returned upon resignation.)</p>
                            <p>4. Kartın fiziksel yapısını bozmak veya üzerine yazı yazmak yasaktır.</p>
                        </div>
                    </div>
                    <div className="diagonal-decoration bottom"></div>
                 </div>
               )}
            </div>

            <style>{`
              @media screen {
                .card-print-container {
                  box-shadow: 0 20px 50px rgba(0,0,0,0.15);
                  border-radius: 12px;
                  overflow: hidden;
                }
              }

              .repkon-id-card {
                width: 85.6mm;
                height: 53.98mm;
                background: white;
                position: relative;
                overflow: hidden;
                font-family: 'Inter', Arial, sans-serif;
                color: #000;
                background-image: 
                  linear-gradient(#f8fafc 1px, transparent 1px),
                  linear-gradient(90deg, #f8fafc 1px, transparent 1px);
                background-size: 20px 20px;
              }

              .card-mesh-bg {
                position: absolute;
                bottom: 0; left: 0; right: 0;
                height: 40%;
                background-image: 
                  linear-gradient(45deg, #f1f5f9 25%, transparent 25%), 
                  linear-gradient(-45deg, #f1f5f9 25%, transparent 25%), 
                  linear-gradient(45deg, transparent 75%, #f1f5f9 75%), 
                  linear-gradient(-45deg, transparent 75%, #f1f5f9 75%);
                background-size: 8px 8px;
                background-color: transparent;
                opacity: 0.15;
                pointer-events: none;
              }

              .diagonal-decoration {
                position: absolute;
                background: #000;
              }

              .diagonal-decoration.top-right {
                top: 0; right: 0;
                width: 60%;
                height: 12mm;
                clip-path: polygon(15% 0, 100% 0, 100% 100%, 0 100%);
                background-image: 
                  linear-gradient(45deg, #111 25%, transparent 25%), 
                  linear-gradient(-45deg, #111 25%, transparent 25%), 
                  linear-gradient(45deg, transparent 75%, #111 75%), 
                  linear-gradient(-45deg, transparent 75%, #111 75%);
                background-size: 4px 4px;
                background-color: #000;
              }

              .diagonal-decoration.bottom {
                bottom: 0; left: 0; right: 0;
                height: 8mm;
                background: #000;
                clip-path: polygon(0 0, 52% 0, 55% 100%, 0 100%);
                background-image: radial-gradient(#222 1px, transparent 0);
                background-size: 4px 4px;
              }

              .card-logo-container {
                padding: 15px 20px;
              }

              .card-body {
                display: flex;
                padding: 0 20px;
                gap: 20px;
                position: relative;
                z-index: 5;
              }

              .photo-section {
                flex: 0 0 28mm;
              }

              .photo-frame {
                width: 28mm;
                height: 35mm;
                border: 1px solid #e2e8f0;
                background: #fff;
                overflow: hidden;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 4px 10px rgba(0,0,0,0.05);
              }

              .photo-frame img {
                width: 100%;
                height: 100%;
                object-fit: cover;
              }

              .approver-info {
                margin-top: 6px;
                text-align: center;
              }

              .approver-info label {
                display: block;
                font-size: 6px;
                font-weight: 800;
                opacity: 0.8;
                margin-bottom: 2px;
              }

              .approver-name {
                font-size: 8px;
                font-weight: 900;
                color: var(--blue-text);
              }

              .approver-title {
                font-size: 6px;
                font-weight: 700;
              }

              .approver-title-en {
                font-size: 5px;
                font-weight: 600;
                opacity: 0.7;
              }

              .data-section {
                flex: 1;
              }

              .card-no-badge {
                text-align: right;
                font-size: 10px;
                margin-bottom: 8px;
              }

              .data-field {
                margin-bottom: 5px;
              }

              .data-field label {
                display: block;
                font-size: 7px;
                font-weight: 800;
                color: #64748b;
                margin-bottom: 1px;
              }

              .value {
                font-size: 11px;
                font-weight: 800;
                color: #000;
              }

              .value.large {
                font-size: 16px;
                letter-spacing: -0.5px;
                line-height: 1;
              }

              .value.bold {
                font-size: 13px;
              }

              .instructions-list p {
                font-size: 9px;
                line-height: 1.3;
                margin-bottom: 4px;
                color: #000;
                font-weight: 600;
              }

              @media print {
                @page {
                  size: 3.375in 2.125in landscape;
                  margin: 0;
                }
                
                html, body {
                  margin: 0 !important;
                  padding: 0 !important;
                  width: 3.375in;
                  height: 2.125in;
                  overflow: visible !important;
                }

                /* Hide EVERYTHING in the body except our specific print ID */
                body > * {
                  display: none !important;
                }

                /* Force the specific print container to be visible and correctly positioned */
                #zebra-duplex-print-gate {
                  display: block !important;
                  visibility: visible !important;
                  position: absolute;
                  top: 0;
                  left: 0;
                  width: 3.375in;
                }

                #zebra-duplex-print-gate * {
                  visibility: visible !important;
                }

                .print-page-one, .print-page-two {
                  display: block !important;
                  position: relative;
                  width: 3.375in !important;
                  height: 2.125in !important;
                  page-break-after: always !important;
                  break-after: page !important;
                  margin: 0 !important;
                  padding: 0 !important;
                  border: none !important;
                  box-shadow: none !important;
                  overflow: hidden !important;
                }

                .print-page-two {
                  page-break-after: avoid !important;
                  break-after: avoid !important;
                }

                * {
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                }
              }

              #zebra-duplex-print-gate {
                display: none;
              }
            `}</style>
          </div>
        </div>
      )}
    </div>
  );
}

function ConversionInput({ label, value, onChange, onCopy, isCopied, placeholder }) {
  return (
    <div className="form-group">
       <label className="form-label">{label}</label>
       <div style={{ position: 'relative' }}>
          <input 
            className="form-input" 
            style={{ paddingRight: 45, fontWeight: 'bold', letterSpacing: 1 }}
            value={value} 
            onChange={e => onChange(e.target.value)} 
            placeholder={placeholder}
          />
          <button 
            onClick={onCopy} 
            style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-3)' }}
          >
             {isCopied ? <Check size={14} color="var(--green)" /> : <Copy size={14} />}
          </button>
       </div>
    </div>
  );
}

function ByteBox({ byte, label, color }) {
  return (
    <div style={{ textAlign: 'center' }}>
       <div style={{ 
          width: 32, height: 32, background: 'var(--bg-page)', 
          border: `2px solid ${color}`, borderRadius: 8,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, fontWeight: 900, color: 'var(--text-1)'
       }}>
          {byte}
       </div>
       <div style={{ fontSize: 9, fontWeight: 800, color: 'var(--text-3)', marginTop: 4 }}>{label}</div>
    </div>
  );
}
