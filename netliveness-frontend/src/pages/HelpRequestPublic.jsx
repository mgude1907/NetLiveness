import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LifeBuoy, Send, ArrowLeft, User, Mail, Tag, CircleAlert } from 'lucide-react';
import { submitHelpRequest } from '../api';
import toast from 'react-hot-toast';

export default function HelpRequestPublic() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    senderName: '',
    senderEmail: '',
    subject: '',
    category: 'Donanım',
    priority: 'Düşük',
    message: ''
  });
  const [screenshot, setScreenshot] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData();
      Object.keys(form).forEach(key => formData.append(key, form[key]));
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

  return (
    <div className="help-public-wrapper">
      <style>{`
        .help-public-wrapper {
          min-height: 100dvh;
          width: 100%;
          background: #000 url('/bg-login-3.jpg') no-repeat fixed center center / cover;
          position: relative;
          color: white;
          font-family: 'Inter', sans-serif;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
          overflow-x: hidden;
        }
        .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.85); z-index: 1; }
        .content { position: relative; z-index: 2; width: 100%; max-width: 650px; }
        .glass-panel {
          background: rgba(15, 15, 15, 0.7);
          backdrop-filter: blur(24px);
          border: 1px solid rgba(255, 215, 0, 0.2);
          border-radius: 32px;
          padding: 48px;
          box-shadow: 0 40px 100px rgba(0,0,0,0.8);
        }
        .premium-input {
          width: 100%;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 16px;
          padding: 14px 16px;
          color: white;
          font-size: 15px;
          transition: all 0.3s;
          outline: none;
        }
        .premium-input:focus {
          border-color: #FFD700;
          background: rgba(255, 215, 0, 0.05);
          box-shadow: 0 0 15px rgba(255, 215, 0, 0.2);
        }
        .premium-input option {
          background: #1a1a1a;
          color: white;
        }
        .form-group { margin-bottom: 20px; }
        .form-label { display: flex; alignItems: center; gap: 8px; font-size: 14px; font-weight: 600; color: rgba(255,255,255,0.6); margin-bottom: 8px; }
        .btn-gold {
          width: 100%;
          padding: 16px;
          background: #FFD700;
          color: #000;
          border: none;
          border-radius: 16px;
          font-weight: 800;
          font-size: 16px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          transition: all 0.3s;
        }
        .btn-gold:hover:not(:disabled) {
          background: #FFE44D;
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(255, 215, 0, 0.4);
        }
        .back-btn {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          color: #FFD700;
          background: rgba(255, 215, 0, 0.1);
          border: 1px solid rgba(255, 215, 0, 0.2);
          border-radius: 12px;
          padding: 10px 20px;
          text-decoration: none;
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 32px;
          transition: all 0.3s ease;
          cursor: pointer;
          border: 1px solid #FFD700;
        }
        .back-btn:hover {
          background: #FFD700;
          color: #000;
          transform: translateY(-2px);
        }
      `}</style>

      <div className="overlay" />

      <div className="content">
        <button onClick={() => navigate('/login')} className="back-btn">
          <ArrowLeft size={18} /> Giriş Ekranına Dön
        </button>

        <div className="glass-panel">
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <div style={{ display: 'inline-flex', padding: '16px', background: 'rgba(255, 215, 0, 0.1)', borderRadius: '20px', color: '#FFD700', marginBottom: '20px' }}>
              <LifeBuoy size={36} />
            </div>
            <h2 style={{ fontSize: '32px', fontWeight: '900', color: '#FFD700', margin: 0 }}>Yardım Masası</h2>
            <p style={{ color: 'rgba(255,255,255,0.5)', marginTop: '8px' }}>Yaşadığınız sorunu detaylıca iletin, çözelim.</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div className="form-group">
                <label className="form-label"><User size={16} /> Adınız Soyadınız</label>
                <input 
                  type="text" required className="premium-input" placeholder="Ahmet Yılmaz"
                  value={form.senderName} onChange={e => setForm({...form, senderName: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label className="form-label"><Mail size={16} /> E-Posta (Opsiyonel)</label>
                <input 
                  type="email" className="premium-input" placeholder="ahmet@repkon.com.tr"
                  value={form.senderEmail} onChange={e => setForm({...form, senderEmail: e.target.value})}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label"><Tag size={16} /> Konu</label>
              <input 
                type="text" required className="premium-input" placeholder="Bilgisayar açılmıyor, internet yavaş vb."
                value={form.subject} onChange={e => setForm({...form, subject: e.target.value})}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div className="form-group">
                <label className="form-label">Kategori</label>
                <select 
                  className="premium-input" style={{ appearance: 'none' }}
                  value={form.category} onChange={e => setForm({...form, category: e.target.value})}
                >
                  <option value="Donanım">Donanım</option>
                  <option value="Yazılım">Yazılım</option>
                  <option value="Ağ / İnternet">Ağ / İnternet</option>
                  <option value="E-Posta">E-Posta</option>
                  <option value="ERP / SAP">ERP / SAP</option>
                  <option value="Diğer">Diğer</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Öncelik</label>
                <select 
                  className="premium-input" style={{ appearance: 'none' }}
                  value={form.priority} onChange={e => setForm({...form, priority: e.target.value})}
                >
                  <option value="Düşük">Düşük</option>
                  <option value="Orta">Orta</option>
                  <option value="Yüksek">Yüksek</option>
                  <option value="Kritik">Kritik (Acil)</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label"><CircleAlert size={16} /> Detaylı Mesaj</label>
              <textarea 
                required className="premium-input" rows="4" placeholder="Lütfen sorunu detaylandırın..."
                value={form.message} onChange={e => setForm({...form, message: e.target.value})}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Resim / Ekran Görüntüsü (Opsiyonel)</label>
              <input 
                type="file" accept="image/*" className="premium-input"
                onChange={e => setScreenshot(e.target.files[0])}
                style={{ padding: '10px' }}
              />
              {screenshot && (
                <p style={{ fontSize: '12px', color: '#FFD700', marginTop: '5px' }}>
                  Yüklenecek: {screenshot.name} ({(screenshot.size / 1024).toFixed(1)} KB)
                </p>
              )}
            </div>

            <button type="submit" disabled={loading} className="btn-gold">
              {loading ? 'GÖNDERİLİYOR...' : <><Send size={20} /> TALEBİ OLUŞTUR</>}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: '11px', color: 'rgba(255,255,255,0.2)', marginTop: '32px', letterSpacing: '2px' }}>
            REPKON DİJİTAL SİSTEMLER DESTEK EKİBİ
          </p>
        </div>
      </div>
    </div>
  );
}
