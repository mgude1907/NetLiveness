import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CircleAlert,
  LifeBuoy,
  Mail,
  Send,
  ShieldCheck,
  Tag,
  User,
  Wifi,
  Lock,
  Printer,
  FileText,
  Monitor,
  HelpCircle,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import { submitHelpRequest } from '../api';

const QUICK_GUIDES = {
  left: [
    { id: 'vpn', title: 'VPN Bağlantısı', icon: Lock, color: '#f59e0b', desc: 'Evden kurumsal ağa erişim rehberi.' },
    { id: 'wifi', title: 'Şirket WiFi', icon: Wifi, color: '#3b82f6', desc: 'Mobil cihaz ve laptop bağlantı ayarları.' },
    { id: 'mfa', title: 'MFA (2FA) Kurulumu', icon: ShieldCheck, color: '#10b981', desc: 'Güvenli giriş doğrulama adımları.' }
  ],
  right: [
    { id: 'printer', title: 'Yazıcı Tanımlama', icon: Printer, color: '#8b5cf6', desc: 'Ağ yazıcılarını bilgisayara ekleme.' },
    { id: 'erp', title: 'SAP / ERP Giriş', icon: Monitor, color: '#ec4899', desc: 'Uygulama kurulumu ve giriş hataları.' },
    { id: 'email', title: 'E-Posta Ayarları', icon: Mail, color: '#06b6d4', desc: 'Outlook imza ve arşivleme rehberi.' }
  ]
};

export default function HelpRequestPublic() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [screenshot, setScreenshot] = useState(null);
  const [form, setForm] = useState({
    senderName: '',
    senderEmail: '',
    subject: '',
    category: 'Donanım',
    priority: 'Düşük',
    message: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData();
      Object.keys(form).forEach((key) => formData.append(key, form[key]));

      if (screenshot) {
        formData.append('screenshot', screenshot);
      }

      await submitHelpRequest(formData);
      toast.success('Talebiniz başarıyla iletildi. En kısa sürede dönüş yapılacaktır.');
      navigate('/login');
    } catch (err) {
      toast.error('Talep iletilemedi. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  const showGuideToast = (title) => {
    toast(`${title} dökümanı yükleniyor...`, { icon: '📄' });
  };

  return (
    <div className="support-page">
      <style>{`
        @keyframes rotateMesh { 0% { transform: rotate(0deg) scale(1); } 50% { transform: rotate(180deg) scale(1.2); } 100% { transform: rotate(360deg) scale(1); } }
        @keyframes glowPulse { 0%, 100% { opacity: 0.3; } 50% { opacity: 0.6; } }
        @keyframes shine { 0% { left: -100%; } 20% { left: 100%; } 100% { left: 100%; } }

        .support-page {
          min-height: 100dvh;
          width: 100%;
          position: relative;
          color: #0f172a;
          font-family: 'Inter', sans-serif;
          background: #f8fafc;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .bg-mesh-circle {
          position: fixed; border-radius: 50%; filter: blur(140px); z-index: 0; opacity: 0.15;
          animation: rotateMesh 30s infinite linear alternate; pointer-events: none;
        }

        .support-topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 60px;
          border-bottom: 1px solid rgba(15,23,42,0.05);
          background: rgba(255,255,255,0.4);
          backdrop-filter: blur(30px);
          z-index: 10;
        }
        .support-brand {
          display: flex;
          align-items: center;
          gap: 20px;
        }
        .logo-gold {
          background: linear-gradient(135deg, #f59e0b, #d97706);
          padding: 8px 24px;
          border-radius: 12px;
          box-shadow: 0 10px 30px rgba(245,158,11,0.3), 0 0 40px rgba(245,158,11,0.1);
          border: 1px solid rgba(255,255,255,0.2);
          position: relative;
          overflow: hidden;
        }
        .logo-gold::after {
          content: ''; position: absolute; top: 0; left: -100%; width: 50%; height: 100%;
          background: linear-gradient(to right, transparent, rgba(255,255,255,0.3), transparent);
          transform: skewX(-25deg); animation: shine 6s infinite ease-in-out;
        }
        .logo-gold span {
          color: #fff; font-size: 24px; font-weight: 900; letter-spacing: 2px; position: relative; z-index: 1;
        }

        .support-portal-container {
          flex: 1;
          display: grid;
          grid-template-columns: 320px 1fr 320px;
          gap: 32px;
          padding: 40px 60px;
          max-width: 1600px;
          margin: 0 auto;
          width: 100%;
          align-items: center;
          position: relative;
          z-index: 1;
        }

        /* Sidebar Glass Cards */
        .sidebar-section { display: flex; flex-direction: column; gap: 16px; height: 100%; justify-content: center; }
        .sidebar-title { font-size: 11px; font-weight: 900; color: #f59e0b; text-transform: uppercase; letter-spacing: 3px; margin-bottom: 8px; text-align: center; text-shadow: 0 0 15px rgba(245,158,11,0.3); }
        
        .guide-card {
          background: rgba(255,255,255,0.6);
          border: 1px solid rgba(15,23,42,0.04);
          border-radius: 20px;
          padding: 18px;
          display: flex;
          align-items: center;
          gap: 16px;
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1);
          backdrop-filter: blur(10px);
          box-shadow: 0 4px 12px rgba(15,23,42,0.02);
        }
        .guide-card:hover {
          background: #fff;
          border-color: rgba(245,158,11,0.3);
          transform: translateX(4px);
          box-shadow: 0 10px 30px rgba(15,23,42,0.06);
        }
        .guide-icon-box {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(15,23,42,0.03);
          color: #0f172a;
          transition: all 0.3s;
        }
        .guide-card:hover .guide-icon-box { background: #f59e0b; color: #fff; }
        .guide-content { flex: 1; }
        .guide-name { font-size: 14px; font-weight: 800; color: #0f172a; margin-bottom: 2px; }
        .guide-desc { font-size: 11px; color: rgba(15,23,42,0.4); line-height: 1.4; }

        .support-form-card {
          background: rgba(255, 255, 255, 0.6);
          border: 1px solid rgba(15,23,42,0.05);
          border-radius: 36px;
          padding: 48px;
          backdrop-filter: blur(50px);
          animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 40px 100px rgba(15,23,42,0.06), 0 0 40px rgba(245,158,11,0.02);
          position: relative;
        }
        @keyframes slideUp { from { transform: translateY(30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

        .form-header { text-align: center; margin-bottom: 32px; }
        .form-title { font-size: 32px; font-weight: 950; letter-spacing: -2px; margin-bottom: 8px; color: #0f172a; }
        .form-copy { font-size: 14px; color: rgba(15,23,42,0.4); max-width: 400px; margin: 0 auto; line-height: 1.5; }

        .support-form { display: grid; gap: 16px; }
        .support-form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .support-field { display: grid; gap: 8px; }
        .support-label { font-size: 10px; font-weight: 950; color: rgba(15,23,42,0.3); text-transform: uppercase; letter-spacing: 1.5px; display: flex; align-items: center; gap: 6px; }
        
        .support-input, .support-select, .support-textarea {
          width: 100%; border-radius: 16px; border: 1.5px solid rgba(15,23,42,0.06);
          background: rgba(15,23,42,0.02); color: #0f172a; font-size: 14px; outline: none; transition: all 0.2s;
        }
        .support-input, .support-select { height: 48px; padding: 0 16px; }
        .support-textarea { padding: 14px 16px; resize: none; min-height: 100px; }
        
        /* Dropdown Fix - Legible Options */
        .support-select option {
          background: #111827;
          color: #f8fafc;
          padding: 12px;
        }

        .support-input:focus, .support-select:focus, .support-textarea:focus {
          border-color: #f59e0b; background: rgba(245,158,11,0.05); box-shadow: 0 0 0 4px rgba(245,158,11,0.1);
        }
        
        .support-submit {
          height: 60px; border: none; border-radius: 20px;
          background: linear-gradient(to right, #f59e0b, #fbbf24);
          color: #000; font-size: 15px; font-weight: 950; display: flex; align-items: center; justify-content: center; gap: 12px;
          cursor: pointer; transition: all 0.3s; box-shadow: 0 20px 40px rgba(245,158,11,0.25); margin-top: 8px;
        }
        .support-submit:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 25px 50px rgba(245,158,11,0.35); }
        .support-submit:disabled { opacity: 0.5; cursor: not-allowed; }

        .support-home-btn {
          display: flex; align-items: center; gap: 8px; padding: 8px 16px; border-radius: 12px;
          background: rgba(15,23,42,0.04); color: #0f172a; font-size: 12px; font-weight: 700; border: none; cursor: pointer; transition: all 0.2s;
        }
        .support-home-btn:hover { background: rgba(15,23,42,0.08); transform: translateX(-4px); }

        @media (max-width: 1300px) {
          .support-portal-container { grid-template-columns: 1fr; overflow-y: auto; padding: 40px 20px; align-items: start; }
          .sidebar-section { flex-direction: row; flex-wrap: wrap; justify-content: center; }
          .guide-card { width: 300px; }
          .support-page { overflow-y: auto; }
        }
      `}</style>

      {/* Vibrant Mesh Background */}
      <div className="bg-mesh-circle" style={{ width: 800, height: 800, background: 'rgba(59, 130, 246, 0.15)', top: '-20%', left: '-10%' }} />
      <div className="bg-mesh-circle" style={{ width: 700, height: 700, background: 'rgba(245, 158, 11, 0.12)', bottom: '-15%', right: '-5%', animationDelay: '-5s' }} />

      <div className="support-topbar">
        <div className="support-brand">
          <div className="logo-gold">
            <span>REPKON</span>
          </div>
          <div style={{ fontSize: 13, fontWeight: 800, color: 'rgba(15,23,42,0.35)', letterSpacing: 2 }}>DESTEK PORTALI</div>
        </div>
        <button type="button" className="support-home-btn" onClick={() => navigate('/login')}>
          <ArrowLeft size={16} />
          Geri Dön
        </button>
      </div>

      <div className="support-portal-container">
        {/* Left Sidebar: Network & Security */}
        <aside className="sidebar-section">
          <div className="sidebar-title">AĞ & BAĞLANTI</div>
          {QUICK_GUIDES.left.map(guide => (
            <div key={guide.id} className="guide-card" onClick={() => showGuideToast(guide.title)}>
              <div className="guide-icon-box" style={{ border: `1px solid ${guide.color}33` }}>
                <guide.icon size={20} style={{ color: guide.color }} />
              </div>
              <div className="guide-content">
                <div className="guide-name">{guide.title}</div>
                <div className="guide-desc">{guide.desc}</div>
              </div>
              <ChevronRight size={14} color="rgba(15,23,42,0.1)" />
            </div>
          ))}
          <div style={{ marginTop: 20, padding: 20, borderRadius: 20, background: 'rgba(59,130,246,0.05)', border: '1px dashed rgba(59,130,246,0.2)', textAlign: 'center' }}>
            <HelpCircle size={20} color="#3b82f6" style={{ margin: '0 auto 8px' }} />
            <div style={{ fontSize: 11, color: '#3b82f6', fontWeight: 800 }}>Şifremi Unuttum?</div>
            <div style={{ fontSize: 10, color: 'rgba(15,23,42,0.4)', marginTop: 4 }}>Birim amirinize başvurunuz.</div>
          </div>
        </aside>

        {/* Center: Main Form */}
        <main className="support-form-card">
          <div className="form-header">
            <div style={{ width: 44, height: 4, background: '#f59e0b', borderRadius: 2, margin: '0 auto 24px' }} />
            <h1 className="form-title">Yardım Talebi Oluştur</h1>
            <p className="form-copy">Teknik ekibimiz sorunlarınızı en kısa sürede çözümleyecektir.</p>
          </div>

          <form className="support-form" onSubmit={handleSubmit}>
            <div className="support-form-row">
              <label className="support-field">
                <span className="support-label"><User size={12} /> Ad Soyad</span>
                <input
                  type="text" required className="support-input"
                  placeholder="Ahmet Yılmaz"
                  value={form.senderName}
                  onChange={(e) => setForm({ ...form, senderName: e.target.value })}
                />
              </label>

              <label className="support-field">
                <span className="support-label"><Mail size={12} /> E-Posta</span>
                <input
                  type="email" required className="support-input"
                  placeholder="eposta@repkon.com.tr"
                  value={form.senderEmail}
                  onChange={(e) => setForm({ ...form, senderEmail: e.target.value })}
                />
              </label>
            </div>

            <label className="support-field">
              <span className="support-label"><Tag size={12} /> Konu</span>
              <input
                type="text" required className="support-input"
                placeholder="Örn: Bilgisayar açılmıyor"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
              />
            </label>

            <div className="support-form-row">
              <label className="support-field">
                <span className="support-label">Kategori</span>
                <select
                  className="support-select"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                >
                  <option value="Donanım">Donanım</option>
                  <option value="Yazılım">Yazılım</option>
                  <option value="Ağ / İnternet">Ağ / İnternet</option>
                  <option value="ERP / SAP">ERP / SAP</option>
                  <option value="E-Posta">E-Posta</option>
                  <option value="Diğer">Diğer</option>
                </select>
              </label>

              <label className="support-field">
                <span className="support-label">Öncelik</span>
                <select
                  className="support-select"
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value })}
                >
                  <option value="Düşük">Düşük</option>
                  <option value="Orta">Orta</option>
                  <option value="Yüksek">Yüksek</option>
                  <option value="Kritik">Kritik (Acil)</option>
                </select>
              </label>
            </div>

            <label className="support-field">
              <span className="support-label"><CircleAlert size={12} /> Sorun Detayı</span>
              <textarea
                required className="support-textarea"
                placeholder="Yaşadığınız sorunu kısaca açıklayın..."
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
              />
            </label>

            <button type="submit" disabled={loading} className="support-submit">
              {loading ? 'SİSTEME İŞLENİYOR...' : <><Send size={18} /> Destek Talebi Oluştur</>}
            </button>
          </form>
          
          <div style={{ textAlign: 'center', marginTop: 30, fontSize: 10, color: 'rgba(15,23,42,0.2)', fontWeight: 800, letterSpacing: 2 }}>
            REPKON TEKNOLOJİ • GÜVENLİ DESTEK HATTI
          </div>
        </main>

        {/* Right Sidebar: Hardware & Software */}
        <aside className="sidebar-section">
          <div className="sidebar-title">DONANIM & YAZILIM</div>
          {QUICK_GUIDES.right.map(guide => (
            <div key={guide.id} className="guide-card" onClick={() => showGuideToast(guide.title)}>
              <div className="guide-icon-box" style={{ border: `1px solid ${guide.color}33` }}>
                <guide.icon size={20} style={{ color: guide.color }} />
              </div>
              <div className="guide-content">
                <div className="guide-name">{guide.title}</div>
                <div className="guide-desc">{guide.desc}</div>
              </div>
              <ChevronRight size={14} color="rgba(15,23,42,0.1)" />
            </div>
          ))}
          <div style={{ marginTop: 20, padding: 20, borderRadius: 24, background: '#ffffff', border: '1px solid rgba(15,23,42,0.05)', color: '#0f172a', boxShadow: '0 10px 30px rgba(15,23,42,0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div className="icon-box-aura" style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(245,158,11,0.1)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FileText size={16} />
              </div>
              <div style={{ fontSize: 12, fontWeight: 900 }}>Birim Standartları</div>
            </div>
            <div style={{ fontSize: 11, lineHeight: 1.5, color: 'rgba(15,23,42,0.5)' }}>
               Kurumsal renk kodları ve döküman şablonlarını indirmek için doküman merkezini ziyaret edin.
            </div>
            <button style={{ marginTop: 12, width: '100%', padding: '10px', borderRadius: 12, background: 'rgba(15,23,42,0.03)', border: 'none', color: '#0f172a', fontSize: 11, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
               <ExternalLink size={14} /> Doküman Merkezi
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
