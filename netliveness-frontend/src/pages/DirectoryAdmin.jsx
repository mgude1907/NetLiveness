import { useState, useEffect, useCallback, useRef } from 'react';
import { getDirectoryEntries, createDirectoryEntry, updateDirectoryEntry, deleteDirectoryEntry, uploadImage, exportDirectoryCsv, importDirectoryCsv, STATIC_URL } from '../api';
import { Plus, Search, Pencil, Trash2, X, Upload, Download, FileUp, Phone, Mail, Hash, User, Briefcase, Building2, ChevronRight, LayoutGrid, ListFilter, Camera } from 'lucide-react';
import toast from 'react-hot-toast';

const emptyForm = {
  firstName: '',
  lastName: '',
  mobilePhone: '',
  internalPhone: '',
  email: '',
  department: '',
  position: '',
  imageUrl: ''
};

export default function DirectoryAdmin() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const [modal, setModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const load = useCallback(async () => {
    try {
      const data = await getDirectoryEntries();
      setItems(data);
    } catch (e) {
      console.error(e);
      toast.error('Rehber listesi yüklenemedi.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = items.filter(u => 
    !search || 
    u.firstName.toLowerCase().includes(search.toLowerCase()) || 
    u.lastName.toLowerCase().includes(search.toLowerCase()) ||
    u.department.toLowerCase().includes(search.toLowerCase()) ||
    u.position?.toLowerCase().includes(search.toLowerCase())
  );

  const openNew = () => { setForm(emptyForm); setEditId(null); setModal(true); };
  const openEdit = (u) => { setForm(u); setEditId(u.id); setModal(true); };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Lütfen geçerli bir resim dosyası seçin.');
      return;
    }

    setUploading(true);
    try {
      const res = await uploadImage(file);
      setForm(prev => ({ ...prev, imageUrl: res.url }));
      toast.success('Resim başarıyla yüklendi.');
    } catch (err) {
      console.error(err);
      toast.error('Resim yüklenirken bir hata oluştu.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        await updateDirectoryEntry(editId, { ...form, id: editId });
        toast.success('Personel kaydı güncellendi.');
      } else {
        await createDirectoryEntry(form);
        toast.success('Yeni personel kaydı oluşturuldu.');
      }
      setModal(false);
      load();
    } catch (e) {
      console.error(e);
      toast.error('İşlem başarısız.');
    }
  };

  const confirmDelete = async () => {
    try {
      await deleteDirectoryEntry(editId);
      toast.success('Kayıt silindi.');
      setDeleteModal(false);
      load();
    } catch (e) {
      console.error(e);
      toast.error('Silme işlemi başarısız.');
    }
  };

  if (loading) return (
    <div className="loading-screen">
      <div className="spinner" />
      <span style={{ fontWeight: 600 }}>Şirket Rehberi Yükleniyor…</span>
    </div>
  );

  return (
    <div className="page-container animate-fade-in" style={{ padding: '40px' }}>
      <style>{`
        .directory-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(440px, 1fr)); gap: 24px; }
        .directory-card { background: rgba(255, 255, 255, 0.7); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.4); border-radius: 28px; padding: 24px; display: flex; gap: 24px; align-items: center; transition: all 0.4s ease; box-shadow: 0 10px 40px rgba(0,0,0,0.03); position: relative; overflow: hidden; }
        .directory-card:hover { transform: translateY(-8px); border-color: #f59e0b50; box-shadow: 0 25px 50px -12px rgba(245, 158, 11, 0.1); }
        .directory-card::before { content: ''; position: absolute; top: 0; left: 0; width: 4px; height: 100%; background: #f59e0b; opacity: 0; transition: opacity 0.3s; }
        .directory-card:hover::before { opacity: 1; }
        
        .avatar-frame { width: 90px; height: 90px; border-radius: 24px; position: relative; flex-shrink: 0; background: #f8fafc; border: 2px solid #fff; box-shadow: 0 8px 20px rgba(0,0,0,0.05); overflow: hidden; }
        .avatar-frame img { width: 100%; height: 100%; object-fit: cover; }
        .avatar-placeholder { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: #f1f5f9; color: #cbd5e1; }
        
        .premium-search { background: #fff !important; border: 1px solid #e2e8f0 !important; border-radius: 18px !important; padding: 12px 16px 12px 48px !important; width: 100%; font-size: 15px !important; transition: all 0.3s; box-shadow: 0 4px 12px rgba(0,0,0,0.02); }
        .premium-search:focus { border-color: #f59e0b !important; box-shadow: 0 0 15px rgba(245, 158, 11, 0.15) !important; outline: none; }
        
        .digital-btn { padding: 12px 20px; border-radius: 14px; font-weight: 800; font-size: 14px; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 8px; border: 1px solid transparent; }
        .btn-amber { background: #f59e0b; color: #fff; box-shadow: 0 8px 20px rgba(245, 158, 11, 0.2); }
        .btn-amber:hover { transform: scale(1.03); box-shadow: 0 12px 25px rgba(245, 158, 11, 0.3); }
        .btn-outline { background: #fff; border-color: #e2e8f0; color: #475569; }
        .btn-outline:hover { background: #f8fafc; border-color: #f59e0b; }
        
        .info-pill { display: flex; align-items: center; gap: 6px; font-size: 12px; color: #64748b; font-weight: 700; background: #f1f5f9; padding: 4px 10px; border-radius: 8px; }
        .premium-modal-admin { background: rgba(15, 23, 42, 0.8) !important; backdrop-filter: blur(25px) saturate(180%) !important; border: 1px solid rgba(245, 158, 11, 0.2) !important; border-radius: 32px !important; padding: 0 !important; overflow: hidden; }
        .form-label-premium { color: #f59e0b; font-size: 11px; font-weight: 900; letter-spacing: 1.5px; margin-bottom: 8px; display: flex; align-items: center; gap: 8px; text-transform: uppercase; }
        .form-input-premium { background: rgba(0,0,0,0.2) !important; border: 1px solid rgba(255,255,255,0.1) !important; border-radius: 14px !important; padding: 12px 16px !important; color: #fff !important; width: 100%; transition: all 0.3s; }
        .form-input-premium:focus { border-color: #f59e0b !important; background: rgba(0,0,0,0.4) !important; box-shadow: 0 0 15px rgba(245,158,11,0.2) !important; outline: none; }
      `}</style>

      {/* ─── Page Header ─── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px' }}>
        <div>
           <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <div style={{ width: 44, height: 44, borderRadius: 14, background: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 20px rgba(245,158,11,0.2)' }}>
                  <Building2 size={24} color="#fff" />
              </div>
              <span style={{ fontSize: 13, fontWeight: 900, color: '#f59e0b', letterSpacing: 3 }}>OPERATIONAL DIRECTORY</span>
          </div>
          <h1 style={{ fontSize: '48px', fontWeight: 950, color: '#0f172a', letterSpacing: -2, margin: 0 }}>Rehber Yönetimi</h1>
          <p style={{ color: '#64748b', fontSize: '15px', fontWeight: 600, marginTop: 6 }}>Personel iletişim verilerini ve yetkinlik ağını buradan kontrol edin.</p>
        </div>
        <button className="digital-btn btn-amber" onClick={openNew}>
          <Plus size={20} strokeWidth={3} /> YENİ KAYIT EKLE
        </button>
      </div>

      {/* ─── Toolbar ─── */}
      <div style={{ background: '#fff', padding: '20px 24px', borderRadius: '24px', border: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
        <div style={{ position: 'relative', width: '380px' }}>
          <Search size={20} color="#94a3b8" style={{ position: 'absolute', left: 16, top: 13 }} />
          <input 
            className="premium-search"
            placeholder="İsim, Bölüm veya Pozisyon Ara…" 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
          />
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="digital-btn btn-outline" onClick={exportDirectoryCsv}>
            <Download size={18} /> DIŞA AKTAR
          </button>
          <input 
            type="file" 
            accept=".csv"
            id="csvUpload"
            style={{ display: 'none' }}
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              try {
                const res = await importDirectoryCsv(file);
                toast.success(res.message || 'İçeri aktarma başarılı.');
                load();
              } catch (err) {
                toast.error(err.response?.data || 'İçeri aktarma başarısız.');
              }
              e.target.value = '';
            }}
          />
          <button className="digital-btn btn-outline" onClick={() => document.getElementById('csvUpload').click()}>
            <FileUp size={18} /> İÇE AKTAR
          </button>
        </div>
      </div>

      {/* ─── Directory Grid ─── */}
      <div className="directory-grid">
        {filtered.map(u => (
          <div key={u.id} className="directory-card">
              <div className="avatar-frame">
                  {u.imageUrl ? (
                    <img src={`${STATIC_URL}${u.imageUrl}`} alt={u.firstName} />
                  ) : (
                    <div className="avatar-placeholder"><User size={40} /></div>
                  )}
              </div>
              <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                          <h3 style={{ fontSize: '20px', fontWeight: '900', color: '#0f172a', margin: 0 }}>{u.firstName} {u.lastName}</h3>
                          <div style={{ fontSize: '13px', fontWeight: '800', color: '#f59e0b', marginTop: 2, textTransform: 'uppercase', letterSpacing: 1 }}>{u.department}</div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                         <button className="icon-btn" style={{ background: '#f8fafc' }} onClick={() => openEdit(u)}><Pencil size={15} /></button>
                         <button className="icon-btn danger" style={{ background: '#fff1f2' }} onClick={() => { setEditId(u.id); setDeleteModal(true); }} disabled={u.id < 0}><Trash2 size={15} /></button>
                      </div>
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#475569', margin: '8px 0 16px' }}>{u.position}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {u.internalPhone && <div className="info-pill"><Hash size={14} /> {u.internalPhone}</div>}
                      {u.mobilePhone && <div className="info-pill"><Phone size={14} /> {u.mobilePhone}</div>}
                      {u.email && <div className="info-pill"><Mail size={14} /> {u.email}</div>}
                  </div>
              </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '100px', background: 'rgba(255,255,255,0.5)', borderRadius: '32px', border: '2px dashed #e2e8f0' }}>
            <p style={{ fontSize: '18px', color: '#94a3b8', fontWeight: 800 }}>Aranan kriterlere uygun personel bulunamadı.</p>
          </div>
        )}
      </div>

      {/* ─── Form Modal ─── */}
      {modal && (
        <div className="v-modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div className="v-modal-content premium-modal-admin" style={{ width: '820px', background: '#0f172a', borderRadius: '32px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', border: '1px solid rgba(245, 158, 11, 0.3)', backdropFilter: 'blur(40px)', position: 'relative' }}>
            <div style={{ padding: '40px 48px', position: 'relative' }}>
                <button style={{ position: 'absolute', top: 32, right: 32, background: 'rgba(255,255,255,0.05)', border: 'none', width: 44, height: 44, borderRadius: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }} onClick={() => setModal(false)}>
                    <X size={24} color="#fff" />
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#f59e0b', boxShadow: '0 0 15px #f59e0b' }} />
                    <span style={{ color: '#f59e0b', fontSize: 11, fontWeight: 900, letterSpacing: 2 }}>PROFILE MANAGER</span>
                </div>
                <h2 style={{ fontSize: '32px', fontWeight: '950', color: '#fff', margin: 0 }}>{editId ? 'Kayıt Güncelle' : 'Yeni Personel Kaydı'}</h2>
            </div>

            <form onSubmit={handleSave} style={{ padding: '0 48px 48px' }}>
              <div style={{ display: 'flex', gap: '40px', marginBottom: '32px' }}>
                {/* Photo Editor */}
                <div style={{ width: '180px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                  <div style={{ width: '150px', height: '150px', borderRadius: '32px', border: '2px dashed rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }}>
                    {form.imageUrl ? (
                      <img src={`${STATIC_URL}${form.imageUrl}`} alt="Profil" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.2)' }}><Camera size={44} /></div>
                    )}
                    {uploading && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '11px', fontWeight: 900 }}>YÜKLENİYOR...</div>}
                  </div>
                  <input type="file" accept="image/*" ref={fileInputRef} style={{ display: 'none' }} onChange={handleImageUpload} />
                  <button type="button" className="digital-btn btn-outline" style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', border: 'none', width: '100%', display: 'flex', justifyContent: 'center' }} onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                    <Upload size={16} /> FOTOĞRAF DEĞİŞTİR
                  </button>
                </div>

                {/* Form Fields */}
                <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                  <div>
                    <label className="form-label-premium"><User size={14} /> AD</label>
                    <input type="text" className="form-input-premium" value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})} required placeholder="Personel adı" />
                  </div>
                  <div>
                    <label className="form-label-premium"><User size={14} /> SOYAD</label>
                    <input type="text" className="form-input-premium" value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})} required placeholder="Personel soyadı" />
                  </div>
                  <div>
                    <label className="form-label-premium"><Building2 size={14} /> BÖLÜM</label>
                    <input type="text" className="form-input-premium" value={form.department} onChange={e => setForm({...form, department: e.target.value})} placeholder="Örn: AR-GE" />
                  </div>
                  <div>
                    <label className="form-label-premium"><Briefcase size={14} /> POZİSYON</label>
                    <input type="text" className="form-input-premium" value={form.position} onChange={e => setForm({...form, position: e.target.value})} placeholder="Örn: Sistem Mühendisi" />
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px' }}>
                <div>
                  <label className="form-label-premium"><Phone size={14} /> CEP TELEFONU</label>
                  <input type="text" className="form-input-premium" value={form.mobilePhone} onChange={e => setForm({...form, mobilePhone: e.target.value})} placeholder="05XX XXX XX XX" />
                </div>
                <div>
                  <label className="form-label-premium"><Hash size={14} /> DAHİLİ NO</label>
                  <input type="text" className="form-input-premium" value={form.internalPhone} onChange={e => setForm({...form, internalPhone: e.target.value})} placeholder="Dahili: XXX" />
                </div>
                <div>
                  <label className="form-label-premium"><Mail size={14} /> E-POSTA ADRESİ</label>
                  <input type="email" className="form-input-premium" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="example@repkon.com.tr" />
                </div>
              </div>

              <div style={{ marginTop: '48px', display: 'flex', gap: '16px' }}>
                <button type="button" className="digital-btn btn-outline" style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.6)', border: 'none', flex: 1, justifyContent: 'center' }} onClick={() => setModal(false)}>İPTAL</button>
                <button type="submit" className="digital-btn btn-amber" style={{ flex: 2, justifyContent: 'center' }}>DEĞİŞİKLİKLERİ KAYDET</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Delete Modal ─── */}
      {deleteModal && (
        <div className="v-modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div className="v-modal-content premium-modal-admin" style={{ maxWidth: 440, padding: 40, textAlign: 'center', background: '#0f172a', borderRadius: '32px', border: '1px solid rgba(239, 68, 68, 0.3)', backdropFilter: 'blur(40px)' }}>
            <div style={{ width: 80, height: 80, borderRadius: 24, background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                <Trash2 size={40} />
            </div>
            <h3 style={{ fontSize: '24px', fontWeight: '950', color: '#fff', margin: '0 0 8px 0' }}>Kaydı Sil?</h3>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 600, fontSize: '15px' }}>Bu personel rehberden kalıcı olarak kaldırılacaktır. Bu işlemi geri alamazsınız.</p>
            <div style={{ marginTop: '32px', display: 'flex', gap: '12px' }}>
              <button className="digital-btn btn-outline" style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.6)', border: 'none', flex: 1, justifyContent: 'center' }} onClick={() => setDeleteModal(false)}>İPTAL</button>
              <button className="digital-btn" style={{ background: '#ef4444', color: '#fff', flex: 1, justifyContent: 'center' }} onClick={confirmDelete}>SİL</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
