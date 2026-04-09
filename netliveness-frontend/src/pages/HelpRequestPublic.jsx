import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CircleAlert,
  LifeBuoy,
  Mail,
  Send,
  ShieldCheck,
  Sparkles,
  Tag,
  User,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { submitHelpRequest } from '../api';

const supportHighlights = [
  { value: 'Hızlı', label: 'Öncelikli dönüş' },
  { value: 'Güvenli', label: 'Kayıtlı destek akışı' },
  { value: 'Net', label: 'Doğru yönlendirme' },
];

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

  return (
    <div className="support-page">
      <style>{`
        .support-page {
          min-height: 100dvh;
          width: 100%;
          position: relative;
          overflow: hidden;
          color: #f8fafc;
          font-family: 'Inter', sans-serif;
          background:
            radial-gradient(circle at top left, rgba(59,130,246,0.22), transparent 28%),
            radial-gradient(circle at 82% 16%, rgba(245,158,11,0.22), transparent 24%),
            linear-gradient(135deg, #06111f 0%, #091624 42%, #040812 100%);
        }
        .support-grid {
          position: relative;
          min-height: 100dvh;
          padding: 22px clamp(16px, 3vw, 42px);
          z-index: 2;
        }
        .support-grid::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px);
          background-size: 72px 72px;
          opacity: 0.42;
          mask-image: linear-gradient(to bottom, rgba(0,0,0,1), rgba(0,0,0,0.18));
          pointer-events: none;
        }
        .support-shell {
          position: relative;
          z-index: 1;
          max-width: 1280px;
          margin: 0 auto;
          border-radius: 30px;
          border: 1px solid rgba(255,255,255,0.08);
          background: linear-gradient(180deg, rgba(7,12,23,0.78), rgba(7,14,24,0.62));
          backdrop-filter: blur(24px);
          box-shadow: 0 30px 90px rgba(2,6,23,0.4);
          overflow: hidden;
        }
        .support-topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          padding: 18px 22px;
          border-bottom: 1px solid rgba(255,255,255,0.08);
          background: linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01));
        }
        .support-brand {
          display: flex;
          align-items: center;
          gap: 14px;
          min-width: 0;
        }
        .support-brand-mark {
          width: 48px;
          height: 48px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, rgba(245,158,11,0.98), rgba(249,115,22,0.82));
          color: #08111f;
          box-shadow: 0 16px 38px rgba(249,115,22,0.24);
          flex-shrink: 0;
        }
        .support-brand-title {
          font-size: 18px;
          font-weight: 900;
          letter-spacing: -0.5px;
          color: #fff;
        }
        .support-brand-subtitle {
          margin-top: 4px;
          font-size: 11px;
          color: rgba(255,255,255,0.54);
          letter-spacing: 1.4px;
          text-transform: uppercase;
        }
        .support-actions {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }
        .support-status {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 11px 14px;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.04);
          color: rgba(255,255,255,0.74);
          font-size: 12px;
          font-weight: 700;
        }
        .support-status-dot {
          width: 8px;
          height: 8px;
          border-radius: 999px;
          background: #22c55e;
          box-shadow: 0 0 12px rgba(34,197,94,0.85);
        }
        .support-home-btn {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          border-radius: 16px;
          border: 1px solid rgba(245,158,11,0.26);
          background: rgba(245,158,11,0.1);
          color: #fbbf24;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.4px;
          cursor: pointer;
          transition: all 0.22s ease;
        }
        .support-home-btn:hover {
          transform: translateY(-1px);
          background: #fbbf24;
          color: #08111f;
          box-shadow: 0 16px 34px rgba(245,158,11,0.22);
        }
        .support-content {
          display: grid;
          grid-template-columns: minmax(0, 0.9fr) minmax(420px, 0.95fr);
          gap: 0;
        }
        .support-hero {
          position: relative;
          padding: clamp(28px, 4vw, 48px);
          border-right: 1px solid rgba(255,255,255,0.06);
          background:
            radial-gradient(circle at top left, rgba(59,130,246,0.16), transparent 32%),
            linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01));
        }
        .support-kicker {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 10px 16px;
          border-radius: 999px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          color: rgba(255,255,255,0.76);
          font-size: 12px;
          font-weight: 700;
          margin-bottom: 22px;
        }
        .support-headline {
          max-width: 520px;
          margin: 0 0 14px;
          font-size: clamp(38px, 4.8vw, 66px);
          line-height: 0.96;
          font-weight: 900;
          letter-spacing: -2.8px;
          text-wrap: balance;
        }
        .support-headline-accent {
          display: block;
          background: linear-gradient(135deg, #f8fafc 0%, #8ec5ff 38%, #f9b14b 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .support-copy {
          max-width: 420px;
          margin: 0 0 24px;
          font-size: 15px;
          line-height: 1.7;
          color: rgba(226,232,240,0.66);
        }
        .support-highlight-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          gap: 14px;
          margin-bottom: 18px;
        }
        .support-highlight-card {
          padding: 18px 16px;
          border-radius: 22px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.02);
        }
        .support-highlight-value {
          font-size: 20px;
          font-weight: 900;
          letter-spacing: -0.8px;
          margin-bottom: 4px;
        }
        .support-highlight-label {
          font-size: 11px;
          line-height: 1.55;
          color: rgba(226,232,240,0.62);
        }
        .support-visual-grid {
          display: grid;
          grid-template-columns: 1.2fr 0.95fr;
          gap: 14px;
        }
        .support-visual-main,
        .support-visual-mini {
          position: relative;
          overflow: hidden;
          border-radius: 24px;
          border: 1px solid rgba(255,255,255,0.08);
          background: linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03));
        }
        .support-visual-main {
          min-height: 220px;
          padding: 22px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }
        .support-visual-main::before {
          content: '';
          position: absolute;
          top: -40px;
          right: -20px;
          width: 180px;
          height: 180px;
          border-radius: 999px;
          background: radial-gradient(circle, rgba(59,130,246,0.32), transparent 68%);
        }
        .support-visual-main::after {
          content: '';
          position: absolute;
          left: -40px;
          bottom: -46px;
          width: 180px;
          height: 180px;
          border-radius: 999px;
          background: radial-gradient(circle, rgba(245,158,11,0.24), transparent 68%);
        }
        .support-visual-badge {
          position: relative;
          z-index: 1;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          width: fit-content;
          padding: 9px 12px;
          border-radius: 999px;
          background: rgba(8,17,31,0.44);
          border: 1px solid rgba(255,255,255,0.08);
          color: rgba(255,255,255,0.82);
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.6px;
          text-transform: uppercase;
        }
        .support-visual-rings {
          position: relative;
          z-index: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 128px;
        }
        .support-ring {
          position: absolute;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,0.12);
        }
        .support-ring.r1 {
          width: 156px;
          height: 156px;
          background: radial-gradient(circle, rgba(255,255,255,0.08), transparent 68%);
        }
        .support-ring.r2 {
          width: 108px;
          height: 108px;
          background: radial-gradient(circle, rgba(59,130,246,0.14), transparent 68%);
        }
        .support-ring.r3 {
          width: 62px;
          height: 62px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, rgba(245,158,11,0.95), rgba(249,115,22,0.82));
          color: #08111f;
          box-shadow: 0 14px 32px rgba(249,115,22,0.24);
        }
        .support-visual-column {
          display: grid;
          gap: 14px;
        }
        .support-visual-mini {
          padding: 18px;
          min-height: 103px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }
        .support-visual-mini-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }
        .support-visual-mini-label {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: rgba(255,255,255,0.46);
          font-weight: 800;
        }
        .support-visual-mini-value {
          font-size: 22px;
          font-weight: 900;
          letter-spacing: -1px;
          color: #fff;
        }
        .support-form-side {
          padding: clamp(24px, 3.5vw, 40px);
          display: flex;
          align-items: stretch;
        }
        .support-form-card {
          width: 100%;
          border-radius: 28px;
          border: 1px solid rgba(255,255,255,0.08);
          background: linear-gradient(180deg, rgba(10,18,32,0.92), rgba(7,12,23,0.72));
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.02);
          padding: 26px;
        }
        .support-form-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 22px;
        }
        .support-form-icon {
          width: 58px;
          height: 58px;
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          color: #f8fafc;
          flex-shrink: 0;
        }
        .support-form-eyebrow {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 2px;
          color: rgba(255,255,255,0.46);
          font-weight: 800;
          margin-bottom: 8px;
        }
        .support-form-title {
          margin: 0 0 8px;
          font-size: 30px;
          line-height: 1.05;
          font-weight: 900;
          letter-spacing: -1.2px;
        }
        .support-form-copy {
          margin: 0;
          font-size: 14px;
          line-height: 1.7;
          color: rgba(226,232,240,0.68);
        }
        .support-form {
          display: grid;
          gap: 16px;
        }
        .support-form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }
        .support-field {
          display: grid;
          gap: 8px;
        }
        .support-label {
          display: flex;
          align-items: center;
          gap: 8px;
          color: rgba(255,255,255,0.64);
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.8px;
        }
        .support-input,
        .support-textarea,
        .support-select {
          width: 100%;
          border-radius: 18px;
          border: 1px solid rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.04);
          color: #f8fafc;
          font-size: 14px;
          font-weight: 600;
          outline: none;
          transition: all 0.22s ease;
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.03);
        }
        .support-input,
        .support-select {
          height: 54px;
          padding: 0 16px;
        }
        .support-textarea {
          padding: 14px 16px;
          resize: vertical;
          min-height: 118px;
        }
        .support-input::placeholder,
        .support-textarea::placeholder {
          color: rgba(255,255,255,0.32);
        }
        .support-input:focus,
        .support-textarea:focus,
        .support-select:focus {
          border-color: rgba(251,191,36,0.38);
          background: rgba(251,191,36,0.05);
          box-shadow: 0 0 0 4px rgba(251,191,36,0.08);
        }
        .support-select option {
          background: #111827;
          color: #f8fafc;
        }
        .support-upload-meta {
          margin-top: 6px;
          font-size: 12px;
          color: #fbbf24;
        }
        .support-submit {
          margin-top: 6px;
          height: 58px;
          border: none;
          border-radius: 18px;
          background: linear-gradient(135deg, rgba(245,158,11,1), rgba(249,115,22,0.96));
          color: #08111f;
          font-size: 15px;
          font-weight: 900;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          cursor: pointer;
          transition: all 0.22s ease;
          box-shadow: 0 18px 40px rgba(249,115,22,0.28);
        }
        .support-submit:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 24px 48px rgba(249,115,22,0.34);
        }
        .support-submit:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        .support-footer {
          margin-top: 18px;
          text-align: center;
          font-size: 11px;
          letter-spacing: 2px;
          color: rgba(255,255,255,0.22);
          font-weight: 700;
        }
        @media (max-width: 1080px) {
          .support-content {
            grid-template-columns: 1fr;
          }
          .support-hero {
            border-right: none;
            border-bottom: 1px solid rgba(255,255,255,0.06);
          }
        }
        @media (max-width: 760px) {
          .support-grid {
            padding: 14px;
          }
          .support-shell {
            border-radius: 24px;
          }
          .support-topbar {
            padding: 16px;
            flex-direction: column;
            align-items: stretch;
          }
          .support-actions {
            justify-content: stretch;
          }
          .support-status,
          .support-home-btn {
            width: 100%;
            justify-content: center;
          }
          .support-hero,
          .support-form-side {
            padding: 20px;
          }
          .support-form-card {
            padding: 22px 18px;
            border-radius: 22px;
          }
          .support-form-row,
          .support-visual-grid {
            grid-template-columns: 1fr;
          }
          .support-headline {
            font-size: 38px;
            letter-spacing: -1.6px;
          }
        }
      `}</style>

      <div className="support-grid">
        <div className="support-shell">
          <div className="support-topbar">
            <div className="support-brand">
              <div className="support-brand-mark">
                <LifeBuoy size={22} />
              </div>
              <div>
                <div className="support-brand-title">REPKON Yardım Masası</div>
                <div className="support-brand-subtitle">Kurumsal destek portalı</div>
              </div>
            </div>

            <div className="support-actions">
              <div className="support-status">
                <span className="support-status-dot" />
                Destek hattı aktif
              </div>
              <button type="button" className="support-home-btn" onClick={() => navigate('/login')}>
                <ArrowLeft size={16} />
                Ana girişe dön
              </button>
            </div>
          </div>

          <div className="support-content">
            <section className="support-hero">
              <div className="support-kicker">
                <Sparkles size={15} color="#fbbf24" />
                Hızlı destek
              </div>

              <h1 className="support-headline">
                Sorunu yazın,
                <span className="support-headline-accent">biz doğru yere ulaştıralım.</span>
              </h1>

              <p className="support-copy">Kısa, temiz ve hızlı. Gereksiz metin yok, doğrudan işlem var.</p>

              <div className="support-highlight-grid">
                {supportHighlights.map((item) => (
                  <div key={item.label} className="support-highlight-card">
                    <div className="support-highlight-value">{item.value}</div>
                    <div className="support-highlight-label">{item.label}</div>
                  </div>
                ))}
              </div>

              <div className="support-visual-grid">
                <div className="support-visual-main">
                  <div className="support-visual-badge">
                    <ShieldCheck size={14} color="#fbbf24" />
                    Destek Akışı
                  </div>
                  <div className="support-visual-rings">
                    <div className="support-ring r1" />
                    <div className="support-ring r2" />
                    <div className="support-ring r3">
                      <LifeBuoy size={24} />
                    </div>
                  </div>
                </div>

                <div className="support-visual-column">
                  <div className="support-visual-mini">
                    <div className="support-visual-mini-top">
                      <div className="support-visual-mini-label">Öncelik</div>
                      <Sparkles size={16} color="#8ec5ff" />
                    </div>
                    <div className="support-visual-mini-value">24/7</div>
                  </div>

                  <div className="support-visual-mini">
                    <div className="support-visual-mini-top">
                      <div className="support-visual-mini-label">Yönlendirme</div>
                      <Send size={16} color="#fbbf24" />
                    </div>
                    <div className="support-visual-mini-value">Tek Form</div>
                  </div>
                </div>
              </div>
            </section>

            <section className="support-form-side">
              <div className="support-form-card">
                <div className="support-form-header">
                  <div>
                    <div className="support-form-eyebrow">Destek talebi</div>
                    <h2 className="support-form-title">Talep oluştur</h2>
                    <p className="support-form-copy">Birkaç alan doldurun, gerisini ekip yönetsin.</p>
                  </div>
                  <div className="support-form-icon">
                    <Send size={24} />
                  </div>
                </div>

                <form className="support-form" onSubmit={handleSubmit}>
                  <div className="support-form-row">
                    <label className="support-field">
                      <span className="support-label">
                        <User size={14} /> Ad Soyad
                      </span>
                      <input
                        type="text"
                        required
                        className="support-input"
                        placeholder="Ahmet Yılmaz"
                        value={form.senderName}
                        onChange={(e) => setForm({ ...form, senderName: e.target.value })}
                      />
                    </label>

                    <label className="support-field">
                      <span className="support-label">
                        <Mail size={14} /> E-Posta
                      </span>
                      <input
                        type="email"
                        className="support-input"
                        placeholder="ahmet@repkon.com.tr"
                        value={form.senderEmail}
                        onChange={(e) => setForm({ ...form, senderEmail: e.target.value })}
                      />
                    </label>
                  </div>

                  <label className="support-field">
                    <span className="support-label">
                      <Tag size={14} /> Konu
                    </span>
                    <input
                      type="text"
                      required
                      className="support-input"
                      placeholder="Bilgisayar açılmıyor, internet yavaş vb."
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
                        <option value="E-Posta">E-Posta</option>
                        <option value="ERP / SAP">ERP / SAP</option>
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
                    <span className="support-label">
                      <CircleAlert size={14} /> Detaylı Mesaj
                    </span>
                    <textarea
                      required
                      className="support-textarea"
                      rows="5"
                      placeholder="Sorunu kısaca anlatın..."
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                    />
                  </label>

                  <label className="support-field">
                    <span className="support-label">Ekran Görüntüsü</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="support-input"
                      onChange={(e) => setScreenshot(e.target.files?.[0] ?? null)}
                      style={{ paddingTop: 14 }}
                    />
                    {screenshot && (
                      <div className="support-upload-meta">
                        Yüklenecek dosya: {screenshot.name} ({(screenshot.size / 1024).toFixed(1)} KB)
                      </div>
                    )}
                  </label>

                  <button type="submit" disabled={loading} className="support-submit">
                    {loading ? 'GÖNDERİLİYOR...' : <><Send size={18} /> Talebi Oluştur</>}
                  </button>
                </form>

                <div className="support-footer">REPKON DESTEK MERKEZİ</div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
