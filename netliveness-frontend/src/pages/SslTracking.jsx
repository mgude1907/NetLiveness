import { useState, useEffect, useCallback } from 'react';
import { getSslItems, createSslItem, updateSslItem, deleteSslItem } from '../api';
import { Plus, Search, Pencil, Trash2, X, ShieldCheck, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';

const ENVIRONMENTS = ['PROD', 'STAGING', 'DEV', 'TEST'];

const emptyForm = { domain: '', owner: '', environment: 'PROD', expiryDate: '' };

export default function SslTracking() {
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [envFilter, setEnvFilter] = useState('');
  const [modal, setModal]     = useState(false);
  const [form, setForm]       = useState(emptyForm);
  const [editId, setEditId]   = useState(null);

  const load = useCallback(async () => {
    try { setItems(await getSslItems()); } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); const iv = setInterval(load, 30000); return () => clearInterval(iv); }, [load]);

  const filtered = items.filter(s => {
    const q = search.toLowerCase();
    const matchSearch = !q || s.domain?.toLowerCase().includes(q) || s.owner?.toLowerCase().includes(q);
    const matchEnv = !envFilter || s.environment === envFilter;
    return matchSearch && matchEnv;
  });

  const openNew = () => { setForm(emptyForm); setEditId(null); setModal(true); };
  const openEdit = (s) => {
    setForm({
      domain: s.domain, owner: s.owner, environment: s.environment,
      expiryDate: s.expiryDate ? new Date(s.expiryDate).toISOString().split('T')[0] : ''
    });
    setEditId(s.id); setModal(true);
  };

  const handleSave = async () => {
    try {
      if (editId) {
        await updateSslItem(editId, { ...form, id: editId });
        toast.success('SSL kaydı güncellendi.');
      } else {
        await createSslItem(form);
        toast.success('Yeni SSL kaydı eklendi.');
      }
      setModal(false); load();
    } catch (e) {
      console.error(e);
      toast.error('SSL kaydı işlemi başarısız oldu.');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Bu SSL kaydını silmek istediğinize emin misiniz?')) return;
    try {
      await deleteSslItem(id);
      toast.success('SSL kaydı silindi.');
      load();
    } catch (e) {
      console.error(e);
      toast.error('Silme işlemi başarısız oldu.');
    }
  };

  const daysBadge = (days) => {
    if (days <= 0) return <span className="badge badge-danger"><ShieldAlert size={12} /> Süresi Dolmuş</span>;
    if (days <= 30) return <span className="badge badge-warn">{days} gün</span>;
    return <span className="badge badge-success">{days} gün</span>;
  };

  if (loading) return (
    <div className="loading-screen">
      <div className="spinner" style={{ width: 36, height: 36 }} />
      <span style={{ fontWeight: 600 }}>SSL sertifikaları yükleniyor…</span>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="page-title">
            <div className="icon-box-sm icon-violet"><ShieldCheck size={15} color="#5b21b6" /></div>
            SSL Sertifika Takibi
          </h1>
          <p className="page-subtitle">{items.length} sertifika izleniyor</p>
        </div>
        <button className="btn btn-primary" onClick={openNew}>
          <Plus size={14} /> Yeni SSL Ekle
        </button>
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <div className="search-bar" style={{ flex: 1, maxWidth: 360 }}>
          <Search size={14} color="#94a3b8" />
          <input placeholder="Domain ara…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="form-select" style={{ width: 'auto' }} value={envFilter} onChange={e => setEnvFilter(e.target.value)}>
          <option value="">Tüm Ortamlar</option>
          {ENVIRONMENTS.map(e => <option key={e} value={e}>{e}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0 }}>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Domain</th>
                <th>Sahip</th>
                <th>Ortam</th>
                <th>Bitiş Tarihi</th>
                <th>Kalan Gün</th>
                <th>Durum</th>
                <th style={{ width: 80 }}>İşlem</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => {
                let daysLeft = s.daysLeft ?? 999;
                if (s.expiryDate) {
                  const now = new Date(); now.setHours(0,0,0,0);
                  const exp = new Date(s.expiryDate); exp.setHours(0,0,0,0);
                  daysLeft = Math.ceil((exp - now) / (1000 * 60 * 60 * 24));
                }
                return (
                  <tr key={s.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className={`icon-box-sm ${daysLeft <= 0 ? 'icon-red' : daysLeft <= 30 ? 'icon-amber' : 'icon-green'}`} style={{ width: 28, height: 28, borderRadius: 6 }}>
                          {daysLeft <= 0 || daysLeft <= 30
                            ? <ShieldAlert size={13} color={daysLeft <= 0 ? '#991b1b' : '#b45309'} />
                            : <ShieldCheck size={13} color="#065f46" />}
                        </div>
                        <strong style={{ fontSize: 13 }}>{s.domain}</strong>
                      </div>
                    </td>
                    <td>{s.owner || '—'}</td>
                    <td><span className="badge badge-neutral">{s.environment}</span></td>
                    <td style={{ fontSize: 12, color: '#64748b' }}>
                      {s.expiryDate ? new Date(s.expiryDate).toLocaleDateString('tr-TR') : '—'}
                    </td>
                    <td>{daysBadge(daysLeft)}</td>
                    <td>
                      <span className={`badge ${daysLeft <= 0 ? 'badge-red' : daysLeft <= 30 ? 'badge-amber' : 'badge-green'}`}>
                        {daysLeft <= 0 ? 'Süresi Dolmuş' : daysLeft <= 30 ? 'Yakında Dolacak' : 'Geçerli'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn-icon" onClick={() => openEdit(s)}><Pencil size={13} /></button>
                        <button className="btn-icon" style={{ color: '#ef4444', borderColor: '#fecaca' }} onClick={() => handleDelete(s.id)}><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
                  <ShieldCheck size={32} style={{ display: 'block', margin: '0 auto 8px', opacity: 0.3 }} />
                  Domain bulunamadı
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal-content" style={{ maxWidth: 460 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                <div className="icon-box-sm icon-violet" style={{ width: 30, height: 30, borderRadius: 8 }}>
                  <ShieldCheck size={14} color="#5b21b6" />
                </div>
                {editId ? 'SSL Düzenle' : 'Yeni SSL Ekle'}
              </h2>
              <button className="icon-btn" onClick={() => setModal(false)}><X size={16} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-group">
                <label className="form-label">Domain</label>
                <input className="form-input" value={form.domain} onChange={e => setForm({...form, domain: e.target.value})} placeholder="example.com" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div className="form-group">
                  <label className="form-label">Sahip</label>
                  <input className="form-input" value={form.owner} onChange={e => setForm({...form, owner: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Ortam</label>
                  <select className="form-select" value={form.environment} onChange={e => setForm({...form, environment: e.target.value})}>
                    {ENVIRONMENTS.map(env => <option key={env} value={env}>{env}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Bitiş Tarihi</label>
                <input type="date" className="form-input" value={form.expiryDate} onChange={e => setForm({...form, expiryDate: e.target.value})} />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
              <button className="btn btn-ghost" onClick={() => setModal(false)}>İptal</button>
              <button className="btn btn-primary" onClick={handleSave}>{editId ? 'Güncelle' : 'Kaydet'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
