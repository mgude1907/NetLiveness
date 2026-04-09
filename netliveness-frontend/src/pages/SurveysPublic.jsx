import { useState, useEffect } from 'react';
import { getActiveSurveys } from '../api';
import { ClipboardList, ChevronRight, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export default function SurveysPublic() {
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    getActiveSurveys()
      .then(setSurveys)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#000', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div className="spinner"></div>
      <p style={{ color: '#EAB308', marginTop: '20px', letterSpacing: '2px' }}>YÜKLENİYOR...</p>
      <style>{`
        .spinner { width: 40px; height: 40px; border: 3px solid rgba(234, 179, 8, 0.1); border-top-color: #EAB308; border-radius: 50%; animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );

  return (
    <div className="public-survey-wrapper">
      <style>{`
        .public-survey-wrapper {
          min-height: 100dvh;
          width: 100%;
          background: #000 url('/bg-login-3.jpg') no-repeat fixed center center / cover;
          position: relative;
          color: white;
          font-family: sans-serif;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
          overflow-x: hidden;
        }
        .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.8); z-index: 1; }
        .content { position: relative; z-index: 2; width: 100%; max-width: 600px; }
        .glass-panel {
          background: rgba(15, 15, 15, 0.7);
          backdrop-filter: blur(24px);
          border: 1px solid rgba(234, 179, 8, 0.2);
          border-radius: 32px;
          padding: 48px;
          box-shadow: 0 40px 100px rgba(0,0,0,0.8);
        }
        .survey-item {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 20px;
          padding: 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          text-decoration: none;
          transition: all 0.3s ease;
          margin-bottom: 16px;
        }
        .survey-item:hover {
          background: rgba(234, 179, 8, 0.08);
          border-color: rgba(234, 179, 8, 0.4);
          transform: translateX(8px);
        }
        .back-btn {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          color: #EAB308;
          background: rgba(234, 179, 8, 0.1);
          border: 1px solid rgba(234, 179, 8, 0.2);
          border-radius: 12px;
          padding: 10px 20px;
          text-decoration: none;
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 32px;
          transition: all 0.3s ease;
          cursor: pointer;
        }
        .back-btn:hover {
          background: #EAB308;
          color: #000;
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(234, 179, 8, 0.3);
        }
      `}</style>

      <div className="overlay" />

      <div className="content">
        <button onClick={() => navigate('/login')} className="back-btn">
          <ArrowLeft size={18} /> Giriş Ekranına Dön
        </button>

        <div className="glass-panel">
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <div style={{ display: 'inline-flex', padding: '16px', background: 'rgba(234, 179, 8, 0.1)', borderRadius: '20px', color: '#EAB308', marginBottom: '20px' }}>
              <ClipboardList size={32} />
            </div>
            <h2 style={{ fontSize: '32px', fontWeight: '900', color: '#EAB308', margin: 0 }}>Şirket Anketleri</h2>
            <p style={{ color: 'rgba(255,255,255,0.5)', marginTop: '8px' }}>Görüşleriniz bizim için çok değerlidir.</p>
          </div>

          <div className="survey-list">
            {surveys.map(s => (
              <Link key={s.id} to={`/anket/${s.id}`} className="survey-item">
                <div>
                  <h4 style={{ margin: 0, color: '#fff', fontSize: '18px', fontWeight: 'bold' }}>{s.title}</h4>
                  <p style={{ margin: '6px 0 0 0', color: 'rgba(255,255,255,0.4)', fontSize: '13px', lineHeight: '1.4' }}>
                    {s.description || 'Katılımınızı bekliyoruz.'}
                  </p>
                </div>
                <ChevronRight size={24} color="#EAB308" />
              </Link>
            ))}

            {surveys.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px', background: 'rgba(255,255,255,0.02)', borderRadius: '20px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                <p style={{ color: 'rgba(255,255,255,0.3)', margin: 0 }}>Şu an aktif bir anket bulunmamaktadır.</p>
              </div>
            )}
          </div>

          <div style={{ textAlign: 'center', marginTop: '40px', paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '2px', margin: 0 }}>
              REPKON DİJİTAL SİSTEMLER AĞI © {new Date().getFullYear()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
