import { useState, useEffect } from 'react';
import { getHelpRequests, updateHelpRequest, deleteHelpRequest } from '../api';
import { LifeBuoy, CircleCheck, Clock, TriangleAlert, Trash2, Filter, Search } from 'lucide-react';
import toast from 'react-hot-toast';

export default function HelpRequestAdmin() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('Hepsi');
  const [searchTerm, setSearchTerm] = useState('');
  const [resolutionModal, setResolutionModal] = useState({ open: false, id: null, status: '' });
  const [resNote, setResNote] = useState('');

  const load = async () => {
    try {
      const data = await getHelpRequests();
      setRequests(data);
    } catch (e) {
      toast.error('Talepler yüklenemedi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleUpdate = async (id, status) => {
    if (status === 'Çözüldü' || status === 'Kapalı') {
      setResolutionModal({ open: true, id, status });
      setResNote('');
      return;
    }

    try {
      const req = requests.find(r => r.id === id);
      await updateHelpRequest(id, { ...req, status });
      toast.success('Durum güncellendi.');
      load();
    } catch (e) {
      toast.error('Güncelleme başarısız.');
    }
  };

  const saveResolution = async () => {
    if (!resNote.trim()) return toast.error('Lütfen bir çözüm notu girin.');
    try {
      const req = requests.find(r => r.id === resolutionModal.id);
      await updateHelpRequest(resolutionModal.id, { 
        ...req, 
        status: resolutionModal.status, 
        resolution: resNote 
      });
      toast.success('Talep çözümlendi.');
      setResolutionModal({ open: false, id: null, status: '' });
      load();
    } catch (e) {
      toast.error('İşlem başarısız.');
    }
  };
/* ... filtered and other helper functions ... */
  const filtered = requests.filter(r => {
    const matchesFilter = filter === 'Hepsi' || r.status === filter;
    const matchesSearch = 
      (r.senderName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.subject || "").toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getStatusIcon = (status) => {
/* ... existing code ... */
    switch (status) {
      case 'Açık': return <TriangleAlert size={16} color="#ef4444" />;
      case 'İşlemde': return <Clock size={16} color="#f59e0b" />;
      case 'Çözüldü': return <CircleCheck size={16} color="#10b981" />;
      case 'Kapalı': return <Search size={16} color="#64748b" />;
      default: return null;
    }
  };

  const getPriorityColor = (priority) => {
/* ... existing code ... */
    switch (priority) {
      case 'Kritik': return '#ef4444';
      case 'Yüksek': return '#f97316';
      case 'Orta': return '#f59e0b';
      case 'Düşük': return '#10b981';
      default: return '#fff';
    }
  };

  return (
    <div style={{ padding: '32px', maxWidth: '1600px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ padding: '16px', background: 'rgba(255, 215, 0, 0.1)', borderRadius: '20px', color: '#FFD700', border: '1px solid rgba(255, 215, 0, 0.3)', boxShadow: '0 0 20px rgba(255, 215, 0, 0.1)' }}>
            <LifeBuoy size={32} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '28px', fontWeight: '900', letterSpacing: '-0.5px' }}>Yardım Masası Yönetimi</h1>
            <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)', fontSize: '15px' }}>Personel destek taleplerini izleyin ve çözüm sürecini yönetin.</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div className="glass-card" style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '12px', borderRadius: '14px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'bold' }}>TOPLAM TALEP</div>
              <div style={{ fontSize: '18px', fontWeight: '900', color: '#FFD700' }}>{requests.length}</div>
            </div>
            <div style={{ width: '1px', height: '24px', background: 'var(--border-color)' }} />
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'bold' }}>AÇIK</div>
              <div style={{ fontSize: '18px', fontWeight: '900', color: '#ef4444' }}>{requests.filter(r => r.status === 'Açık').length}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="glass-card" style={{ padding: '32px', borderRadius: '28px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
        {/* Filters and Search */}
        <div style={{ display: 'flex', gap: '20px', marginBottom: '32px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: '1', minWidth: '300px' }}>
            <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#FFD700', opacity: 0.8 }} />
            <input 
              className="premium-input" placeholder="Talep ara (İsim veya konu)..." 
              style={{ paddingLeft: '46px', width: '100%', height: '48px' }}
              value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {['Hepsi', 'Açık', 'İşlemde', 'Çözüldü', 'Kapalı'].map(f => (
              <button 
                key={f} onClick={() => setFilter(f)}
                className={`btn ${filter === f ? 'btn-primary' : 'btn-outline'}`}
                style={{ padding: '8px 16px', borderRadius: '12px' }}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Table/List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filtered.map(req => (
            <div key={req.id} className="request-card" style={{ 
              padding: '20px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '20px',
              display: 'grid', gridTemplateColumns: '1fr auto', gap: '24px', alignItems: 'start', transition: 'all 0.2s ease'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                  <span style={{ fontSize: '10px', padding: '3px 10px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: getPriorityColor(req.priority), border: `1px solid ${getPriorityColor(req.priority)}44`, fontWeight: '900' }}>
                    {req.priority.toUpperCase()}
                  </span>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{req.catName || req.category}</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>• {new Date(req.createdAt).toLocaleString()}</span>
                </div>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 'bold' }}>{req.subject}</h3>
                <p style={{ margin: '0 0 16px 0', color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.6', background: 'rgba(255,255,255,0.01)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.03)' }}>{req.message}</p>
                
                {req.resolution && (
                  <div style={{ 
                    margin: '0 0 16px 0', padding: '12px 16px', background: 'rgba(16, 185, 129, 0.05)', 
                    border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '12px', position: 'relative' 
                  }}>
                    <div style={{ fontSize: '11px', color: 'var(--accent-green)', fontWeight: '800', marginBottom: '4px', textTransform: 'uppercase' }}>ÇÖZÜM NOTU</div>
                    <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-primary)', fontStyle: 'italic' }}>{req.resolution}</p>
                  </div>
                )}

                <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '16px' }}>
                  Gönderen: <span style={{ color: 'var(--text-primary)', fontWeight: '800' }}>{req.senderName}</span> 
                  {req.senderEmail && <span style={{ color: 'var(--text-muted)', marginLeft: '8px', fontWeight: '400' }}>({req.senderEmail})</span>}
                </div>

                {req.screenshotPath && (
                  <div style={{ marginTop: '16px' }}>
                    <div style={{ fontSize: '11px', color: '#FFD700', fontWeight: '800', marginBottom: '8px', textTransform: 'uppercase' }}>EKRAN GÖRÜNTÜSÜ</div>
                    <a href={`http://${window.location.hostname}:5006${req.screenshotPath}`} target="_blank" rel="noreferrer">
                      <img 
                        src={`http://${window.location.hostname}:5006${req.screenshotPath}`} 
                        alt="Screenshot" 
                        style={{ 
                          maxWidth: '200px', maxHeight: '150px', borderRadius: '12px', 
                          border: '2px solid rgba(255, 215, 0, 0.3)', cursor: 'zoom-in',
                          transition: 'transform 0.2s'
                        }} 
                        onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'}
                        onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                      />
                    </a>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'end' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '900', color: req.status === 'Açık' ? 'var(--accent-red)' : (req.status === 'İşlemde' ? 'var(--accent-amber)' : 'var(--accent-green)'), background: 'rgba(255,255,255,0.03)', padding: '6px 12px', borderRadius: '10px' }}>
                  {getStatusIcon(req.status)} {req.status.toUpperCase()}
                </div>
                
                <div style={{ display: 'flex', gap: '10px' }}>
                  <select 
                    className="premium-input" style={{ padding: '8px 12px', fontSize: '12px', width: 'auto', minWidth: '120px' }}
                    value={req.status} onChange={e => handleUpdate(req.id, e.target.value)}
                  >
                    <option value="Açık">Açık</option>
                    <option value="İşlemde">İşlemde</option>
                    <option value="Çözüldü">Çözüldü</option>
                    <option value="Kapalı">Kapalı</option>
                  </select>
                  <button onClick={() => handleDelete(req.id)} className="btn-icon" style={{ height: '38px', width: '38px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {filtered.length === 0 && !loading && (
            <div style={{ textAlign: 'center', padding: '80px', background: 'rgba(255,255,255,0.01)', borderRadius: '32px', border: '1px dashed var(--border-color)' }}>
              <LifeBuoy size={48} style={{ marginBottom: '16px', color: 'var(--text-muted)' }} />
              <p style={{ color: 'var(--text-muted)', fontWeight: '600' }}>Herhangi bir yardım talebi bulunamadı.</p>
            </div>
          )}
        </div>
      </div>

      {/* Resolution Modal */}
      {resolutionModal.open && (
        <div className="modal-overlay">
          <div className="card" style={{ width: '100%', maxWidth: '500px', padding: '32px', border: '1px solid var(--accent-amber)', boxShadow: '0 0 40px rgba(245, 158, 11, 0.1)' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '20px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <CircleCheck size={24} color="var(--accent-amber)" /> Çözüm Detayı Girin
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '20px' }}>
              Talebi {resolutionModal.status.toLowerCase()} durumuna getirmek için lütfen kısa bir çözüm özeti yazın.
            </p>
            <textarea 
              className="premium-input" rows="5" placeholder="Sistem güncellendi, parça değişimi yapıldı vb."
              style={{ width: '100%', marginBottom: '24px' }}
              value={resNote} onChange={e => setResNote(e.target.value)}
              autoFocus
            />
            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setResolutionModal({ open: false, id: null, status: '' })}>İptal</button>
              <button className="btn btn-primary" style={{ flex: 1, background: 'var(--accent-amber)' }} onClick={saveResolution}>Değişikliği Kaydet</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
