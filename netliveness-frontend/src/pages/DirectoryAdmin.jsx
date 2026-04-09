import { useState, useEffect, useCallback, useRef } from 'react';
import { getDirectoryEntries, createDirectoryEntry, updateDirectoryEntry, deleteDirectoryEntry, uploadImage, exportDirectoryCsv, importDirectoryCsv, STATIC_URL } from '../api';
import { Plus, Search, Pencil, Trash2, X, Upload, Download, FileUp } from 'lucide-react';
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
    u.department.toLowerCase().includes(search.toLowerCase())
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
        toast.success('Kayıt güncellendi.');
      } else {
        await createDirectoryEntry(form);
        toast.success('Kayıt oluşturuldu.');
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

  if (loading) return <div className="loading-spinner"><div className="spinner" /> Yükleniyor…</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Şirket Rehberi</h2>
          <p>Çalışan iletişim bilgilerini ve profillerini yönetin</p>
        </div>
        <button className="btn btn-primary" onClick={openNew}>
          <Plus size={16} /> Yeni Kayıt Ekle
        </button>
      </div>

      <div className="toolbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="search-box" style={{ width: '300px' }}>
          <Search size={18} />
          <input 
            placeholder="İsim veya bölüm ara..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
          />
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={exportDirectoryCsv}>
            <Download size={16} /> Dışa Aktar (CSV)
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
          <button className="btn btn-secondary" onClick={() => document.getElementById('csvUpload').click()}>
            <FileUp size={16} /> İçe Aktar (CSV)
          </button>
        </div>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th style={{ width: 50 }}>Resim</th>
              <th>Ad Soyad</th>
              <th>Bölüm / Pozisyon</th>
              <th>Dahili</th>
              <th>Cep Telefonu</th>
              <th>E-Posta</th>
              <th style={{ width: 100 }}>İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(u => (
              <tr key={u.id}>
                <td>
                  {u.imageUrl ? (
                    <img src={`${STATIC_URL}${u.imageUrl}`} alt={u.firstName} style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--bg-primary)' }}></div>
                  )}
                </td>
                <td style={{ fontWeight: 600 }}>{u.firstName} {u.lastName}</td>
                <td>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{u.department}</div>
                  <div style={{ fontSize: '13px' }}>{u.position}</div>
                </td>
                <td>{u.internalPhone || '-'}</td>
                <td>{u.mobilePhone || '-'}</td>
                <td>{u.email || '-'}</td>
                <td>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="icon-btn" onClick={() => openEdit(u)} title="Düzenle"><Pencil size={16} /></button>
                    <button className="icon-btn danger" onClick={() => { setEditId(u.id); setDeleteModal(true); }} disabled={u.id < 0} title={u.id < 0 ? "Personel Silinemez" : "Sil"}><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: '40px' }}>Kayıt bulunamadı.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ width: '800px', maxWidth: '95vw' }}>
            <div className="modal-header">
              <h3>{editId ? 'Kayıt Düzenle' : 'Yeni Kayıt Ekle'}</h3>
              <button className="icon-btn" onClick={() => setModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                
                <div style={{ display: 'flex', gap: '30px', marginBottom: '24px' }}>
                  {/* Photo Section */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', width: '150px' }}>
                    <div style={{ width: '120px', height: '120px', borderRadius: '50%', border: '2px dashed var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', background: 'var(--bg-input)' }}>
                      {form.imageUrl ? (
                        <img src={`${STATIC_URL}${form.imageUrl}`} alt="Profil" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>Fotoğraf Yok</div>
                      )}
                    </div>
                    <input 
                      type="file" 
                      accept="image/*" 
                      ref={fileInputRef}
                      style={{ display: 'none' }}
                      onChange={handleImageUpload}
                    />
                    <button 
                      type="button" 
                      className="btn" 
                      style={{ fontSize: '12px', padding: '6px 12px', background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                    >
                      {uploading ? 'Yükleniyor...' : <><Upload size={14} /> Fotoğraf Seç</>}
                    </button>
                  </div>

                  {/* Form Grid */}
                  <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600 }}>Ad</label>
                      <input type="text" className="form-input" style={{ width: '100%' }} value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})} required />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600 }}>Soyad</label>
                      <input type="text" className="form-input" style={{ width: '100%' }} value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})} required />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600 }}>Bölüm</label>
                      <input type="text" className="form-input" style={{ width: '100%' }} value={form.department} onChange={e => setForm({...form, department: e.target.value})} />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600 }}>Pozisyon</label>
                      <input type="text" className="form-input" style={{ width: '100%' }} value={form.position} onChange={e => setForm({...form, position: e.target.value})} />
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600 }}>Cep Telefonu</label>
                    <input type="text" className="form-input" style={{ width: '100%' }} value={form.mobilePhone} onChange={e => setForm({...form, mobilePhone: e.target.value})} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600 }}>Dahili No</label>
                    <input type="text" className="form-input" style={{ width: '100%' }} value={form.internalPhone} onChange={e => setForm({...form, internalPhone: e.target.value})} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600 }}>E-Posta</label>
                    <input type="email" className="form-input" style={{ width: '100%' }} value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
                  </div>
                </div>
              </div>
              
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModal(false)}>İptal</button>
                <button type="submit" className="btn btn-primary">Kaydet</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <h3 style={{ color: 'var(--accent-red)' }}>Silmeyi Onayla</h3>
              <button className="icon-btn" onClick={() => setDeleteModal(false)}><X size={20} /></button>
            </div>
            <div className="modal-body text-center">
              <p>Bu rehber kaydını silmek istediğinize emin misiniz?</p>
            </div>
            <div className="modal-footer" style={{ justifyContent: 'center' }}>
              <button className="btn btn-secondary" onClick={() => setDeleteModal(false)}>Vazgeç</button>
              <button className="btn" style={{ background: 'var(--accent-red)', color: 'white' }} onClick={confirmDelete}>Sil</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
