import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  getPersonnelById, resolveImageUrl 
} from '../api';
import { 
  User, Shield, Calendar, Building2, Briefcase, 
  ArrowLeft, Printer, AlertTriangle, ShieldCheck, Mail,
  CreditCard, MapPin, Fingerprint
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function PersonnelCV() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [p, setP] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getPersonnelById(id);
        if (data) {
          setP(data);
        } else {
          toast.error('Personel bulunamadı.');
          navigate('/personnel');
        }
      } catch (e) {
        console.error(e);
        toast.error('Veri yükleme hatası.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, navigate]);

  if (loading) return (
    <div style={{ height: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="spinner"></div>
    </div>
  );

  if (!p) return null;

  return (
    <div className="animate-in" style={{ maxWidth: 1200, margin: '0 auto', paddingBottom: 60, padding: 24 }}>
      {/* Header / Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <button onClick={() => navigate(-1)} className="btn btn-ghost" style={{ gap: 8, borderRadius: 12 }}>
          <ArrowLeft size={18} /> Geri Dön
        </button>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={() => navigate('/cards')} className="btn btn-amber" style={{ gap: 8, borderRadius: 12 }}>
            <Printer size={18} /> Kart Bas
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 350px) 1fr', gap: 32 }}>
        
        {/* Left Column: Profile Card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div className="card" style={{ padding: 0, overflow: 'hidden', borderRadius: 32 }}>
            <div style={{ height: 160, background: 'linear-gradient(135deg, #1e293b, #0f172a)', position: 'relative' }}>
               <div style={{ 
                 position: 'absolute', bottom: -60, left: '50%', transform: 'translateX(-50%)',
                 width: 140, height: 140, borderRadius: 40, border: '6px solid var(--bg-surface)',
                 background: '#f8fafc', overflow: 'hidden', boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
               }}>
                 {p.photoUrl ? (
                   <img src={resolveImageUrl(p.photoUrl)} alt={p.adSoyad} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                 ) : (
                   <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#e2e8f0' }}>
                     <User size={60} color="#94a3b8" />
                   </div>
                 )}
               </div>
            </div>
            
            <div style={{ paddingTop: 80, paddingLeft: 32, paddingRight: 32, paddingBottom: 40, textAlign: 'center' }}>
               <h1 style={{ fontSize: 28, fontWeight: 950, color: 'var(--text-1)', marginBottom: 4, letterSpacing: '-0.5px' }}>{p.adSoyad}</h1>
               <p style={{ color: 'var(--text-3)', fontWeight: 600, fontSize: 15 }}>{p.gorev || 'Görev Tanımlanmamış'}</p>
               
               <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginTop: 24 }}>
                  <div className="badge badge-neutral" style={{ padding: '6px 16px', borderRadius: 10 }}>{p.firma}</div>
                  <div className={`badge ${p.isActive ? 'badge-green' : 'badge-red'}`} style={{ padding: '6px 16px', borderRadius: 10 }}>
                    {p.isActive ? 'AKTİF' : 'AYRILDI'}
                  </div>
               </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border)', padding: 32, display: 'flex', flexDirection: 'column', gap: 20 }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div className="icon-box-sm icon-blue"><Fingerprint size={16} /></div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase' }}>Sicil Numarası</div>
                    <div style={{ fontWeight: 800, color: 'var(--text-1)' }}>{p.sicilNo || '—'}</div>
                  </div>
               </div>
               <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div className="icon-box-sm icon-amber"><CreditCard size={16} /></div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase' }}>Kart Numarası</div>
                    <div style={{ fontWeight: 800, color: 'var(--text-1)' }}>{p.kartNo || 'Tanımlanmamış'}</div>
                  </div>
               </div>
               <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div className="icon-box-sm icon-green"><Building2 size={16} /></div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase' }}>Departman / Bölüm</div>
                    <div style={{ fontWeight: 800, color: 'var(--text-1)' }}>{p.bolum || '—'}</div>
                  </div>
               </div>
            </div>
          </div>

          <div className="card" style={{ padding: 24, borderRadius: 24, background: 'var(--bg-inset)' }}>
            <h3 style={{ fontSize: 14, fontWeight: 900, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Shield size={16} color="var(--amber)" /> GÜVENLİK DURUMU
            </h3>
            <div style={{ padding: 16, background: 'var(--bg-surface)', borderRadius: 16, border: '1px solid var(--border)' }}>
               <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-3)', marginBottom: 8 }}>GİZLİLİK DERECESİ</div>
               <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 12, height: 12, borderRadius: 6, background: 'var(--amber)' }}></div>
                  <span style={{ fontWeight: 900, fontSize: 16, color: 'var(--text-1)' }}>{p.privacyLevel || 'MİLLİ GİZLİ'}</span>
               </div>
            </div>
          </div>
        </div>

        {/* Right Column: Details & Security */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          
          {/* Security Clearance Section */}
          <div className="card" style={{ padding: 40, borderRadius: 32 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
               <div>
                  <h2 style={{ fontSize: 24, fontWeight: 950, color: 'var(--text-1)', marginBottom: 8 }}>Güvenlik Bilgileri & KGB</h2>
                  <p style={{ color: 'var(--text-3)', fontWeight: 600 }}>Personelin kurumsal güvenlik ve erişim yetki detayları.</p>
               </div>
               <div style={{ padding: '12px 24px', background: 'var(--green-soft)', borderRadius: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <ShieldCheck size={20} color="var(--green)" />
                  <span style={{ color: 'var(--green)', fontWeight: 900, fontSize: 14 }}>DOĞRULANMIŞ PERSONEL</span>
               </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24 }}>
               <div style={{ padding: 24, borderRadius: 24, background: 'rgba(7, 89, 133, 0.03)', border: '1px solid rgba(7, 89, 133, 0.1)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                     <div className="icon-box-sm icon-blue"><Fingerprint size={16} /></div>
                     <span style={{ fontWeight: 800, fontSize: 14, color: 'var(--text-2)' }}>KGB Kayıt No</span>
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--text-1)' }}>{p.kgbNo || 'Kaydı Yok'}</div>
               </div>

               <div style={{ padding: 24, borderRadius: 24, background: 'rgba(7, 89, 133, 0.03)', border: '1px solid rgba(7, 89, 133, 0.1)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                     <div className="icon-box-sm icon-amber"><Calendar size={16} /></div>
                     <span style={{ fontWeight: 800, fontSize: 14, color: 'var(--text-2)' }}>KGB Geçerlilik Tarihi</span>
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--text-1)' }}>
                    {p.kgbExpiryDate ? new Date(p.kgbExpiryDate).toLocaleDateString('tr-TR') : 'Belirtilmemiş'}
                  </div>
               </div>

               <div style={{ padding: 24, borderRadius: 24, background: 'rgba(7, 89, 133, 0.03)', border: '1px solid rgba(7, 89, 133, 0.1)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                     <div className="icon-box-sm icon-green"><User size={16} /></div>
                     <span style={{ fontWeight: 800, fontSize: 14, color: 'var(--text-2)' }}>Onaylayan Yetkili</span>
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--text-1)' }}>{p.approvedBy || 'SİSTEM VARSAYILAN'}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)', marginTop: 4 }}>{p.approverTitle || 'GÜVENLİK KOORDİNATÖRÜ'}</div>
               </div>

               <div style={{ padding: 24, borderRadius: 24, background: 'rgba(7, 89, 133, 0.03)', border: '1px solid rgba(7, 89, 133, 0.1)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                     <div className="icon-box-sm icon-neutral"><MapPin size={16} /></div>
                     <span style={{ fontWeight: 800, fontSize: 14, color: 'var(--text-2)' }}>Çalışma Konumu</span>
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--text-1)' }}>{p.firma === 'Energetic' ? 'Repkon Energetic Fabrika' : 'Merkez Ofis'}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)', marginTop: 4 }}>Dahili Yetki: Seviye 2 (Üretim & Ar-Ge)</div>
               </div>
            </div>
          </div>

          {/* Contact & System Integration Info */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
             <div className="card" style={{ padding: 32, borderRadius: 28 }}>
                <h3 style={{ fontSize: 16, fontWeight: 900, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Briefcase size={18} color="var(--blue)" /> Sistem Entegrasyonu
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
                      <span style={{ fontSize: 13, color: 'var(--text-3)', fontWeight: 600 }}>Windows Kullanıcı</span>
                      <span style={{ fontSize: 13, color: 'var(--text-1)', fontWeight: 800 }}>{p.windowsLogin || '—'}</span>
                   </div>
                   <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
                      <span style={{ fontSize: 13, color: 'var(--text-3)', fontWeight: 600 }}>User ID (WMI)</span>
                      <span style={{ fontSize: 13, color: 'var(--text-1)', fontWeight: 800 }}>{p.userID || '—'}</span>
                   </div>
                   <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 13, color: 'var(--text-3)', fontWeight: 600 }}>Giriş Tarihi</span>
                      <span style={{ fontSize: 13, color: 'var(--text-1)', fontWeight: 800 }}>
                        {p.girisTarih ? new Date(p.girisTarih).toLocaleDateString('tr-TR') : 'Kayıt Yok'}
                      </span>
                   </div>
                </div>
             </div>

             <div className="card" style={{ padding: 32, borderRadius: 28 }}>
                <h3 style={{ fontSize: 16, fontWeight: 900, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Shield size={18} color="var(--green)" /> İpuçları & Güvenlik
                </h3>
                <div style={{ padding: 16, background: 'var(--bg-inset)', borderRadius: 16, display: 'flex', gap: 12 }}>
                   <AlertTriangle size={20} color="var(--amber)" style={{ flexShrink: 0 }} />
                   <p style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.5, fontWeight: 600 }}>
                     Personel kartı basılmadan önce tüm KGB bilgilerinin güncelliği kontrol edilmelidir. Geçersiz tarihli kartlar kapı geçiş sistemlerinde otomatik olarak bloklanacaktır.
                   </p>
                </div>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
}
