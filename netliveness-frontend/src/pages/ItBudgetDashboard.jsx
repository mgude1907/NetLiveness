import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, LabelList,
  PieChart, Pie, Cell
} from 'recharts';
import { 
  Plus, Edit2, Trash2, Save, X, DollarSign, PieChart as PieChartIcon, BarChart2, CircleCheck, TrendingUp, Activity, TriangleAlert, FileText, Download
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
      await api.delete(`/ItBudget/${id}`);
      toast.success("Silindi");
      fetchBudget();
    } catch (err) { toast.error("Hata"); }
  };

  const handleExportCSV = () => {
    if (!categories.length) return toast.error("Dışa aktarılacak veri bulunamadı.");
    
    // Header
    const headers = ['Gider Grubu', 'Bütçe Kalemi', ...MONTHS, 'Yıllık Toplam (TRY)', 'Pay (%)'];
    const rows = [];

    categories.forEach(cat => {
      // Group Summary Row
      const groupMonthly = MONTH_KEYS.map(mk => {
        let sum = 0; cat.items.forEach(it => sum += Number(it[mk] || 0)); return sum;
      });
      const catTotal = categoryTotals[cat.id] || 0;
      rows.push([cat.name, 'GRUP TOPLAMI', ...groupMonthly, catTotal, grandTotal > 0 ? (catTotal / grandTotal * 100).toFixed(1) + '%' : '0%']);

      // Detail Rows
      cat.items.forEach(item => {
        let itTotal = 0;
        const itMonthly = MONTH_KEYS.map(mk => {
          const val = Number(item[mk] || 0); itTotal += val; return val;
        });
        rows.push(['', item.name, ...itMonthly, itTotal, catTotal > 0 ? (itTotal / catTotal * 100).toFixed(1) + '%' : '0%']);
      });
      rows.push([]); // Empty line between groups
    });

    // Final Tally
    rows.push(['GENEL TOPLAM', '', ...monthlyTotals, grandTotal, '100%']);

    const csvContent = [
      headers.join(';'),
      ...rows.map(r => r.join(';'))
    ].join('\n');

    // Excel friendly BOM for Turkish characters
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${year}_IT_Butce_Raporu.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Bütçe raporu indiriliyor...");
  };

  return (
    <div className="page-body budget-dashboard" style={{ maxWidth: '100%', paddingBottom: 100 }}>
      {/* ─── Premium Header ─── */}
      <div className="glass-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, padding: '24px 32px', background: 'var(--bg-surface)', borderRadius: 24, border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
            <div className="icon-box-md icon-amber">
                <DollarSign size={20} color="var(--amber)" />
            </div>
            <h2 style={{ fontSize: 26, fontWeight: 900, margin: 0, letterSpacing: '-0.02em', color: 'var(--text-1)' }}>
              {year} Bilgi Teknolojileri Bütçesi
            </h2>
          </div>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-3)', fontWeight: 600 }}>Planlama, harcama takibi ve maliyet analizi merkezi</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
           {/* Currency Toggle / Rate */}
           <div className="cur-rate-card" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', background: 'var(--bg-inset)', borderRadius: 16, border: '1px solid var(--border)' }}>
              <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--blue-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 900, color: 'var(--blue-text)' }}>€</div>
               <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: 9, fontWeight: 800, color: 'var(--text-3)', textTransform: 'uppercase' }}>EUR/TRY Kuru</span>
                  <input 
                    type="number" 
                    step="0.01" 
                    value={euroRate} 
                    onChange={(e) => setEuroRate(Number(e.target.value) || 0)} 
                    style={{ background: 'none', border: 'none', color: 'var(--text-1)', fontWeight: 900, padding: 0, width: 60, fontSize: 14, outline: 'none' }}
                  />
               </div>
           </div>

           <select 
             value={year} 
             onChange={(e) => setYear(Number(e.target.value))}
             className="glass-select"
             style={{ height: 48, padding: '0 20px', borderRadius: 16, background: 'var(--bg-inset)', border: '1px solid var(--border)', fontWeight: 800, color: 'var(--text-1)' }}
           >
             {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y} Mali Yılı</option>)}
           </select>

           <button className="btn btn-secondary" onClick={handleExportCSV} style={{ height: 48, padding: '0 24px', borderRadius: 16, display: 'flex', alignItems: 'center', gap: 10, background: 'var(--bg-inset)', color: 'var(--text-1)', border: '1px solid var(--border)' }}>
              <FileText size={20} strokeWidth={2} /> <span style={{ fontWeight: 800 }}>DIŞA AKTAR</span>
           </button>

           <button className="btn btn-primary" onClick={() => setShowCategoryModal(true)} style={{ height: 48, padding: '0 24px', borderRadius: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
              <Plus size={20} strokeWidth={3} /> <span style={{ fontWeight: 800 }}>GRUP EKLE</span>
           </button>
        </div>
      </div>

      {/* ─── Summary Stat Cards ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, marginBottom: 32 }}>
          {/* Card 1: Total Budget TRY */}
          <div className="glass-card stat-card pulse-hover" style={{ padding: 24, background: 'var(--bg-surface)', borderRadius: 24, border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: -10, right: -10, width: 80, height: 80, borderRadius: '50%', background: 'var(--green-soft)', opacity: 0.2 }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--green)', fontSize: 11, fontWeight: 900, textTransform: 'uppercase', marginBottom: 12 }}>
                 <TrendingUp size={14} /> TOPLAM BÜTÇE (TRY)
              </div>
              <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--text-1)' }}>{formatCurrency(grandTotal)}</div>
              <div style={{ fontSize: 13, color: 'var(--text-3)', fontWeight: 600, marginTop: 4 }}>Aktif Planlanan Toplam</div>
          </div>

          {/* Card 2: Total Budget EUR */}
          <div className="glass-card stat-card pulse-hover" style={{ padding: 24, background: 'var(--bg-surface)', borderRadius: 24, border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: -10, right: -10, width: 80, height: 80, borderRadius: '50%', background: 'var(--blue-soft)', opacity: 0.2 }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--blue-text)', fontSize: 11, fontWeight: 900, textTransform: 'uppercase', marginBottom: 12 }}>
                 <PieChartIcon size={14} /> TOPLAM BÜTÇE (EUR)
              </div>
              <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--text-1)' }}>{formatCurrencyEur(grandTotal / euroRate)}</div>
              <div style={{ fontSize: 13, color: 'var(--text-3)', fontWeight: 600, marginTop: 4 }}>€ Sabit Kur Analizi</div>
          </div>

          {/* Card 3: Monthly Avg */}
          <div className="glass-card stat-card" style={{ padding: 24, background: 'var(--bg-surface)', borderRadius: 24, border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--amber)', fontSize: 11, fontWeight: 900, textTransform: 'uppercase', marginBottom: 12 }}>
                 <Activity size={14} /> AYLIK ORTALAMA
              </div>
              <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--text-1)' }}>{formatCurrency(grandTotal / 12)}</div>
              <div style={{ fontSize: 13, color: 'var(--text-3)', fontWeight: 600, marginTop: 4 }}>Yıl Boyu Aylık Tahmin</div>
          </div>

          {/* Card 4: Most Expensive */}
          <div className="glass-card stat-card" style={{ padding: 24, background: 'var(--bg-surface)', borderRadius: 24, border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--red)', fontSize: 11, fontWeight: 900, textTransform: 'uppercase', marginBottom: 12 }}>
                 <TriangleAlert size={14} /> EN BÜYÜK GİDER
              </div>
              <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--text-1)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {pieChartData.length > 0 ? pieChartData.sort((a,b) => b.value - a.value)[0].name : 'Veri Yok'}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-3)', fontWeight: 600, marginTop: 4 }}>En Yüksek Harcama Grubu</div>
          </div>
      </div>

      {/* ─── Analytics Panel (Charts) ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr', gap: 24, marginBottom: 32 }}>
          <div className="glass-card" style={{ padding: 28, background: 'var(--bg-surface)', borderRadius: 24, border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: 'var(--text-1)', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <BarChart2 size={18} color="var(--blue-text)" /> Aylık Harcama Akışı
                  </h3>
                  <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-3)', padding: '4px 10px', background: 'var(--bg-inset)', borderRadius: 8 }}>Milyon TRY</div>
              </div>
              <div style={{ height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barChartData}>
                    <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="var(--border)" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-3)', fontSize: 11, fontWeight: 700 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-3)', fontSize: 11, fontWeight: 700 }} tickFormatter={v => (v/1000).toFixed(0) + 'k'} />
                    <RechartsTooltip 
                      cursor={{ fill: 'var(--bg-inset)', radius: 8 }}
                      contentStyle={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)', borderRadius: '16px', boxShadow: 'var(--shadow-lg)' }}
                      formatter={(value) => [formatCurrency(value), 'Harcama']}
                    />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                        {barChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={index === new Date().getMonth() ? 'var(--amber)' : 'var(--blue-text)'} />
                        ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
          </div>

          <div className="glass-card" style={{ padding: 28, background: 'var(--bg-surface)', borderRadius: 24, border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
                <h3 style={{ margin: '0 0 24px 0', fontSize: 16, fontWeight: 900, color: 'var(--text-1)', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <PieChartIcon size={18} color="var(--amber)" /> Gider Dağılımı
                </h3>
                {grandTotal > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div style={{ height: '200px' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={pieChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} stroke="none">
                            {pieChartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                          </Pie>
                          <RechartsTooltip formatter={(value) => formatCurrency(value)} contentStyle={{ borderRadius: 12, border: 'none', boxShadow: 'var(--shadow-lg)' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: '180px', overflowY: 'auto', paddingRight: 8 }}>
                      {pieChartData.sort((a,b) => b.value - a.value).map((entry, index) => (
                        <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px', background: 'var(--bg-inset)', borderRadius: 12 }}>
                          <div style={{ width: '8px', height: '8px', background: entry.color, borderRadius: '50%' }}></div>
                          <span style={{ flex: 1, fontSize: '13px', fontWeight: 700, color: 'var(--text-1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{entry.name}</span>
                          <span style={{ fontWeight: 800, color: 'var(--text-2)', fontSize: 13 }}>{formatPercent(entry.value / grandTotal)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', color: 'var(--text-3)', padding: '60px 20px', fontWeight: 600 }}>Henüz bütçe verisi girilmemiş.</div>
                )}
          </div>
      </div>

      {/* ─── Main Budget Grid (Table) ─── */}
      <div className="glass-card" style={{ padding: 0, background: 'var(--bg-card)', borderRadius: 24, border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto', maxHeight: '700px' }}>
          <table className="budget-table" style={{ borderCollapse: 'separate', borderSpacing: 0, width: '100%', minWidth: '1500px' }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--bg-surface)' }}>
              <tr>
                <th style={{ width: 300, textAlign: 'left', padding: '20px 24px', fontSize: 13, fontWeight: 900, color: 'var(--text-3)', textTransform: 'uppercase', borderBottom: '2px solid var(--border)', background: 'var(--bg-surface)' }}>Gider Kalemleri</th>
                {MONTHS.map(m => (
                  <th key={m} style={{ textAlign: 'right', padding: '20px 12px', fontSize: 12, fontWeight: 900, color: 'var(--text-3)', borderBottom: '2px solid var(--border)', borderLeft: '1px solid var(--border-soft)', background: 'var(--bg-surface)' }}>{m.toUpperCase()}</th>
                ))}
                <th style={{ textAlign: 'right', padding: '20px 24px', fontSize: 13, fontWeight: 900, color: 'var(--green)', borderBottom: '2px solid var(--border)', borderLeft: '1px solid var(--border-soft)', background: 'var(--green-soft)', opacity: 0.9 }}>YILLIK TOPLAM</th>
                <th style={{ textAlign: 'right', padding: '20px 16px', fontSize: 13, fontWeight: 900, color: 'var(--text-3)', borderBottom: '2px solid var(--border)', borderLeft: '1px solid var(--border-soft)', background: 'var(--bg-surface)' }}>PAY (%)</th>
                <th style={{ width: 100, borderBottom: '2px solid var(--border)', background: 'var(--bg-surface)' }}></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={16} style={{ textAlign: 'center', padding: '100px', fontSize: 16, fontWeight: 700, color: 'var(--text-3)' }}>Veriler Hazırlanıyor...</td></tr>
              ) : categories.length === 0 ? (
                <tr><td colSpan={16} style={{ textAlign: 'center', padding: '100px', color: 'var(--text-3)' }}>Henüz bütçe kaydı oluşturulmadı. Başlamak için "Grup Ekle" butonunu kullanın.</td></tr>
              ) : (
                categories.map((cat, catIdx) => {
                  const catTotal = categoryTotals[cat.id] || 0;
                  
                  return (
                    <React.Fragment key={cat.id}>
                      {/* Category Header Row */}
                      <tr style={{ background: 'var(--bg-inset)', borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '16px 24px', fontWeight: 900, fontSize: 14, color: 'var(--text-1)', display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS[catIdx % COLORS.length] }}></div>
                          {cat.name}
                        </td>
                        {MONTH_KEYS.map((mk, i) => {
                          let colSum = 0;
                          cat.items.forEach(it => colSum += Number(it[mk] || 0));
                          return (
                            <td key={mk} style={{ textAlign: 'right', padding: '16px 12px', fontWeight: 800, fontSize: 13, color: 'var(--text-2)', borderLeft: '1px solid var(--border-soft)' }}>
                                {colSum > 0 ? formatCurrency(colSum) : '-'}
                            </td>
                          );
                        })}
                        <td style={{ textAlign: 'right', padding: '16px 24px', fontWeight: 900, fontSize: 14, color: 'var(--green)', background: 'var(--green-soft)', opacity: 0.8, borderLeft: '1px solid var(--border-soft)' }}>
                          {formatCurrency(catTotal)}
                        </td>
                        <td style={{ textAlign: 'right', padding: '16px 16px', fontWeight: 800, fontSize: 13, color: 'var(--text-3)', borderLeft: '1px solid var(--border-soft)' }}>
                          {grandTotal > 0 ? formatPercent(catTotal / grandTotal) : '0%'}
                        </td>
                        <td style={{ textAlign: 'center', borderLeft: '1px solid var(--border-soft)' }}>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                            <button className="icon-btn-glass" title="Alt Kalem Ekle" onClick={() => { setActiveCategoryId(cat.id); setShowItemModal(true); }}><Plus size={16} /></button>
                            <button className="icon-btn-glass" title="Grubu Sil" onClick={() => handleDeleteCategory(cat.id)}><Trash2 size={16} color="var(--red)" /></button>
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
                          <tr key={item.id} className="budget-row" style={{ borderBottom: '1px solid var(--border-soft)', background: isEditing ? 'var(--bg-inset)' : 'transparent', transition: 'all 0.2s' }}>
                            <td style={{ padding: '12px 24px 12px 52px', fontSize: 13, fontWeight: 600, color: 'var(--text-2)' }}>
                              {isEditing ? (
                                <input 
                                  type="text" 
                                  className="glass-input-sm" 
                                  value={editingItem.name} 
                                  onChange={e => setEditingItem({...editingItem, name: e.target.value})}
                                  style={{ width: '100%', padding: '6px 12px', fontSize: 13, borderRadius: 10 }}
                                />
                              ) : item.name}
                            </td>
                            {MONTH_KEYS.map(mk => (
                              <td key={mk} style={{ textAlign: 'right', padding: '8px 12px', borderLeft: '1px solid var(--border-soft)' }}>
                                {isEditing ? (
                                  <input 
                                    type="text" 
                                    className="glass-input-sm"
                                    value={editingItem[mk] || ''}
                                    onChange={(e) => handleNumberChange(e, mk)}
                                    style={{ textAlign: 'right', width: '100%', fontSize: 12, padding: '6px', borderRadius: 8 }}
                                  />
                                ) : (
                                  <span style={{ fontSize: 13, fontWeight: 600, color: item[mk] > 0 ? 'var(--text-1)' : 'var(--text-muted)' }}>
                                    {item[mk] > 0 ? new Intl.NumberFormat('tr-TR').format(Math.round(item[mk])) : '-'}
                                  </span>
                                )}
                              </td>
                            ))}
                            <td style={{ textAlign: 'right', padding: '12px 24px', fontWeight: 800, fontSize: 13, color: 'var(--text-2)', background: 'var(--bg-inset)', opacity: 0.5, borderLeft: '1px solid var(--border-soft)' }}>
                                {formatCurrency(itemTotal)}
                            </td>
                            <td style={{ textAlign: 'right', padding: '12px 16px', fontSize: 11, fontWeight: 700, color: 'var(--text-3)', borderLeft: '1px solid var(--border-soft)' }}>
                              {catTotal > 0 ? formatPercent(itemTotal / catTotal) : '0%'}
                            </td>
                            <td style={{ textAlign: 'center', borderLeft: '1px solid var(--border-soft)' }}>
                              {isEditing ? (
                                <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                                  <button className="icon-btn-action success" onClick={handleItemSave}><CircleCheck size={18} /></button>
                                  <button className="icon-btn-action" onClick={() => setEditingItem(null)}><X size={18} /></button>
                                </div>
                              ) : (
                                <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }} className="row-actions">
                                  <button className="icon-btn-glass sm" onClick={() => setEditingItem({...item})}><Edit2 size={13} /></button>
                                  <button className="icon-btn-glass sm" onClick={() => handleDeleteItem(item.id)}><Trash2 size={13} color="var(--red)" /></button>
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
            </tbody>
            {/* Global Final Tally Row */}
            {categories.length > 0 && (
              <tfoot style={{ position: 'sticky', bottom: 0, zIndex: 10, background: 'var(--bg-surface)' }}>
                <tr style={{ background: 'var(--bg-surface)', borderTop: '2px solid var(--green)' }}>
                  <td style={{ padding: '24px', fontWeight: 900, fontSize: 14, color: 'var(--text-1)' }}>YILLIK TOPLAM GİDER (TRY)</td>
                  {monthlyTotals.map((mt, i) => (
                     <td key={i} style={{ textAlign: 'right', padding: '24px 12px', fontWeight: 900, color: 'var(--green)', fontSize: 13, borderLeft: '1px solid var(--border-soft)' }}>
                       {mt > 0 ? formatCurrency(mt) : '-'}
                     </td>
                  ))}
                  <td style={{ textAlign: 'right', padding: '24px', fontWeight: 900, background: 'var(--green)', color: '#fff', fontSize: 18, borderLeft: '1px solid var(--border-soft)' }}>
                    {formatCurrency(grandTotal)}
                  </td>
                  <td style={{ textAlign: 'right', padding: '24px 16px', fontWeight: 900, fontSize: 13, color: 'var(--text-1)', borderLeft: '1px solid var(--border-soft)' }}>100%</td>
                  <td style={{ borderLeft: '1px solid var(--border-soft)' }}></td>
                </tr>
                {euroRate > 0 && (
                  <tr style={{ background: 'var(--bg-surface)', borderTop: '1px solid var(--border-soft)' }}>
                    <td style={{ padding: '16px 24px', fontWeight: 900, fontSize: 13, color: 'var(--blue-text)' }}>YILLIK TOPLAM GİDER (EUR)</td>
                    {monthlyTotals.map((mt, i) => (
                       <td key={i} style={{ textAlign: 'right', padding: '16px 12px', fontWeight: 800, color: 'var(--blue-text)', fontSize: 12, borderLeft: '1px solid var(--border-soft)', opacity: 0.8 }}>
                         {mt > 0 ? formatCurrencyEur(mt / euroRate) : '-'}
                       </td>
                    ))}
                    <td style={{ textAlign: 'right', padding: '16px 24px', fontWeight: 900, background: 'var(--blue-soft)', color: 'var(--blue-text)', fontSize: 16, borderLeft: '1px solid var(--border-soft)' }}>
                      {formatCurrencyEur(grandTotal / euroRate)}
                    </td>
                    <td style={{ textAlign: 'right', padding: '16px 16px', fontWeight: 900, fontSize: 12, color: 'var(--blue-text)', borderLeft: '1px solid var(--border-soft)', opacity: 0.8 }}>100%</td>
                    <td style={{ borderLeft: '1px solid var(--border-soft)' }}></td>
                  </tr>
                )}
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* ─── Category Modal ─── */}
      {showCategoryModal && (
        <div className="modal-overlay fade-in">
          <div className="glass-modal" style={{ maxWidth: '440px', background: 'var(--bg-surface)', borderRadius: 28, padding: 32, border: '1px solid var(--border)', boxShadow: 'var(--shadow-2xl)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: 'var(--text-1)' }}>Yeni Gider Grubu</h3>
                <button className="icon-btn-glass" onClick={() => setShowCategoryModal(false)}><X size={20} /></button>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 20, fontWeight: 600 }}>Bütçe kalemlerini toplu halde yönetmek için yeni bir kategori oluşturun.</p>
            <form onSubmit={handleAddCategory}>
              <div className="form-group" style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: 'var(--text-3)', marginBottom: 8, textTransform: 'uppercase' }}>Kategori Adı</label>
                <input 
                  type="text" 
                  className="glass-input" 
                  placeholder="Örn: DONANIM GİDERLERİ"
                  value={newCatName} 
                  onChange={e => setNewCatName(e.target.value)} 
                  autoFocus 
                  required
                  style={{ width: '100%', height: 52, borderRadius: 16, padding: '0 16px', fontSize: 14, fontWeight: 700, border: '1px solid var(--border)', background: 'var(--bg-inset)' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, height: 52, borderRadius: 16, fontWeight: 800 }}>OLUŞTUR</button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCategoryModal(false)} style={{ height: 52, borderRadius: 16, fontWeight: 800 }}>İPTAL</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Item Modal ─── */}
      {showItemModal && (
        <div className="modal-overlay fade-in">
          <div className="glass-modal" style={{ maxWidth: '440px', background: 'var(--bg-surface)', borderRadius: 28, padding: 32, border: '1px solid var(--border)', boxShadow: 'var(--shadow-2xl)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: 'var(--text-1)' }}>Yeni Bütçe Kalemi</h3>
                <button className="icon-btn-glass" onClick={() => setShowItemModal(false)}><X size={20} /></button>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 20, fontWeight: 600 }}>Seçili kategori altına yeni bir harcama kalemi ekleyin.</p>
            <form onSubmit={handleAddItem}>
              <div className="form-group" style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: 'var(--text-3)', marginBottom: 8, textTransform: 'uppercase' }}>Kalem Adı</label>
                <input 
                  type="text" 
                  className="glass-input" 
                  placeholder="Örn: Sunucu Lisansları"
                  value={newItemName} 
                  onChange={e => setNewItemName(e.target.value)} 
                  autoFocus 
                  required
                  style={{ width: '100%', height: 52, borderRadius: 16, padding: '0 16px', fontSize: 14, fontWeight: 700, border: '1px solid var(--border)', background: 'var(--bg-inset)' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, height: 52, borderRadius: 16, fontWeight: 800 }}>EKLE</button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowItemModal(false)} style={{ height: 52, borderRadius: 16, fontWeight: 800 }}>İPTAL</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .budget-dashboard { animation: fadeIn 0.4s ease-out; }
        .stat-card.pulse-hover:hover { transform: translateY(-4px); box-shadow: var(--shadow-lg); transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); }
        .budget-row:hover { background: var(--bg-inset) !important; }
        .row-actions { opacity: 0; transition: opacity 0.15s ease-in-out; }
        tr:hover .row-actions { opacity: 1; }
        
        .icon-btn-glass { width: 32, height: 32; borderRadius: 8px; border: 1px solid var(--border); background: var(--bg-inset); display: flex; alignItems: center; justifyContent: center; cursor: pointer; transition: all 0.15s; color: var(--text-2); }
        .icon-btn-glass:hover { background: var(--bg-surface); color: var(--text-1); transform: scale(1.05); }
        .icon-btn-glass.sm { width: 28px; height: 28px; }

        .icon-btn-action { width: 36px; height: 36px; borderRadius: 10px; border: 1px solid var(--border); background: var(--bg-surface); display: flex; alignItems: center; justifyContent: center; cursor: pointer; transition: all 0.2s; }
        .icon-btn-action:hover { transform: scale(1.1); box-shadow: var(--shadow-sm); }
        .icon-btn-action.success { color: var(--green); border-color: var(--green-soft); background: var(--green-soft); }

        .glass-input-sm { border: 1px solid var(--border); background: var(--bg-surface); color: var(--text-1); font-weight: 700; outline: none; transition: border-color 0.2s; }
        .glass-input-sm:focus { border-color: var(--blue-text); box-shadow: 0 0 0 3px var(--blue-soft); }
        
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
