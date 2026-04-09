import React, { useState, useEffect, Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Network, Plus, Search, CircleHelp, Key, RefreshCcw, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AccessMatrix() {
  const [columns, setColumns] = useState([]);
  const [personnel, setPersonnel] = useState([]);
  const [grants, setGrants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedFirma, setSelectedFirma] = useState('');

  // Sütun Ekleme Modali
  const [showAddColumn, setShowAddColumn] = useState(false);
  const [newColCat, setNewColCat] = useState('PROJECT');
  const [newColName, setNewColName] = useState('');

  // Sütun Silme Modali (Özel Confirm)
  const [deleteConfirm, setDeleteConfirm] = useState(null); // { id, name }
  const [deleting, setDeleting] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    // Ana içeriği ekran boyutuyla sınırlıyoruz ki yatay scroll bar her zaman altta görünsün
    const main = document.querySelector('.main-content');
    if (main) {
      const originalFlow = main.style.overflow;
      const originalHeight = main.style.height;
      const originalPadding = main.style.padding;
      
      main.style.overflow = 'hidden';
      main.style.height = '100vh';
      main.style.padding = '0'; // Padding'i içeri alıyoruz
      
      return () => {
        main.style.overflow = originalFlow;
        main.style.height = originalHeight;
        main.style.padding = originalPadding;
      };
    }
  }, []);

  const getCategoryColor = (cat) => {
    const normalized = (cat || '').trim().toUpperCase();
    if (normalized === 'PROJECT') return 'rgba(34, 197, 94, 0.15)'; // Darker Green
    if (normalized === 'DEPARTMENTS') return 'rgba(56, 189, 248, 0.15)'; // Darker Blue
    return 'transparent';
  };

  const API_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:5006/api`;

  const fetchData = async () => {
    setLoading(true);
    console.log('Fetching data from API...', API_URL);
    try {
      const ts = Date.now();
      const [colRes, pRes, grantRes] = await Promise.all([
        axios.get(`${API_URL}/accessmatrix/columns?t=${ts}`),
        axios.get(`${API_URL}/personnel?t=${ts}`),
        axios.get(`${API_URL}/accessmatrix/grants?t=${ts}`)
      ]);
      console.log('Data fetched successfully:', { columns: colRes.data.length, personnel: pRes.data.length });
      setColumns(colRes.data);
      setPersonnel(pRes.data);
      setGrants(grantRes.data);
    } catch (err) {
      toast.error('Veriler yüklenirken bir hata oluştu.');
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAddColumn = async (e) => {
    e.preventDefault();
    if (!newColName) return;

    // Frontend duplicate check
    const isDuplicate = columns.some(c =>
      c.category.toUpperCase() === newColCat.toUpperCase() &&
      c.name.toLowerCase() === newColName.toLowerCase()
    );

    if (isDuplicate) {
      toast.error('Bu isimden bu kategoride zaten bir kayıt var.');
      return;
    }

    try {
      await axios.post(`${API_URL}/accessmatrix/columns`, {
        category: newColCat.toUpperCase(),
        name: newColName,
        displayOrder: 0
      });
      toast.success('Yeni sistem klasörü eklendi.');
      setNewColName('');
      setShowAddColumn(false);
      fetchData();
    } catch {
      toast.error('Klasör eklenemedi.');
    }
  };

  const handleDeleteColumn = (columnId, columnName, e) => {
    if (e) e.stopPropagation();
    console.log('Opening delete confirm for:', { columnId, columnName });
    setDeleteConfirm({ id: columnId, name: columnName });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      console.log(`Sending DELETE request to: ${API_URL}/accessmatrix/columns/${deleteConfirm.id}`);
      await axios.delete(`${API_URL}/accessmatrix/columns/${deleteConfirm.id}?t=${Date.now()}`);
      toast.success('Sistem/Klasör kaldırıldı.');
      setDeleteConfirm(null);
      await fetchData();
    } catch (err) {
      console.error('Delete error:', err);
      toast.error('Silme işlemi başarısız: ' + (err.response?.data || err.message));
    } finally {
      setDeleting(false);
    }
  };

  const handleGrantChange = async (personInfo, columnId, level) => {
    try {
      const payload = {
        personnelId: personInfo.id,
        accessColumnId: columnId,
        accessLevel: level
      };

      // Optimizasyon için UI'yi anında güncelle (Optimistic UI)
      setGrants(prev => {
        const copy = [...prev];
        const index = copy.findIndex(g => g.personnelId === personInfo.id && g.accessColumnId === columnId);

        if (level === "") {
          if (index > -1) copy.splice(index, 1);
        } else {
          if (index > -1) {
            copy[index].accessLevel = level;
          } else {
            copy.push({ personnelId: personInfo.id, accessColumnId: columnId, accessLevel: level });
          }
        }
        return copy;
      });

      await axios.post(`${API_URL}/accessmatrix/grants`, payload);
      toast.success('Yetki güncellendi.');
    } catch {
      toast.error('Yetki kaydedilirken hata oluştu.');
      fetchData(); // Hatadaysa geri al
    }
  };

  // Kategorilere göre Sütunları Grupla (Excel mantığı)
  const categories = [...new Set(columns.map(c => (c.category || 'DIĞER').trim().toUpperCase()))].sort();
  const companies = [...new Set(personnel.map(p => p.firma).filter(Boolean))].sort();

  const filteredPersonnel = personnel.filter(p => {
    if (selectedFirma && p.firma !== selectedFirma) return false;
    return p.adSoyad?.toLowerCase().includes(search.toLowerCase()) ||
           p.bolum?.toLowerCase().includes(search.toLowerCase());
  });

  // Bölüme göre grupla
  const groupedPersonnel = filteredPersonnel.reduce((acc, p) => {
    const dept = p.bolum || 'BÖLÜM BELİRTİLMEMİŞ';
    if (!acc[dept]) acc[dept] = [];
    acc[dept].push(p);
    return acc;
  }, {});

  const departments = Object.keys(groupedPersonnel).sort();

  return (
    <div className="page-container" style={{ padding: '20px', display: 'flex', flexDirection: 'column', height: '100vh', minWidth: 0 }}>
      <div className="page-header" style={{ marginBottom: 15, position: 'sticky', left: 0 }}>
        <div>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Network size={24} /> Erişim Yetki Matrisi
          </h2>
          <p>Tüm personellerin sistem ve klasör yetkilerini canlı matris formatında izleyin.</p>
        </div>
        <div className="header-actions">
          <select 
            className="form-control" 
            value={selectedFirma} 
            onChange={e => setSelectedFirma(e.target.value)}
            style={{ width: '200px', padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
          >
            <option value="">-- Firma Seçin --</option>
            {companies.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <div className="search-box">
            <Search size={18} />
            <input
              type="text"
              placeholder="Personel veya Bölüm Ara..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button className="btn btn-secondary" onClick={fetchData} title="Yenile">
            <RefreshCcw size={18} />
          </button>
          <button className="btn btn-primary" onClick={() => setShowAddColumn(true)}>
            <Plus size={18} /> Yeni Sistem / Klasör
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="segmented-control" style={{ marginBottom: '20px', maxWidth: '400px', flexShrink: 0 }}>
        <button 
          className="segmented-item" 
          onClick={() => navigate('/users')}
        >
          Kullanıcı Listesi
        </button>
        <button 
          className="segmented-item active" 
          onClick={() => navigate('/matrix')}
        >
          Erişim Yetkisi
        </button>
      </div>

      <div className="card" style={{ flex: 1, padding: 0, position: 'relative', display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0, borderBottom: 'none', borderRadius: '10px 10px 0 0' }}>
        {loading ? (
          <div className="loading-state" style={{ height: 400 }}>Yükleniyor...</div>
        ) : !selectedFirma ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
             <Network size={64} style={{ opacity: 0.2, marginBottom: 20 }} />
             <h3>Verileri Görüntülemek İçin Firma Seçiniz</h3>
             <p>Uzun render sürelerini önlemek için yetki matrisi firma bazlı çalışır.</p>
          </div>
        ) : (
          <div className="table-container matrix-table-container" style={{ flex: 1, overflowX: 'auto', overflowY: 'auto', width: '100%', border: 'none', paddingBottom: 15 }}>
            <table className="dense-table matrix-table" style={{ borderCollapse: 'separate', width: 'max-content !important', minWidth: '100%' }}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--bg-card)' }}>
                {/* Üst Kategori Başlıkları (Örn: PROJECT, HR vb.) */}
                <tr>
                  <th style={{ minWidth: 250, position: 'sticky', left: 0, top: 0, zIndex: 11, background: 'var(--bg-secondary)', borderRight: '2px solid var(--border-color)', borderBottom: '1px solid var(--border-color)' }}>
                    {/* Boş köşe */}
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', color: 'var(--text-muted)' }}>
                      <Key size={14} /> KİŞİLER / SİSTEMLER
                    </div>
                  </th>
                  {categories.map(cat => {
                    const count = columns.filter(c => (c.category || 'DIĞER').trim().toUpperCase() === cat).length;
                    const catBg = getCategoryColor(cat);
                    return (
                      <th key={cat} colSpan={count} style={{ 
                        textAlign: 'center', borderRight: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)', 
                        background: catBg !== 'transparent' ? catBg : 'var(--bg-secondary)', 
                        fontWeight: 900, fontSize: 12, letterSpacing: 1, position: 'sticky', top: 0, zIndex: 10, color: 'var(--text-primary)',
                        boxShadow: 'inset 0 -1px 0 var(--border-color)'
                      }}>
                        {cat}
                      </th>
                    )
                  })}
                </tr>
                {/* Alt Klasör / Sistem İsimleri Başlıkları */}
                <tr>
                  <th style={{ position: 'sticky', left: 0, top: 32, zIndex: 11, background: 'var(--bg-secondary)', borderRight: '2px solid var(--border-color)', borderBottom: '2px solid var(--border-color)' }}>
                    Personel Bilgileri
                  </th>
                  {categories.map(cat => (
                    columns.filter(c => (c.category || 'DIĞER').trim().toUpperCase() === cat).map((col) => {
                      const catBg = getCategoryColor(cat);
                      return (
                        <th key={col.id} title={col.name} style={{
                          padding: 0, height: 200, 
                          borderRight: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)', 
                          position: 'sticky', top: 32, zIndex: 9, minWidth: 32, maxWidth: 32,
                          background: catBg !== 'transparent' ? catBg : 'var(--bg-secondary)',
                          boxShadow: 'inset 0 -1px 0 var(--border-color)'
                        }}>
                          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', justifyContent: 'flex-start', alignItems: 'center', padding: '12px 0' }}>
                            <button
                              onClick={(e) => handleDeleteColumn(col.id, col.name, e)}
                              style={{
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid var(--border-color)',
                                color: 'var(--text-muted)',
                                cursor: 'pointer',
                                padding: '4px',
                                borderRadius: '4px',
                                marginBottom: 12,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                zIndex: 20,
                                position: 'relative',
                                flexShrink: 0
                              }}
                              className="delete-col-btn"
                              title="Sistemi Sil"
                            >
                              <Trash2 size={13} />
                            </button>
                            <div style={{ flex: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', width: '100%', overflow: 'hidden' }}>
                              <span style={{ 
                                writingMode: 'vertical-rl', transform: 'rotate(180deg)', textAlign: 'left', whiteSpace: 'nowrap', 
                                fontSize: 10, fontWeight: 800, color: 'var(--text-primary)', display: 'inline-block'
                              }}>
                                {col.name}
                              </span>
                            </div>
                          </div>
                        </th>
                      );
                    })
                  ))}
                </tr>
              </thead>
              <tbody>
                {departments.map(dept => (
                  <Fragment key={dept}>
                    {/* Bölüm Başlığı Satırı */}
                    <tr className="dept-group-header">
                      <td colSpan={columns.length + 1} style={{
                        background: 'rgba(255, 255, 255, 0.03)',
                        padding: '8px 15px',
                        fontWeight: 700,
                        fontSize: 12,
                        color: 'var(--accent-green)',
                        borderBottom: '1px solid var(--border-color)',
                        textAlign: 'left',
                        position: 'sticky',
                        left: 0
                      }}>
                        {dept.toUpperCase()} ({groupedPersonnel[dept].length})
                      </td>
                    </tr>

                    {groupedPersonnel[dept].map(person => (
                      <tr key={person.id} className="matrix-row">
                        <td style={{ position: 'sticky', left: 0, zIndex: 5, background: 'var(--bg-card)', borderRight: '2px solid var(--border-color)' }}>
                          <div style={{ fontWeight: 610, fontSize: 13 }}>{person.adSoyad}</div>
                          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{person.firma}</div>
                        </td>
                        {categories.map(cat => (
                          columns.filter(c => (c.category || 'DIĞER').trim().toUpperCase() === cat).map((col) => {
                            const cellGrant = grants.find(g => g.personnelId === person.id && g.accessColumnId === col.id);
                            const level = cellGrant ? cellGrant.accessLevel : '';
                            const catBg = getCategoryColor(cat);

                            let grantColor = 'transparent';
                            if (level === 'R') grantColor = 'rgba(56, 189, 248, 0.15)';
                            if (level === 'W') grantColor = 'rgba(250, 204, 21, 0.15)';
                            if (level === 'W/R' || level === 'R/W') grantColor = 'rgba(34, 197, 94, 0.15)';

                            // R/W gelirse W/R olarak göster

                            return (
                              <td key={col.id} style={{ 
                                textAlign: 'center', padding: 0, borderRight: '1px solid var(--border-color)', 
                                background: level ? grantColor : catBg, 
                                minWidth: 32, maxWidth: 32,
                                position: 'relative'
                              }}>
                                {!level && (
                                  <div style={{ 
                                    position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                                    fontSize: 8, color: 'var(--text-muted)', opacity: 0.3, pointerEvents: 'none',
                                    fontWeight: 700
                                  }}>X</div>
                                )}
                                <select
                                  className="matrix-select"
                                  value={level}
                                  onChange={(e) => handleGrantChange(person, col.id, e.target.value)}
                                  style={{ 
                                    width: '100%', height: '100%', border: 'none', background: 'transparent', 
                                    textAlign: 'center', cursor: 'pointer', outline: 'none', fontWeight: 600, 
                                    fontSize: 11, color: level ? 'var(--text-primary)' : 'transparent', 
                                    appearance: 'none', padding: '12px 0', position: 'relative', zIndex: 2
                                  }}
                                  title={`${person.adSoyad} -> ${col.name} yetkisi değiştir`}
                                >
                                  <option value=""></option>
                                  <option value="R">R</option>
                                  <option value="W">W</option>
                                  <option value="W/R">W/R</option>
                                </select>
                              </td>
                            );
                          })
                        ))}
                      </tr>
                    ))}
                  </Fragment>
                ))}

                {filteredPersonnel.length === 0 && (
                  <tr>
                    <td colSpan={columns.length + 1} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Sonuç bulunamadı...</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showAddColumn && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ marginBottom: 15 }}>Yeni Sistem / Klasör Ekle</h3>
            <form onSubmit={handleAddColumn}>
              <div className="form-group">
                <label>Kategori (Üst Başlık)</label>
                <input type="text" value={newColCat} onChange={e => setNewColCat(e.target.value)} className="form-input" placeholder="Örn: PROJECT, HR, SAP..." required />
              </div>
              <div className="form-group" style={{ marginTop: 15 }}>
                <label>Klasör / Sistem Adı (Zemin)</label>
                <input type="text" value={newColName} onChange={e => setNewColName(e.target.value)} className="form-input" placeholder="Örn: Analiz, Faturalar, Kaynak Kod..." required />
              </div>
              <div style={{ marginTop: 20, display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddColumn(false)}>İptal</button>
                <button type="submit" className="btn btn-primary">Ekle</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 400 }}>
            <h3 style={{ color: '#ff4d4d', marginBottom: 15 }}>Sistemi Sil</h3>
            <p><strong>"{deleteConfirm.name}"</strong> sistemini ve ona bağlı <strong>tüm kullanıcı yetkilerini</strong> silmek istediğinize emin misiniz?</p>
            <p style={{ fontSize: 12, marginTop: 10, color: 'var(--text-muted)' }}>Bu işlem geri alınamaz.</p>
            <div style={{ marginTop: 20, display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)} disabled={deleting}>Vazgeç</button>
              <button className="btn btn-primary" style={{ background: '#ff4d4d' }} onClick={confirmDelete} disabled={deleting}>
                {deleting ? 'Siliniyor...' : 'Evet, Kalıcı Olarak Sil'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Matrix Stilleri index.css içine eklenebilir ama scope için buraya ufak style atıyoruz */}
      <style>{`
        .matrix-table th { border-color: var(--border-color); }
        .matrix-table td { border-color: var(--border-color); }
        .matrix-table-container::-webkit-scrollbar { height: 14px; width: 10px; }
        .matrix-table-container::-webkit-scrollbar-track { background: var(--bg-secondary); border-radius: 7px; }
        .matrix-table-container::-webkit-scrollbar-thumb { 
          background: var(--accent-green); 
          border-radius: 7px; 
          border: 3px solid var(--bg-secondary);
          box-shadow: inset 0 0 5px rgba(0,0,0,0.2);
        }
        .matrix-table-container::-webkit-scrollbar-thumb:hover { background: var(--accent-green); }
        .matrix-table-container { 
          scrollbar-width: auto; 
          scrollbar-color: var(--accent-green) var(--bg-secondary); 
          border-radius: 0 0 10px 10px;
        }
        .matrix-row:hover td { filter: brightness(1.2); }
        .matrix-select option { background: var(--bg-card); color: var(--text-primary); }
        .matrix-select:hover { background: rgba(255,255,255,0.05) !important; color: var(--text-primary) !important; }
        .dept-group-header td { border-right: none !important; }
        .delete-col-btn { opacity: 0.5; transition: all 0.2s; background: rgba(0,0,0,0.2) !important; }
        .delete-col-btn:hover { opacity: 1; color: #ff4d4d !important; border-color: #ff4d4d !important; background: rgba(255, 77, 77, 0.1) !important; transform: rotate(180deg) scale(1.1) !important; }
      `}</style>
    </div>
  );
}
