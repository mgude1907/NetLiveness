import { useState, useEffect, useCallback, useRef } from 'react';
import { getPersonnel, createPersonnel, updatePersonnel, deletePersonnel, getSettings, syncPersonnel } from '../api';
import { Plus, Search, Pencil, Trash2, X, Users, Upload, RefreshCw, UserMinus, Building2 } from 'lucide-react';
import Papa from 'papaparse';
import toast from 'react-hot-toast';

const emptyForm = { ad: '', soyad: '', bolum: '', gorev: '', firma: '', sicilNo: '', kartNo: '' };

export default function Personnel() {
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [modal, setModal]     = useState(false);
  const [form, setForm]       = useState(emptyForm);
  const [editId, setEditId]   = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [selected, setSelected] = useState([]);
  const [firmsList, setFirmsList] = useState([]);
  const fileInputRef          = useRef(null);

  const load = useCallback(async () => {
    try { 
      const [persData, settingsData] = await Promise.all([getPersonnel(), getSettings()]);
      setItems(persData);
      
      const firms = (settingsData?.firmsList || '').split(',').map(f => f.trim()).filter(Boolean);
      setFirmsList(firms.length > 0 ? firms : ['Merkez']);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const firms = [...new Set(items.map(p => p.firma).filter(Boolean))].sort();

  const filtered = items.filter(p => {
    const q = search.toLocaleLowerCase('tr-TR');
    const matchSearch = !q || 
      p.ad?.toLocaleLowerCase('tr-TR').includes(q) || 
      p.soyad?.toLocaleLowerCase('tr-TR').includes(q) || 
      p.adSoyad?.toLocaleLowerCase('tr-TR').includes(q) || 
      p.sicilNo?.toLocaleLowerCase('tr-TR').includes(q);
    const matchFirm = !deptFilter || p.firma === deptFilter;
    
    return matchSearch && matchFirm;
  });

  // group by Firma
  const grouped = {};
  filtered.forEach(p => {
    const firm = p.firma || 'Firma Belirtilmemiş';
    if (!grouped[firm]) grouped[firm] = [];
    grouped[firm].push(p);
  });

  const openNew = () => { setForm(emptyForm); setEditId(null); setModal(true); };
  const openEdit = (p) => {
    setForm({ ad: p.ad, soyad: p.soyad, bolum: p.bolum, gorev: p.gorev, firma: p.firma, sicilNo: p.sicilNo, kartNo: p.kartNo });
    setEditId(p.id); setModal(true);
  };

  const handleSave = async () => {
    try {
      const data = { ...form, adSoyad: `${form.ad} ${form.soyad}`.trim() };
      if (editId) {
        await updatePersonnel(editId, { ...data, id: editId });
        toast.success('Personel başarıyla güncellendi.');
      } else {
        await createPersonnel(data);
        toast.success('Yeni personel eklendi.');
      }
      setModal(false); load();
    } catch (e) {
      console.error(e);
      toast.error('Kayıt işlemi başarısız oldu.');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Bu personeli silmek istediğinize emin misiniz?')) return;
    try { 
      await deletePersonnel(id); 
      toast.success('Personel silindi.');
      setSelected(prev => prev.filter(s => s !== id));
      load(); 
    } catch (e) { 
      console.error(e); 
      toast.error('Silme işlemi başarısız oldu.');
    }
  };

  const toggleSelect = (id) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleAllInDept = (deptItems) => {
    const allIds = deptItems.map(p => p.id);
    const allSelected = allIds.every(id => selected.includes(id));
    if (allSelected) {
      setSelected(prev => prev.filter(id => !allIds.includes(id)));
    } else {
      setSelected(prev => [...new Set([...prev, ...allIds])]);
    }
  };

  const handleDeleteSelected = async () => {
    if (selected.length === 0) return;
    if (!confirm(`Seçili ${selected.length} personeli silmek istediğinize emin misiniz?`)) return;
    try {
      const loadingToast = toast.loading('Siliniyor...');
      let count = 0;
      for (const id of selected) {
        try {
          await deletePersonnel(id);
          count++;
        } catch(err) {
          console.error(`Error deleting ${id}:`, err);
        }
      }
      toast.dismiss(loadingToast);
      toast.success(`${count} personel başarıyla silindi.`);
      setSelected([]);
      load();
    } catch (e) {
      console.error(e);
      toast.error('Toplu silme sırasında bir hata oluştu.');
    }
  };

  const handleDeleteAll = async () => {
    if (items.length === 0) return;
    if (!confirm(`DİKKAT! Sistemdeki TÜM PERSONEL KAYITLARI (${items.length} kişi) silinecek. Emin misiniz?`)) return;
    try {
      const loadingToast = toast.loading('Tüm liste siliniyor...');
      let count = 0;
      for (const p of items) {
        try {
          await deletePersonnel(p.id);
          count++;
        } catch(err) {
          console.error(`Error deleting ${p.id}:`, err);
        }
      }
      toast.dismiss(loadingToast);
      toast.success(`Tüm personel kayıtları silindi (${count} adet).`);
      setSelected([]);
      load();
    } catch (e) {
      console.error(e);
      toast.error('Silme sırasında hata oluştu.');
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    const tid = toast.loading('Dış sistemle eşitleniyor...');
    try {
      const res = await syncPersonnel();
      toast.success(res.message || "Eşitleme tamamlandı.");
      toast.dismiss(tid);
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || "Eşitleme hatası!");
      toast.dismiss(tid);
    } finally {
      setSyncing(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      encoding: 'windows-1254',
      complete: async (results) => {
        const rows = results.data;
        if (rows.length === 0) {
          toast.error('CSV dosyası boş!');
          return;
        }

        const loadingToast = toast.loading(`${rows.length} kayıt içe aktarılıyor...`);
        let successCount = 0;
        let errorCount = 0;

        for (const row of rows) {
          try {
            // Map common CSV headers dynamically
            const ad = row.Ad || row.ad || row.Name || row.name || '';
            const soyad = row.Soyad || row.soyad || row.Surname || row.surname || '';
            const bolum = row.Bolum || row.bolum || row.Bölüm || row.bölüm || row.Department || '';
            const gorev = row.Gorev || row.gorev || row.Görev || row.görev || row.Title || '';
            const firma = row.Firma || row.firma || row.Company || '';
            const sicilNo = row.SicilNo || row.sicilNo || row['Sicil No'] || '';
            const kartNo = row.KartNo || row.kartNo || row['Kart No'] || '';
            
            if (!ad && !soyad) continue; // Skip totally empty names

            const data = {
              ad: ad.trim(), soyad: soyad.trim(),
              adSoyad: `${ad} ${soyad}`.trim(),
              bolum: bolum.trim(), gorev: gorev.trim(),
              firma: firma.trim(), sicilNo: sicilNo.trim(), kartNo: kartNo.trim()
            };

            await createPersonnel(data);
            successCount++;
          } catch (err) {
            console.error('Row import error:', err);
            errorCount++;
          }
        }

        toast.dismiss(loadingToast);
        if (successCount > 0) toast.success(`${successCount} kayıt başarıyla eklendi.`);
        if (errorCount > 0) toast.error(`${errorCount} kayıt eklenemedi.`);
        
        // reset file input
        if (fileInputRef.current) fileInputRef.current.value = '';
        load();
      },
      error: (err) => {
        console.error(err);
        toast.error('CSV okuma hatası.');
      }
    });
  };

  if (loading) return (
    <div className="loading-screen">
      <div className="spinner" style={{ width: 36, height: 36 }} />
      <span style={{ fontWeight: 600 }}>Personel yükleniyor…</span>
    </div>
  );

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* ─── Page Header ─── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">
            <div className="icon-box-sm icon-blue"><Users size={15} /></div>
            Personel Yönetimi
          </h1>
          <p className="page-subtitle">Platformda kayıtlı toplam {items.length} personel dosyası bulunuyor</p>
        </div>
        
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {selected.length > 0 && (
            <button className="btn btn-danger" onClick={handleDeleteSelected}>
              <Trash2 size={14} /> Seçilenleri Sil ({selected.length})
            </button>
          )}
          <input type="file" accept=".csv" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileUpload} />
          <button className="btn btn-ghost" onClick={() => fileInputRef.current?.click()} title="CSV İçe Aktar">
            <Upload size={14} />
          </button>
          <button className="btn btn-ghost" onClick={handleSync} disabled={syncing} title="Dış Sistemle Eşitle">
            <RefreshCw size={14} className={syncing ? 'spin' : ''} />
          </button>
          <div className="divider-v" style={{ height: '24px', margin: '0 4px' }} />
          <button className="btn btn-primary" onClick={openNew}>
            <Plus size={16} /> Yeni Personel Ekle
          </button>
        </div>
      </div>

      {/* ─── Toolbar ─── */}
      <div className="card" style={{ padding: '12px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '12px', flex: 1, minWidth: '300px' }}>
            <div className="search-bar" style={{ flex: 1 }}>
              <Search size={15} color="var(--text-3)" />
              <input 
                placeholder="İsim, soyisim veya sicil no ile ara..." 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
              />
            </div>
            <select className="form-select" style={{ width: '200px' }} value={deptFilter} onChange={e => setDeptFilter(e.target.value)}>
              <option value="">Tüm Firmalar</option>
              {firms.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
          {items.length > 0 && (
            <button className="btn btn-ghost" style={{ color: 'var(--red)', fontSize: '12px' }} onClick={handleDeleteAll}>
              <Trash2 size={13} /> Tüm Listeyi Temizle
            </button>
          )}
        </div>
      </div>

      {Object.keys(grouped).sort().map(firm => (
        <div key={firm} className="card" style={{ padding: 0, marginBottom: 0, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 20px', background: '#f8fafc', borderBottom: '1px solid var(--border)' }}>
             <div className="icon-box-sm icon-slate" style={{ width: 24, height: 24 }}><Building2 size={14} /></div>
             <div style={{ fontWeight: 800, fontSize: '14px', color: 'var(--text-1)' }}>{firm}</div>
             <span className="badge badge-neutral" style={{ marginLeft: 'auto', fontSize: '10px' }}>{grouped[firm].length} Personel</span>
          </div>
          <div style={{ padding: '0' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: 40 }}>
                    <input type="checkbox"
                      style={{ cursor: 'pointer' }}
                      checked={grouped[firm].every(p => selected.includes(p.id))}
                      onChange={() => toggleAllInDept(grouped[firm])}
                    />
                  </th>
                  <th>Ad Soyad</th>
                  <th>Sicil / Kart No</th>
                  <th>Bölüm / Görev</th>
                  <th>Giriş Tarihi</th>
                  <th>Durum</th>
                  <th style={{ width: 100, textAlign: 'center' }}>İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {grouped[firm].map(p => {
                  const isSelected = selected.includes(p.id);
                  const isInactive = p.isActive === false;
                  return (
                    <tr key={p.id} className={isSelected ? 'selected-row' : ''} style={{ opacity: isInactive ? 0.6 : 1 }}>
                      <td>
                        <input type="checkbox"
                          style={{ cursor: 'pointer' }}
                          checked={isSelected}
                          onChange={() => toggleSelect(p.id)}
                        />
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div className="avatar-initials" style={{ background: isInactive ? 'var(--bg-inset)' : 'linear-gradient(135deg, var(--blue-light), var(--blue-border))', color: isInactive ? 'var(--text-3)' : 'var(--blue)' }}>
                            {(p.ad?.[0] || '?').toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 800, fontSize: '13px', color: 'var(--text-1)' }}>{p.ad} {p.soyad}</div>
                            {isInactive && <div style={{ fontSize: '10px', color: 'var(--red)', fontWeight: 700 }}>AYRILDI: {p.resignedAt ? new Date(p.resignedAt).toLocaleDateString('tr-TR') : '—'}</div>}
                          </div>
                        </div>
                      </td>
                      <td style={{ fontSize: '12px' }}>
                        <div style={{ fontWeight: 600 }}>{p.sicilNo || '—'}</div>
                        <div style={{ fontSize: '10px', color: 'var(--text-3)' }}>{p.kartNo || '—'}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-1)' }}>{p.bolum}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>{p.gorev}</div>
                      </td>
                      <td style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-2)' }}>
                        {p.girisTarih ? new Date(p.girisTarih).toLocaleDateString('tr-TR') : '—'}
                      </td>
                      <td>
                        <span className={`badge ${p.isActive ? 'badge-green' : 'badge-red'}`} style={{ fontSize: '10px' }}>
                          {p.isActive ? 'AKTİF' : 'AYRILDI'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                          <button className="btn-icon" onClick={() => openEdit(p)} title="Düzenle"><Pencil size={13} /></button>
                          <button className="btn-icon" style={{ borderColor: 'var(--red-border)', color: 'var(--red)' }} onClick={() => handleDelete(p.id)} title="Sil"><Trash2 size={13} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}
      {filtered.length === 0 && (
        <div className="empty-state">
          <Users size={40} color="#cbd5e1" />
          <h3>Personel bulunamadı</h3>
          <p>Arama terimini değiştirin veya yeni personel ekleyin.</p>
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal-content" style={{ maxWidth: 640 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                <div className="icon-box-sm icon-blue"><Users size={16} /></div>
                {editId ? 'Personeli Düzenle' : 'Yeni Personel Kaydı'}
              </h2>
              <button className="icon-btn" onClick={() => setModal(false)}><X size={18} /></button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Ad</label>
                  <input className="form-input" value={form.ad} onChange={e => setForm({...form, ad: e.target.value})} placeholder="Ör: Ahmet" />
                </div>
                <div className="form-group">
                  <label className="form-label">Soyad</label>
                  <input className="form-input" value={form.soyad} onChange={e => setForm({...form, soyad: e.target.value})} placeholder="Ör: Yılmaz" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Bölüm</label>
                  <input className="form-input" value={form.bolum} onChange={e => setForm({...form, bolum: e.target.value})} placeholder="Bilgi İşlem" />
                </div>
                <div className="form-group">
                  <label className="form-label">Görev</label>
                  <input className="form-input" value={form.gorev} onChange={e => setForm({...form, gorev: e.target.value})} placeholder="Sistem Yöneticisi" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Firma / Tesis</label>
                  <select className="form-select" value={form.firma} onChange={e => setForm({...form, firma: e.target.value})}>
                    <option value="">Firma Seçiniz...</option>
                    {firmsList.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Sicil Numarası</label>
                  <input className="form-input" value={form.sicilNo} onChange={e => setForm({...form, sicilNo: e.target.value})} placeholder="00123" />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Kart Numarası (ID)</label>
                <input className="form-input" value={form.kartNo} onChange={e => setForm({...form, kartNo: e.target.value})} placeholder="A-4567-89" />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
              <button className="btn btn-secondary" onClick={() => setModal(false)}>İptal</button>
              <button className="btn btn-primary" onClick={handleSave}>
                {editId ? 'Değişiklikleri Kaydet' : 'Personeli Kaydet'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
