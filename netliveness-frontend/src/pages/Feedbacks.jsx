import { useState, useEffect, useCallback } from 'react';
import { getFeedbacks, markFeedbackAsRead, deleteFeedback } from '../api';
import { MessageSquare, Trash2, CircleCheck, Mail, Clock, User } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Feedbacks() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getFeedbacks();
      setFeedbacks(data);
    } catch (e) {
      toast.error('Geri bildirimler yüklenemedi.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleMarkAsRead = async (id) => {
    try {
      await markFeedbackAsRead(id);
      load();
    } catch (e) {
      toast.error('İşlem başarısız.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bu mesajı silmek istediğinize emin misiniz?')) return;
    try {
      await deleteFeedback(id);
      toast.success('Mesaj silindi.');
      load();
    } catch (e) {
      toast.error('Silme işlemi başarısız.');
    }
  };

  if (loading) return <div className="loading-state">Yükleniyor...</div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h2>Geri Bildirimler & Şikayetler</h2>
          <p>Kullanıcılardan gelen geri bildirimleri ve iyileştirme önerilerini buradan takip edebilirsiniz.</p>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="table-container">
          <table className="dense-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Durum</th>
                <th>Gönderen</th>
                <th>Konu</th>
                <th>Mesaj</th>
                <th>Tarih</th>
                <th style={{ textAlign: 'right' }}>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {feedbacks.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    Henüz bir geri bildirim bulunmuyor.
                  </td>
                </tr>
              ) : (
                feedbacks.map(f => (
                  <tr key={f.id} style={{ opacity: f.isRead ? 0.6 : 1, background: f.isRead ? 'transparent' : 'rgba(34, 197, 94, 0.05)' }}>
                    <td>
                      {f.isRead ? 
                        <span style={{ color: 'var(--text-muted)', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}><CircleCheck size={14} /> Okundu</span> : 
                        <span style={{ color: 'var(--accent-green)', fontWeight: 'bold', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}><Mail size={14} /> Yeni</span>
                      }
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <User size={14} />
                        </div>
                        <span style={{ fontWeight: 600 }}>{f.senderName || 'Anonim'}</span>
                      </div>
                    </td>
                    <td style={{ fontWeight: 600 }}>{f.subject}</td>
                    <td style={{ maxWidth: '400px', whiteSpace: 'normal', fontSize: '13px' }}>{f.message}</td>
                    <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={12} /> {new Date(f.dateSubmitted).toLocaleString('tr-TR')}
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        {!f.isRead && (
                          <button className="icon-btn" onClick={() => handleMarkAsRead(f.id)} title="Okundu Olarak İşaretle">
                            <CircleCheck size={16} />
                          </button>
                        )}
                        <button className="icon-btn danger" onClick={() => handleDelete(f.id)} title="Sil">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
