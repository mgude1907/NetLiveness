import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, LabelList,
  PieChart, Pie, Cell
} from 'recharts';
import { 
  Plus, Edit2, Trash2, Save, X, DollarSign, PieChart as PieChartIcon, BarChart2, CircleCheck, TrendingUp
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api';

// Helper for currency formatting
const formatCurrency = (val) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(Math.round(val || 0));
const formatCurrencyEur = (val) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(Math.round(val || 0));
const formatPercent = (val) => new Intl.NumberFormat('tr-TR', { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(val || 0);

const MONTHS = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
const MONTH_KEYS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#64748b', '#10b981'];

export default function ItBudgetDashboard() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [euroRate, setEuroRate] = useState(38.50);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Edit / Add states
  const [editingItem, setEditingItem] = useState(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  
  const [showItemModal, setShowItemModal] = useState(false);
  const [activeCategoryId, setActiveCategoryId] = useState(null);
  const [newItemName, setNewItemName] = useState('');

  const fetchBudget = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/ItBudget/${year}`);
      setCategories(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Sunucu bağlantı hatası.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudget();
  }, [year]);

  useEffect(() => {
    fetch('https://api.exchangerate-api.com/v4/latest/EUR')
      .then(res => res.json())
      .then(data => {
        if (data && data.rates && data.rates.TRY) {
          setEuroRate(Number(data.rates.TRY.toFixed(2)));
        }
      })
      .catch(console.error);
  }, []);

  // Calculations
  const calculatedData = useMemo(() => {
    let grandTotal = 0;
    const monthlyTotals = Array(12).fill(0);
    const categoryTotals = {};

    categories.forEach(cat => {
      let catTotal = 0;
      cat.items.forEach(item => {
        MONTH_KEYS.forEach((mk, i) => {
          const val = Number(item[mk] || 0);
          monthlyTotals[i] += val;
          catTotal += val;
        });
      });
      categoryTotals[cat.id] = catTotal;
      grandTotal += catTotal;
    });

    return { grandTotal, monthlyTotals, categoryTotals };
  }, [categories]);

  const { grandTotal, monthlyTotals, categoryTotals } = calculatedData;

  // Chart Data
  const barChartData = MONTHS.map((m, i) => ({
    name: m,
    value: monthlyTotals[i]
  }));

  const pieChartData = categories.map((cat, i) => ({
    name: cat.name,
    value: categoryTotals[cat.id] || 0,
    color: COLORS[i % COLORS.length]
  })).filter(c => c.value > 0);

  // Handlers
  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCatName) return;
    try {
      await api.post('/ItBudget/category', { year, name: newCatName });
      toast.success("Kategori eklendi");
      setNewCatName('');
      setShowCategoryModal(false);
      fetchBudget();
    } catch (err) { toast.error("Hata oluştu"); }
  };

  const handleDeleteCategory = async (id) => {
    if(!window.confirm("Bu kategori ve altındaki tüm ögeler silinecek. Emin misiniz?")) return;
    try {
      await api.delete(`/ItBudget/category/${id}`);
      toast.success("Kategori silindi");
      fetchBudget();
    } catch (err) { toast.error("Hata"); }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!newItemName || !activeCategoryId) return;
    try {
      await api.post('/ItBudget/item', { categoryId: activeCategoryId, name: newItemName });
      toast.success("Kalem eklendi");
      setNewItemName('');
      setShowItemModal(false);
      fetchBudget();
    } catch (err) { toast.error("Hata"); }
  };

  const handleItemSave = async () => {
    if (!editingItem) return;
    try {
      await api.put(`/ItBudget/item/${editingItem.id}`, editingItem);
      toast.success("Kaydedildi");
      setEditingItem(null);
      fetchBudget();
    } catch (err) { toast.error("Hata"); }
  };

  const handleDeleteItem = async (id) => {
    if(!window.confirm("Emin misiniz?")) return;
    try {
      await api.delete(`/ItBudget/item/${id}`);
      toast.success("Silindi");
      fetchBudget();
    } catch (err) { toast.error("Hata"); }
  };

  return (
    <div className="page-container" style={{ maxWidth: '100vw' }}>
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2><DollarSign style={{ display: 'inline', verticalAlign: 'middle', marginRight: '8px' }} /> {year} Bilgi Teknolojileri Bütçesi</h2>
          <p className="text-muted">Yıllık BT planlaması ve gider takibi</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '2px 8px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)', marginRight: '6px' }}>Kur (€):</span>
            <input 
              type="number" 
              step="0.01" 
              value={euroRate} 
              onChange={(e) => setEuroRate(Number(e.target.value) || 0)} 
              style={{ width: '60px', background: 'transparent', border: 'none', color: 'var(--text-primary)', fontWeight: 'bold', outline: 'none' }}
              title="Sabit bütçe kuru girmek için değiştirebilirsiniz"
            />
          </div>
          <select 
            value={year} 
            onChange={(e) => setYear(Number(e.target.value))}
            className="form-input"
            style={{ width: '100px', textAlign: 'center', fontSize: '18px', fontWeight: 'bold' }}
          >
            {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button className="btn btn-primary" onClick={() => setShowCategoryModal(true)}>
            <Plus size={18} /> Yeni Gider Grubu
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: '20px', marginBottom: '20px' }}>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: 'linear-gradient(135deg, var(--card-bg) 0%, rgba(34, 197, 94, 0.05) 100%)', border: '1px solid var(--accent-green-dim)' }}>
          <h3 style={{ color: 'var(--text-secondary)', marginBottom: '8px' }}>Yıl İçi Giderler</h3>
          <h1 style={{ fontSize: '2.5rem', color: 'var(--accent-green)', margin: 0 }}>{formatCurrency(grandTotal)}</h1>
          <h4 style={{ color: 'var(--text-muted)', marginTop: '4px', fontSize: '1.2rem', fontWeight: 500 }}>
            {euroRate > 0 ? formatCurrencyEur(grandTotal / euroRate) : '-'}
          </h4>
        </div>
        
        <div className="card" style={{ padding: '20px' }}>
          <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}><BarChart2 size={18} /> Giderlerin Aylara Göre Dağılımı</h3>
          <div style={{ height: '120px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barChartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                <RechartsTooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)', borderRadius: '8px' }}
                  formatter={(value) => formatCurrency(value)}
                />
                <Bar dataKey="value" fill="var(--accent-red)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Category Breakdown (Pie) */}
      <div className="card" style={{ marginBottom: '20px', padding: '20px' }}>
        <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}><PieChartIcon size={18} /> Kategori Bazlı Dağılım</h3>
        {grandTotal > 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'center' }}>
            <div style={{ height: '160px', width: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={70} stroke="none">
                    {pieChartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                  <RechartsTooltip formatter={(value) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {pieChartData.map((entry, index) => (
                <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '12px', height: '12px', background: entry.color, borderRadius: '3px' }}></div>
                  <span style={{ flex: 1, fontSize: '13px' }}>{entry.name}</span>
                  <span style={{ fontWeight: 'bold' }}>{formatCurrency(entry.value)}</span>
                  <span style={{ color: 'var(--text-muted)', width: '60px', textAlign: 'right' }}>{formatPercent(entry.value / grandTotal)}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>Henüz veri yok.</div>
        )}
      </div>

      {/* Main Budget Grid */}
      <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
        <table className="data-table" style={{ borderCollapse: 'collapse', width: '100%', minWidth: '1200px' }}>
          <thead>
            <tr style={{ background: 'var(--bg-input)' }}>
              <th style={{ width: '250px', textAlign: 'left', padding: '12px' }}>GİDERLER</th>
              {MONTHS.map(m => <th key={m} style={{ textAlign: 'right', padding: '12px 6px', fontWeight: 'bold' }}>{m.toUpperCase()}</th>)}
              <th style={{ textAlign: 'right', padding: '12px', background: 'rgba(34, 197, 94, 0.1)', color: 'var(--accent-green)' }}>YIL TOPLAM</th>
              <th style={{ textAlign: 'right', padding: '12px' }}>% ORT</th>
              <th style={{ width: '60px' }}></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={16} style={{ textAlign: 'center', padding: '20px' }}>Yükleniyor...</td></tr>
            ) : categories.length === 0 ? (
              <tr><td colSpan={16} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Mevcut bütçe kalemi bulunmuyor. Yeni ekleyebilirsiniz.</td></tr>
            ) : (
              categories.map(cat => {
                const catTotal = categoryTotals[cat.id] || 0;
                
                return (
                  <React.Fragment key={cat.id}>
                    {/* Category Header Row */}
                    <tr style={{ background: 'var(--bg-input)', borderTop: '2px solid var(--border-color)', borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '8px 12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <TrendingUp size={16} style={{ color: 'var(--accent-green)' }} />
                        {cat.name}
                      </td>
                      {MONTH_KEYS.map((mk, i) => {
                        let colSum = 0;
                        cat.items.forEach(it => colSum += Number(it[mk] || 0));
                        return <td key={mk} style={{ textAlign: 'right', padding: '8px 6px', fontWeight: 'bold' }}>{colSum > 0 ? formatCurrency(colSum) : '-'}</td>;
                      })}
                      <td style={{ textAlign: 'right', padding: '8px 12px', fontWeight: 'bold', background: 'rgba(34, 197, 94, 0.05)', color: 'var(--accent-green)' }}>
                        {formatCurrency(catTotal)}
                      </td>
                      <td style={{ textAlign: 'right', padding: '8px 12px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>
                        {grandTotal > 0 ? formatPercent(catTotal / grandTotal) : '0%'}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                          <button className="icon-btn" title="Kalem Ekle" onClick={() => { setActiveCategoryId(cat.id); setShowItemModal(true); }}><Plus size={14} /></button>
                          <button className="icon-btn" title="Kategoriyi Sil" onClick={() => handleDeleteCategory(cat.id)}><Trash2 size={14} style={{ color: 'var(--accent-red)' }}/></button>
                        </div>
                      </td>
                    </tr>
                    
                    {/* Item Rows */}
                    {cat.items.map(item => {
                      const isEditing = editingItem?.id === item.id;
                      const currentItem = isEditing ? editingItem : item;
                      let itemTotal = 0;
                      MONTH_KEYS.forEach(mk => itemTotal += Number(currentItem[mk] || 0));

                      const handleNumberChange = (e, mk) => {
                        let val = e.target.value.replace(/[^0-9.]/g, '');
                        setEditingItem({ ...editingItem, [mk]: Number(val) || 0 });
                      };

                      return (
                        <tr key={item.id} style={{ borderBottom: '1px solid var(--border-color)', background: isEditing ? 'rgba(59, 130, 246, 0.1)' : 'transparent' }}>
                          <td style={{ padding: '8px 12px 8px 30px', color: 'var(--text-secondary)' }}>
                            {isEditing ? (
                              <input 
                                type="text" 
                                className="form-input" 
                                value={editingItem.name} 
                                onChange={e => setEditingItem({...editingItem, name: e.target.value})}
                                style={{ padding: '4px 8px', fontSize: '13px' }}
                              />
                            ) : item.name}
                          </td>
                          {MONTH_KEYS.map(mk => (
                            <td key={mk} style={{ textAlign: 'right', padding: '4px' }}>
                              {isEditing ? (
                                <input 
                                  type="text" 
                                  className="form-input"
                                  value={editingItem[mk] || ''}
                                  onChange={(e) => handleNumberChange(e, mk)}
                                  style={{ padding: '4px', textAlign: 'right', width: '100%', fontSize: '12px' }}
                                />
                              ) : (
                                <span style={{ color: item[mk] > 0 ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                                  {item[mk] > 0 ? new Intl.NumberFormat('tr-TR').format(Math.round(item[mk])) : '-'}
                                </span>
                              )}
                            </td>
                          ))}
                          <td style={{ textAlign: 'right', padding: '8px 12px', fontWeight: '600' }}>{formatCurrency(itemTotal)}</td>
                          <td style={{ textAlign: 'right', padding: '8px 12px', fontSize: '12px', color: 'var(--text-muted)' }}>
                            {catTotal > 0 ? formatPercent(itemTotal / catTotal) : '0%'}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            {isEditing ? (
                              <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                                <button className="icon-btn" onClick={handleItemSave} style={{ color: 'var(--accent-green)' }}><CircleCheck size={16} /></button>
                                <button className="icon-btn" onClick={() => setEditingItem(null)}><X size={16} /></button>
                              </div>
                            ) : (
                              <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', opacity: 0.5 }} className="row-actions">
                                <button className="icon-btn" onClick={() => setEditingItem({...item})}><Edit2 size={14} /></button>
                                <button className="icon-btn" onClick={() => handleDeleteItem(item.id)}><Trash2 size={14} style={{ color: 'var(--accent-red)' }}/></button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                );
              })
            )}
            
            {/* Global Final Tally Row */}
            {categories.length > 0 && (
              <>
                <tr style={{ background: 'var(--bg-card)', borderTop: '2px solid var(--accent-green)' }}>
                  <td style={{ padding: '16px 12px', fontWeight: 'bold' }}>TOPLAM GİDERLER (TRY)</td>
                  {monthlyTotals.map((mt, i) => (
                     <td key={i} style={{ textAlign: 'right', padding: '16px 6px', fontWeight: 'bold', color: 'var(--accent-green)' }}>
                       {mt > 0 ? formatCurrency(mt) : '-'}
                     </td>
                  ))}
                  <td style={{ textAlign: 'right', padding: '16px 12px', fontWeight: 'bold', background: 'var(--accent-green)', color: '#000', fontSize: '1.2rem' }}>
                    {formatCurrency(grandTotal)}
                  </td>
                  <td style={{ textAlign: 'right', padding: '16px 12px', fontWeight: 'bold' }}>100%</td>
                  <td></td>
                </tr>
                {euroRate > 0 && (
                  <tr style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 'bold', color: 'var(--accent-blue)', opacity: 0.9 }}>TOPLAM GİDERLER (EUR)</td>
                    {monthlyTotals.map((mt, i) => (
                       <td key={i} style={{ textAlign: 'right', padding: '10px 6px', fontWeight: '600', color: 'var(--accent-blue)', opacity: 0.9 }}>
                         {mt > 0 ? formatCurrencyEur(mt / euroRate) : '-'}
                       </td>
                    ))}
                    <td style={{ textAlign: 'right', padding: '10px 12px', fontWeight: 'bold', background: 'rgba(59, 130, 246, 0.1)', color: 'var(--accent-blue)', fontSize: '1.1rem' }}>
                      {formatCurrencyEur(grandTotal / euroRate)}
                    </td>
                    <td style={{ textAlign: 'right', padding: '10px 12px', fontWeight: 'bold', color: 'var(--accent-blue)', opacity: 0.9 }}>100%</td>
                    <td></td>
                  </tr>
                )}
              </>
            )}
          </tbody>
        </table>
      </div>

      {/* Category Modal */}
      {showCategoryModal && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '400px' }}>
            <h3>Yeni Gider Grubu</h3>
            <form onSubmit={handleAddCategory} style={{ marginTop: '20px' }}>
              <div className="form-group">
                <label>Grup Adı (Örn: PERSONEL GİDERLERİ)</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={newCatName} 
                  onChange={e => setNewCatName(e.target.value)} 
                  autoFocus 
                  required
                />
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Ekle</button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCategoryModal(false)}>İptal</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Item Modal */}
      {showItemModal && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '400px' }}>
            <h3>Yeni Bütçe Kalemi</h3>
            <form onSubmit={handleAddItem} style={{ marginTop: '20px' }}>
              <div className="form-group">
                <label>Kalem Adı (Örn: Maaşlar)</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={newItemName} 
                  onChange={e => setNewItemName(e.target.value)} 
                  autoFocus 
                  required
                />
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Ekle</button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowItemModal(false)}>İptal</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .row-actions { transition: opacity 0.2s; }
        tr:hover .row-actions { opacity: 1 !important; }
      `}</style>
    </div>
  );
}
