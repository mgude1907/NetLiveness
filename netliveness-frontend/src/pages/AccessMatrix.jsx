import React, { useState, useEffect, Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Network, Plus, Search, CircleHelp, Key, RefreshCcw, Trash2, Edit2, ChevronDown, ChevronRight, Activity, ShieldCheck, Layers, Users, CircleDot } from 'lucide-react';
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

  // Sütun Düzenleme Modali
  const [showEditColumn, setShowEditColumn] = useState(false);
  const [editingColumn, setEditingColumn] = useState(null); // { id, category, name }

  // Sütun Silme Modali (Özel Confirm)
  const [deleteConfirm, setDeleteConfirm] = useState(null); // { id, name }
  const [deleting, setDeleting] = useState(false);

// const navigate = useNavigate();

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

  /* 
  const getCategoryColor = (cat) => {
    const normalized = (cat || '').trim().toUpperCase();
    if (normalized === 'PROJECT') return 'rgba(34, 197, 94, 0.15)'; // Darker Green
    if (normalized === 'DEPARTMENTS') return 'rgba(56, 189, 248, 0.15)'; // Darker Blue
    return 'transparent';
  };
  */

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

  const handleEditColumn = async (e) => {
    e.preventDefault();
    if (!editingColumn || !editingColumn.name) return;

    try {
      await axios.put(`${API_URL}/accessmatrix/columns/${editingColumn.id}`, {
        category: editingColumn.category.toUpperCase(),
        name: editingColumn.name
      });
      toast.success('Klasör güncellendi.');
      setShowEditColumn(false);
      fetchData();
    } catch {
      toast.error('Güncelleme yapılamadı.');
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
    <div className="page-body access-matrix" style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: 'calc(100vh - 20px)', 
      padding: '0 16px 12px 16px', 
      overflow: 'hidden',
      boxSizing: 'border-box'
    }}>
      {/* ─── Compact Modern Header ─── */}
      <div className="glass-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '12px 0 16px 0', padding: '16px 24px', background: 'var(--bg-surface)', borderRadius: 20, border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)', flexShrink: 0 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 2 }}>
            <div className="icon-box-sm icon-blue" style={{ width: 32, height: 32 }}>
                <ShieldCheck size={16} color="var(--blue-text)" />
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 900, margin: 0, letterSpacing: '-0.02em', color: 'var(--text-1)' }}>
              Erişim Yetki Matrisi
            </h2>
          </div>
          <p style={{ margin: 0, fontSize: 12, color: 'var(--text-3)', fontWeight: 600, opacity: 0.8 }}>Yetkilendirme Kontrol Paneli</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
           <div className="search-group" style={{ position: 'relative', width: 260 }}>
             <Search size={14} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
             <input
               type="text"
               placeholder="Personel veya Bölüm Ara..."
               value={search}
               onChange={e => setSearch(e.target.value)}
               style={{ width: '100%', height: 40, padding: '0 12px 0 38px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--bg-inset)', fontSize: 13, fontWeight: 700, color: 'var(--text-1)', outline: 'none' }}
               className="glass-input-search"
             />
           </div>

           <select 
             className="glass-select"
             value={selectedFirma} 
             onChange={e => setSelectedFirma(e.target.value)}
             style={{ height: 40, padding: '0 16px', borderRadius: 12, background: 'var(--bg-inset)', border: '1px solid var(--border)', fontWeight: 800, color: 'var(--text-1)', minWidth: 160, fontSize: 13 }}
           >
             <option value="">Firma Seçiniz</option>
             {companies.map(c => <option key={c} value={c}>{c}</option>)}
           </select>

           <button className="icon-btn-glass" onClick={fetchData} title="Yenile" style={{ width: 40, height: 40, borderRadius: 12 }}>
             <RefreshCcw size={16} />
           </button>

           <button className="btn btn-primary" onClick={() => setShowAddColumn(true)} style={{ height: 40, padding: '0 20px', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
              <Plus size={18} strokeWidth={3} /> <span style={{ fontWeight: 800 }}>DİZİN EKLE</span>
           </button>
        </div>
      </div>

      {/* ─── Compact Summary Stat Cards ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 16, flexShrink: 0 }}>
          <div className="glass-card stat-card" style={{ padding: '12px 16px', background: 'var(--bg-surface)', borderRadius: 16, border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ color: 'var(--blue-text)', fontSize: 10, fontWeight: 900, textTransform: 'uppercase', marginBottom: 2 }}>
                   PERSONEL
                </div>
                <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--text-1)' }}>{personnel.length}</div>
              </div>
              <Users size={20} color="var(--blue-text)" style={{ opacity: 0.2 }} />
          </div>
          <div className="glass-card stat-card" style={{ padding: '12px 16px', background: 'var(--bg-surface)', borderRadius: 16, border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ color: 'var(--amber)', fontSize: 10, fontWeight: 900, textTransform: 'uppercase', marginBottom: 2 }}>
                   DİZİNLER
                </div>
                <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--text-1)' }}>{columns.length}</div>
              </div>
              <Layers size={20} color="var(--amber)" style={{ opacity: 0.2 }} />
          </div>
          <div className="glass-card stat-card" style={{ padding: '12px 16px', background: 'var(--bg-surface)', borderRadius: 16, border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ color: 'var(--green)', fontSize: 10, fontWeight: 900, textTransform: 'uppercase', marginBottom: 2 }}>
                   YETKİLER
                </div>
                <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--text-1)' }}>{grants.length}</div>
              </div>
              <Activity size={20} color="var(--green)" style={{ opacity: 0.2 }} />
          </div>
          <div className="glass-card stat-card" style={{ padding: '12px 16px', background: 'var(--bg-surface)', borderRadius: 16, border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ color: 'var(--red)', fontSize: 10, fontWeight: 900, textTransform: 'uppercase', marginBottom: 2 }}>
                   FİRMALAR
                </div>
                <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--text-1)' }}>{companies.length}</div>
              </div>
              <CircleDot size={20} color="var(--red)" style={{ opacity: 0.2 }} />
          </div>
      </div>

      {/* Nav Tabs - REMOVED AS PER USER REQUEST */}

      <div className="card matrix-outer-card" style={{ 
        flex: 1, 
        padding: 0, 
        position: 'relative', 
        display: 'flex', 
        flexDirection: 'column', 
        overflow: 'hidden', 
        minWidth: 0, 
        minHeight: 0, // CRITICAL: Allows flex child to shrink/scroll
        border: '1px solid var(--border)', 
        borderRadius: 24, 
        background: 'var(--bg-surface)', 
        boxShadow: 'var(--shadow-xl)' 
      }}>
        {loading ? (
          <div className="loading-state" style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: 'var(--text-3)' }}>
             <Activity className="spin" style={{ marginRight: 10 }} /> Veriler Hazırlanıyor...
          </div>
        ) : !selectedFirma ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', background: 'linear-gradient(135deg, var(--bg-surface) 0%, var(--bg-inset) 100%)' }}>
             <div className="icon-box-xl" style={{ width: 120, height: 120, borderRadius: 40, background: 'var(--bg-inset)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24, border: '1px solid var(--border)' }}>
                <ShieldCheck size={48} color="var(--blue-text)" style={{ opacity: 0.5 }} />
             </div>
             <h3 style={{ fontSize: 22, fontWeight: 900, color: 'var(--text-1)', marginBottom: 8 }}>Matrix Görünümünü Başlatın</h3>
             <p style={{ maxWidth: 400, textAlign: 'center', color: 'var(--text-3)', fontWeight: 600 }}>Lütfen verileri görüntülemek istediğiniz firmayı yukarıdaki panelden seçiniz.</p>
          </div>
        ) : (
          <div className="matrix-scroll-area" style={{ 
            flex: 1, 
            overflow: 'auto', 
            borderRadius: 24,
            width: '100%',
            height: '100%',
            position: 'relative'
          }}>
            <table className="matrix-table-premium" style={{ borderCollapse: 'separate', borderSpacing: 0, width: 'max-content', minWidth: '100%' }}>
              <thead>
                {/* Category Header */}
                <tr>
                  <th style={{ minWidth: 280, position: 'sticky', left: 0, top: 0, zIndex: 100, background: 'var(--bg-surface)', borderRight: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-1)', fontWeight: 900, fontSize: 13, letterSpacing: 1 }}>
                       <Users size={16} color="var(--blue-text)" /> PERSONEL / SİSTEMLER
                    </div>
                  </th>
                  {categories.map(cat => {
                    const count = columns.filter(c => (c.category || 'DIĞER').trim().toUpperCase() === cat).length;
                    return (
                      <th key={cat} colSpan={count} style={{ 
                        textAlign: 'center', borderRight: '1px solid var(--border)', borderBottom: '1px solid var(--border)', 
                        background: 'var(--bg-surface)', fontWeight: 900, fontSize: 11, letterSpacing: 2, position: 'sticky', top: 0, zIndex: 50, color: 'var(--text-3)', padding: '12px 0', textTransform: 'uppercase'
                      }}>
                        {cat}
                      </th>
                    );
                  })}
                </tr>
                {/* Column Name Header */}
                <tr>
                  <th style={{ position: 'sticky', left: 0, top: 40, zIndex: 99, background: 'var(--bg-surface)', borderRight: '1px solid var(--border)', borderBottom: '2px solid var(--border)', padding: '12px 24px', textAlign: 'left', fontSize: 12, color: 'var(--text-3)' }}>
                    Personel Listesi
                  </th>
                  {categories.map(cat => (
                    columns.filter(c => (c.category || 'DIĞER').trim().toUpperCase() === cat).map((col) => (
                      <th key={col.id} className="matrix-col-header" style={{
                        padding: 0, height: 200, 
                        borderRight: '1px solid var(--border)', borderBottom: '2px solid var(--border)', 
                        position: 'sticky', top: 40, zIndex: 40, minWidth: 44, maxWidth: 44,
                        background: 'var(--bg-inset)'
                      }}>
                        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', gap: 8 }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <button
                                onClick={(e) => { e.stopPropagation(); setEditingColumn({ ...col }); setShowEditColumn(true); }}
                                className="col-action-btn edit"
                                title="İsim Düzenle"
                                style={{ width: 24, height: 24, borderRadius: 8, border: 'none', background: 'rgba(59, 130, 246, 0.1)', color: 'var(--blue-text)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}
                            >
                                <Edit2 size={12} strokeWidth={2.5} />
                            </button>
                            <button
                                onClick={(e) => handleDeleteColumn(col.id, col.name, e)}
                                className="col-action-btn delete"
                                title="Sistem Sil"
                                style={{ width: 24, height: 24, borderRadius: 8, border: 'none', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}
                            >
                                <Trash2 size={12} strokeWidth={2.5} />
                            </button>
                          </div>
                          <div style={{ flex: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', overflow: 'hidden' }}>
                            <span style={{ 
                              writingMode: 'vertical-rl', transform: 'rotate(180deg)', textAlign: 'left', whiteSpace: 'nowrap', 
                              fontSize: 11, fontWeight: 900, color: 'var(--text-1)', padding: '10px 0'
                            }}>
                              {col.name}
                            </span>
                          </div>
                        </div>
                      </th>
                    ))
                  ))}
                </tr>
              </thead>
              <tbody>
                {departments.map(dept => (
                  <Fragment key={dept}>
                    {/* Dept Group Row */}
                    <tr>
                      <td colSpan={columns.length + 1} style={{
                        background: 'var(--bg-inset)', padding: '10px 24px', fontWeight: 900, fontSize: 11, color: 'var(--blue-text)', letterSpacing: 1, borderBottom: '1px solid var(--border)', position: 'sticky', left: 0, zIndex: 60
                      }}>
                        {dept.toUpperCase()} ({groupedPersonnel[dept].length})
                      </td>
                    </tr>

                    {groupedPersonnel[dept].map(person => (
                      <tr key={person.id} className="matrix-row-premium">
                        <td style={{ position: 'sticky', left: 0, zIndex: 30, background: 'var(--bg-surface)', borderRight: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '12px 24px' }}>
                          <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--text-1)', marginBottom: 2 }}>{person.adSoyad}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600 }}>{person.firma}</div>
                        </td>
                        {categories.map(cat => (
                          columns.filter(c => (c.category || 'DIĞER').trim().toUpperCase() === cat).map((col) => {
                            const cellGrant = grants.find(g => g.personnelId === person.id && g.accessColumnId === col.id);
                            const level = cellGrant ? cellGrant.accessLevel : '';

                            return (
                              <td key={col.id} className="matrix-cell" style={{ 
                                textAlign: 'center', padding: '6px', borderRight: '1px solid var(--border)', borderBottom: '1px solid var(--border)', 
                                minWidth: 44, maxWidth: 44, position: 'relative'
                              }}>
                                <div className={`grant-badge ${level || 'none'}`} onClick={() => {
                                    // Cyclic change: "" -> "R" -> "W" -> "W/R" -> ""
                                    let next = "";
                                    if(!level) next = "R";
                                    else if(level === "R") next = "W";
                                    else if(level === "W") next = "W/R";
                                    else next = "";
                                    handleGrantChange(person, col.id, next);
                                }}>
                                   {level || ''}
                                </div>
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
                    <td colSpan={columns.length + 1} style={{ textAlign: 'center', padding: 40, color: 'var(--text-3)', fontWeight: 700 }}>Sonuç bulunamadı...</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showEditColumn && editingColumn && (
        <div className="modal-overlay glass-modal">
          <div className="modal-content" style={{ borderRadius: 32, padding: 40, width: 500, border: '1px solid var(--border)', boxShadow: 'var(--shadow-2xl)' }}>
            <div style={{ marginBottom: 32 }}>
              <div className="icon-box-lg icon-blue" style={{ marginBottom: 20 }}>
                <Edit2 size={24} color="var(--blue-text)" />
              </div>
              <h3 style={{ fontSize: 24, fontWeight: 900, margin: '0 0 8px 0', color: 'var(--text-1)' }}>Dizini Düzenle</h3>
              <p style={{ margin: 0, color: 'var(--text-3)', fontWeight: 600 }}>Dizin ismini veya kategorisini güncelleyin.</p>
            </div>
            
            <form onSubmit={handleEditColumn}>
              <div className="form-group" style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', marginBottom: 10, fontSize: 12, fontWeight: 800, color: 'var(--text-2)', textTransform: 'uppercase' }}>Kategori (Üst Başlık)</label>
                <input type="text" value={editingColumn.category} onChange={e => setEditingColumn({...editingColumn, category: e.target.value})} className="glass-input" required 
                  style={{ width: '100%', height: 52, padding: '0 20px', borderRadius: 16, border: '1px solid var(--border)', background: 'var(--bg-inset)', fontWeight: 700, color: 'var(--text-1)' }}
                />
              </div>
              <div className="form-group" style={{ marginBottom: 32 }}>
                <label style={{ display: 'block', marginBottom: 10, fontSize: 12, fontWeight: 800, color: 'var(--text-2)', textTransform: 'uppercase' }}>Klasör / Sistem Adı</label>
                <input type="text" value={editingColumn.name} onChange={e => setEditingColumn({...editingColumn, name: e.target.value})} className="glass-input" required
                  style={{ width: '100%', height: 52, padding: '0 20px', borderRadius: 16, border: '1px solid var(--border)', background: 'var(--bg-inset)', fontWeight: 700, color: 'var(--text-1)' }}
                />
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowEditColumn(false)} style={{ height: 48, padding: '0 32px', borderRadius: 16, fontWeight: 800 }}>İptal</button>
                <button type="submit" className="btn btn-primary" style={{ height: 48, padding: '0 32px', borderRadius: 16, fontWeight: 800 }}>Değişiklikleri Kaydet</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {showAddColumn && (
        <div className="modal-overlay glass-modal">
          <div className="modal-content" style={{ borderRadius: 32, padding: 40, width: 500, border: '1px solid var(--border)', boxShadow: 'var(--shadow-2xl)' }}>
            <div style={{ marginBottom: 32 }}>
              <div className="icon-box-lg icon-blue" style={{ marginBottom: 20 }}>
                <Plus size={24} color="var(--blue-text)" />
              </div>
              <h3 style={{ fontSize: 24, fontWeight: 900, margin: '0 0 8px 0', color: 'var(--text-1)' }}>Dizin Ekle</h3>
              <p style={{ margin: 0, color: 'var(--text-3)', fontWeight: 600 }}>Sistem üzerinde yeni bir klasör veya sistem yetki alanı oluşturun.</p>
            </div>
            
            <form onSubmit={handleAddColumn}>
              <div className="form-group" style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', marginBottom: 10, fontSize: 12, fontWeight: 800, color: 'var(--text-2)', textTransform: 'uppercase' }}>Kategori (Üst Başlık)</label>
                <input type="text" value={newColCat} onChange={e => setNewColCat(e.target.value)} className="glass-input" placeholder="Örn: PROJECT, HR, SAP..." required 
                  style={{ width: '100%', height: 52, padding: '0 20px', borderRadius: 16, border: '1px solid var(--border)', background: 'var(--bg-inset)', fontWeight: 700, color: 'var(--text-1)' }}
                />
              </div>
              <div className="form-group" style={{ marginBottom: 32 }}>
                <label style={{ display: 'block', marginBottom: 10, fontSize: 12, fontWeight: 800, color: 'var(--text-2)', textTransform: 'uppercase' }}>Klasör / Sistem Adı</label>
                <input type="text" value={newColName} onChange={e => setNewColName(e.target.value)} className="glass-input" placeholder="Örn: Analiz, Faturalar..." required
                  style={{ width: '100%', height: 52, padding: '0 20px', borderRadius: 16, border: '1px solid var(--border)', background: 'var(--bg-inset)', fontWeight: 700, color: 'var(--text-1)' }}
                />
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddColumn(false)} style={{ height: 48, padding: '0 32px', borderRadius: 16, fontWeight: 800 }}>İptal</button>
                <button type="submit" className="btn btn-primary" style={{ height: 48, padding: '0 32px', borderRadius: 16, fontWeight: 800 }}>Dizin Oluştur</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="modal-overlay glass-modal">
          <div className="modal-content" style={{ borderRadius: 32, padding: 40, width: 450, border: '1px solid var(--border)', boxShadow: 'var(--shadow-2xl)' }}>
             <div style={{ marginBottom: 32, textAlign: 'center' }}>
                <div className="icon-box-lg icon-red" style={{ margin: '0 auto 20px auto' }}>
                  <Trash2 size={24} color="var(--red)" />
                </div>
                <h3 style={{ fontSize: 22, fontWeight: 900, color: 'var(--text-1)', marginBottom: 12 }}>Dizini Sil</h3>
                <p style={{ color: 'var(--text-3)', fontWeight: 600, lineHeight: 1.5 }}>
                  <strong>&quot;{deleteConfirm.name}&quot;</strong> dizini ve bağlı tüm kullanıcı yetkileri kalıcı olarak silinecek. Emin misiniz?
                </p>
             </div>
             <div style={{ display: 'flex', gap: 12 }}>
                <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)} disabled={deleting} style={{ flex: 1, height: 48, borderRadius: 14, fontWeight: 800 }}>Vazgeç</button>
                <button className="btn btn-primary" style={{ flex: 1, height: 48, borderRadius: 14, fontWeight: 800, background: '#ef4444' }} onClick={confirmDelete} disabled={deleting}>
                  {deleting ? 'Siliniyor...' : 'Evet, Sil'}
                </button>
             </div>
          </div>
        </div>
      )}

      {/* ─── Premium Matrix Styles ─── */}
      <style>{`
        /* High-Visibility Manuel Scrollbars */
        .matrix-scroll-area::-webkit-scrollbar { width: 18px; height: 18px; }
        .matrix-scroll-area::-webkit-scrollbar-track { background: var(--bg-inset); border-radius: 4px; box-shadow: inset 0 0 6px rgba(0,0,0,0.1); }
        .matrix-scroll-area::-webkit-scrollbar-thumb { 
          background: var(--blue-text); 
          border-radius: 4px; 
          border: 2px solid var(--bg-inset); 
          box-shadow: 0 0 10px rgba(59, 130, 246, 0.3);
          cursor: grab;
        }
        .matrix-scroll-area::-webkit-scrollbar-thumb:active { background: var(--blue-dark); cursor: grabbing; }
        .matrix-scroll-area::-webkit-scrollbar-thumb:hover { background: var(--blue-dark); filter: brightness(1.2); }
        
        /* Ensure the table doesn't get squashed */
        .matrix-table-premium {
          table-layout: auto;
        }

        .matrix-row-premium:hover td { background: var(--bg-inset) !important; }
        .matrix-row-premium:hover td:first-child { background: var(--bg-surface) !important; }

        /* Cross-hair logic */
        .matrix-table-premium tr:hover td { background: rgba(59, 130, 246, 0.03) !important; }
        .matrix-cell:hover::after { content: ''; position: absolute; left: 0; right: 0; top: -10000px; bottom: -10000px; background: rgba(59, 130, 246, 0.03); pointer-events: none; z-index: 10; }

        .grant-badge {
          width: 32px; height: 32px; margin: 0 auto; border-radius: 10px;
          display: flex; alignItems: center; justifyContent: center;
          font-size: 11px; fontWeight: 900; cursor: pointer;
          transition: all 0.2s; user-select: none;
          background: var(--bg-surface); border: 1.5px dashed var(--border); color: var(--text-3); opacity: 0.3;
        }
        .grant-badge:hover { transform: scale(1.1); filter: brightness(1.1); opacity: 1; border-style: solid; }
        
        .grant-badge.R { background: rgba(59, 130, 246, 0.1); border: 1.5px solid rgba(59, 130, 246, 0.4); color: var(--blue-text); opacity: 1; }
        .grant-badge.W { background: rgba(245, 158, 11, 0.1); border: 1.5px solid rgba(245, 158, 11, 0.4); color: var(--amber); opacity: 1; }
        .grant-badge.W\\/R { background: rgba(16, 185, 129, 0.1); border: 1.5px solid rgba(16, 185, 129, 0.4); color: var(--green); opacity: 1; }

        .col-action-btn:hover.edit { background: var(--blue-text) !important; color: white !important; transform: scale(1.1); }
        .col-action-btn:hover.delete { background: #ef4444 !important; color: white !important; transform: scale(1.1); }
      `}</style>
    </div>
  );
}
