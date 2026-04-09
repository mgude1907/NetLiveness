import { useState, useEffect, useCallback } from 'react';
import {
  getStock, createStock, updateStock, deleteStock,
  getInventory, createInventory, updateInventory, deleteInventory,
  getPersonnel, createTerminal,
  getLicenses, createLicense, updateLicense, deleteLicense
} from '../api';
import { Plus, Search, Pencil, Trash2, X, Package, ArrowRightLeft, ShieldCheck, UserCheck, AlertTriangle, Boxes, Monitor, Phone, Tablet, Printer, Wifi } from 'lucide-react';
import toast from 'react-hot-toast';

const CATEGORIES = ['Bilgisayar', 'Monitör', 'Yazıcı', 'Telefon', 'Tablet', 'Ağ Cihazı', 'Diğer'];
const STATUSES   = ['Sağlam', 'Arızalı', 'Tamir Bekliyor'];
const ENVANTER_TYPES = ['Personel Envanteri', 'Şirket Envanteri'];

const CATEGORY_MODELS = {
  'Bilgisayar': {
    'Apple': ['MacBook Air M3', 'MacBook Air M4', 'MacBook Pro 14"', 'MacBook Pro 16"'],
    'Dell': ['XPS 13', 'XPS 15', 'Latitude 5440', 'Latitude 7440', 'Latitude 9440', 'Vostro 3520', 'Precision 3581'],
    'HP': ['Spectre x360', 'Envy x360', 'EliteBook 840 G10', 'EliteBook 1040 G10', 'ProBook 450 G10'],
    'Lenovo': ['ThinkPad X1 Carbon', 'ThinkPad T14', 'ThinkPad L14', 'Yoga 9i', 'Legion Pro 7i', 'ThinkBook 16'],
    'Asus': ['Zenbook 14 OLED', 'Vivobook 16', 'ROG Zephyrus G14', 'ExpertBook B5'],
    'Huawei': ['MateBook X Pro', 'MateBook 14', 'MateBook D16'],
    'Xiaomi': ['RedmiBook Pro 15', 'RedmiBook Pro 16']
  },
  'Tablet': {
    'Apple': ['iPad Pro', 'iPad Air', 'iPad Mini', 'iPad (10th Gen)'],
    'Samsung': ['Galaxy Tab S9 Ultra', 'Galaxy Tab S9', 'Galaxy Tab S9 FE', 'Galaxy Tab A9'],
    'Huawei': ['MatePad Pro', 'MatePad Air', 'MatePad 11.5']
  },
  'Telefon': {
    'Apple': ['iPhone 16 Pro Max', 'iPhone 16 Pro', 'iPhone 16', 'iPhone 15', 'iPhone 14'],
    'Samsung': ['Galaxy S24 Ultra', 'Galaxy S24+', 'Galaxy S24', 'Galaxy S23 FE', 'Galaxy A55', 'Galaxy A35'],
    'Huawei': ['Pura 70 Ultra', 'Mate 60 Pro', 'Nova 12'],
    'Xiaomi': ['Xiaomi 14 Ultra', 'Xiaomi 14', 'Xiaomi 13T Pro', 'Redmi Note 13 Pro'],
    'Asus': ['ROG Phone 8 Pro', 'Zenfone 11 Ultra']
  },
  'Monitör': {
    'Dell': ['UltraSharp U2724DE', 'UltraSharp U3225QE', 'UltraSharp U2422H', 'G2724D', 'P2422H', 'P2722H'],
    'Samsung': ['Odyssey OLED G8', 'Odyssey Neo G9', 'ViewFinity S8', 'Smart Monitor M8'],
    'LG': ['UltraGear 32GS95UE', 'UltraGear 27GN950', '27UP850-W', '34WP65G-B'],
    'HP': ['Series 7 Pro 734pm', 'M27fwa', 'E24 G4', 'E27 G4'],
    'Asus': ['ROG Swift PG32UCDM', 'ProArt PA279CRV', 'TUF Gaming VG27AQ']
  },
  'Yazıcı': {
    'HP': ['LaserJet Pro M283fdw', 'LaserJet M209d', 'OfficeJet Pro 9125e', 'Smart Tank 5101'],
    'Canon': ['imageCLASS MF655Cdw', 'Pixma TR8620', 'Pixma G3270', 'LBP623Cdw'],
    'Brother': ['MFC-L2750DW', 'HL-L2390DW', 'MFC-J4535DW', 'HL-L3300CDW'],
    'Epson': ['EcoTank ET-4850', 'EcoTank ET-5850', 'EcoTank ET-2800'],
    'Zebra': ['ZD421', 'ZD411', 'ZD621', 'ZT231', 'ZT411']
  },
  'Ağ Cihazı': {
    'Cisco': ['Catalyst 9200', 'Catalyst 9300', 'Meraki MS120', 'ISR 4331'],
    'Aruba': ['Instant On 1930', 'AOS-CX 6000', 'AP-515'],
    'Ubiquiti': ['UniFi Dream Machine', 'UniFi Switch Pro', 'UniFi 6 Pro AP'],
    'TP-Link': ['Omada SG3428', 'Omada EAP660'],
    'MikroTik': ['RB5009', 'CCR2004', 'hAP ax3']
  }
};

const emptyStock = { 
  category: 'Bilgisayar', brand: '', model: '', serialNo: '', pcIsmi: '', status: 'Sağlam', 
  envanterTuru: 'Personel Envanteri', addToMonitoring: false, monitorHost: '' 
};

const emptyLicense = {
  softwareName: '', licenseKey: '', licenseType: 'Retail', expirationDate: '', assignedTo: '', notes: ''
};

export default function StockInventory() {
  const [tab, setTab]               = useState('stock'); // stock | inventory | licenses
  const [stock, setStock]           = useState([]);
  const [inventory, setInventory]   = useState([]);
  const [licenses, setLicenses]     = useState([]);
  const [personnel, setPersonnel]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [catFilter, setCatFilter]   = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const [modal, setModal]   = useState(false);
  const [form, setForm]     = useState(emptyStock);
  const [editId, setEditId] = useState(null);

  const [assignModal, setAssignModal] = useState(false);
  const [assignItem, setAssignItem]   = useState(null);
  const [assignTo, setAssignTo]       = useState('');
  const [searchPerson, setSearchPerson] = useState('');

  const [confModal, setConfModal] = useState(null); // { title, msg, onConfirm, color }
  const [deleting, setDeleting]   = useState(false);

  const load = useCallback(async () => {
    try {
      const [s, i, p, l] = await Promise.all([getStock(), getInventory(), getPersonnel(), getLicenses()]);
      setStock(s || []); setInventory(i || []); setPersonnel(p || []); setLicenses(l || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const items = tab === 'stock' ? stock : (tab === 'inventory' ? inventory : licenses);
  const filtered = items.filter(item => {
    const q = search.toLowerCase();
    
    if (tab === 'licenses') {
      return !q || 
        item.softwareName?.toLowerCase()?.includes(q) || 
        item.licenseKey?.toLowerCase()?.includes(q) || 
        item.assignedTo?.toLowerCase()?.includes(q);
    }

    const matchSearch = !q || 
      item.brand?.toLowerCase()?.includes(q) || 
      item.model?.toLowerCase()?.includes(q) || 
      item.serialNo?.toLowerCase()?.includes(q) || 
      item.pcIsmi?.toLowerCase()?.includes(q);
    const matchCat = !catFilter || item.category === catFilter;
    const matchType = !typeFilter || item.envanterTuru === typeFilter;
    return matchSearch && matchCat && matchType;
  });

  // summaries
  const totalAssets = stock.length + inventory.length;
  const stockCount = stock.length;
  const inventoryCount = inventory.length;
  const expiredLicenses = licenses.filter(l => l.expirationDate && new Date(l.expirationDate) < new Date()).length;
  const assignmentRate = totalAssets > 0 ? Math.round((inventoryCount / totalAssets) * 100) : 0;
  
  const catSummary = {};
  [...stock, ...inventory].forEach(i => { catSummary[i.category] = (catSummary[i.category] || 0) + 1; });

  const setValue = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const openNew = () => { 
    setForm(tab === 'licenses' ? emptyLicense : emptyStock); 
    setEditId(null); 
    setModal(true); 
  };
  const openEdit = (item) => {
    if (tab === 'licenses') {
      setForm({ ...item, expirationDate: item.expirationDate ? item.expirationDate.split('T')[0] : '' });
    } else {
      setForm({
        category: item.category, brand: item.brand, model: item.model, serialNo: item.serialNo,
        pcIsmi: item.pcIsmi, status: item.status || 'Sağlam', envanterTuru: item.envanterTuru
      });
    }
    setEditId(item.id); setModal(true);
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    
    // Duplication Check
    const allItems = [...stock, ...inventory];
    const isEditing = !!editId;
    
    // Check Serial Number (if provided)
    if (form.serialNo) {
      const serialDuplicate = allItems.find(item => 
        item.serialNo?.trim().toLowerCase() === form.serialNo.trim().toLowerCase() && 
        (!isEditing || item.id !== editId)
      );
      if (serialDuplicate) {
        toast.error(`Bu Seri No (${form.serialNo}) zaten kayıtlı!`);
        return;
      }
    }

    // Check PC Name (if provided)
    if (form.pcIsmi) {
      const pcNameDuplicate = allItems.find(item => 
        item.pcIsmi?.trim().toLowerCase() === form.pcIsmi.trim().toLowerCase() && 
        (!isEditing || item.id !== editId)
      );
      if (pcNameDuplicate) {
        toast.error(`Bu PC İsmi (${form.pcIsmi}) zaten kayıtlı!`);
        return;
      }
    }

    try {
      if (editId) {
        if (tab === 'stock') await updateStock(editId, form);
        else if (tab === 'inventory') await updateInventory(editId, form);
        else await updateLicense(editId, form);
        toast.success('Kayıt güncellendi.');
      } else {
        if (tab === 'licenses') {
          await createLicense(form);
          toast.success('Yeni lisans eklendi.');
        } else {
          await createStock(form);
          
          // Auto-add to Monitoring if selected
          if (form.addToMonitoring && form.monitorHost) {
            try {
              await createTerminal({
                name: form.pcIsmi || `${form.brand} ${form.model}`,
                host: form.monitorHost,
                deviceType: form.category === 'Bilgisayar' ? 'PC' : (form.category === 'Ağ Cihazı' ? 'Switch' : 'Other'),
                description: `Stoktan otomatik eklendi (${form.serialNo})`,
                company: 'Merkez',
                location: 'Stok'
              });
              toast.success('Cihaz ağ izleme listesine de eklendi.');
            } catch (监控Error) {
              console.error('Monitoring sync failed:', 监控Error);
              toast.error('Cihaz stoklara eklendi ama ağ izlemeye eklenirken hata oluştu.');
            }
          }
          toast.success('Yeni stok eklendi.');
        }
      }
      setModal(false); load();
    } catch (e) {
      console.error(e);
      toast.error('İşlem başarısız oldu.');
    }
  };

  const handleDelete = async (id) => {
    setConfModal({
      title: 'Kaydı Sil',
      msg: 'Bu kaydı kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz.',
      color: '#ff4d4d',
      onConfirm: async () => {
        setDeleting(true);
        try {
          if (tab === 'stock') await deleteStock(id);
          else if (tab === 'inventory') await deleteInventory(id);
          else await deleteLicense(id);
          toast.success('Kayıt silindi.');
          setConfModal(null);
          load();
        } catch (e) {
          console.error(e);
          toast.error('Silme işlemi başarısız oldu.');
        } finally {
          setDeleting(false);
        }
      }
    });
  };

  // Assign stock item to personnel (move to inventory)
  const openAssign = (item) => { 
    setAssignItem(item); 
    setAssignTo(''); 
    setSearchPerson('');
    setAssignModal(true); 
  };
  const handleAssign = async () => {
    if (!assignTo) return;
    try {
      await createInventory({
        category: assignItem.category, brand: assignItem.brand, model: assignItem.model,
        serialNo: assignItem.serialNo, pcIsmi: assignItem.pcIsmi,
        envanterTuru: assignItem.envanterTuru, assignedTo: assignTo
      });
      await deleteStock(assignItem.id);
      toast.success(`Cihaz ${assignTo} kişisine zimmetlendi.`);
      setAssignModal(false); load();
    } catch (e) {
      console.error(e);
      toast.error('Zimmetleme başarısız oldu.');
    }
  };

  // Return inventory item to stock
  const handleReturn = async (item) => {
    setConfModal({
      title: 'Stoğa İade Et',
      msg: `"${item.brand} ${item.model}" (${item.serialNo}) seri nolu cihaz zimmetten düşülerek stoğa iade edilecek. Onaylıyor musunuz?`,
      color: 'var(--accent-blue)',
      onConfirm: async () => {
        setDeleting(true);
        try {
          await createStock({
            category: item.category, brand: item.brand, model: item.model,
            serialNo: item.serialNo, pcIsmi: item.pcIsmi, status: 'Sağlam',
            envanterTuru: item.envanterTuru
          });
          await deleteInventory(item.id);
          toast.success('Cihaz stoğa iade edildi.');
          setConfModal(null);
          load();
        } catch (e) {
          console.error(e);
          toast.error('İade işlemi başarısız oldu.');
        } finally {
          setDeleting(false);
        }
      }
    });
  };

  if (loading) return (
    <div className="loading-screen">
      <div className="spinner" style={{ width: 36, height: 36 }} />
      <span style={{ fontWeight: 600 }}>Stok ve Envanter yükleniyor…</span>
    </div>
  );

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* ─── Page Header ─── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">
            <div className="icon-box-sm icon-slate"><Package size={15} /></div>
            Stok & Envanter Yönetimi
          </h1>
          <p className="page-subtitle">Şirket varlıklarını, zimmet süreçlerini ve yazılım lisanslarını tek merkezden yönetin</p>
        </div>
        
        <button className="btn btn-primary" onClick={openNew}>
          <Plus size={16} /> Yeni Varlık Ekle
        </button>
      </div>

      {/* ─── KPI Row ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
        <div className="card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div className="icon-box icon-blue"><Boxes size={20} /></div>
          <div>
            <div className="page-subtitle" style={{ marginBottom: '2px' }}>Toplam Varlık</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-1)' }}>{totalAssets}</div>
          </div>
        </div>

        <div className="card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div className="icon-box icon-green"><Package size={20} /></div>
          <div>
            <div className="page-subtitle" style={{ marginBottom: '2px' }}>Stokta Mevcut</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-1)' }}>{stockCount}</div>
          </div>
        </div>

        <div className="card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div className="icon-box icon-amber"><UserCheck size={20} /></div>
          <div>
            <div className="page-subtitle" style={{ marginBottom: '2px' }}>Zimmet Oranı</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-1)' }}>%{assignmentRate}</div>
          </div>
        </div>

        <div className="card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div className={`icon-box ${expiredLicenses > 0 ? 'icon-red' : 'icon-slate'}`}><ShieldCheck size={20} /></div>
          <div>
            <div className="page-subtitle" style={{ marginBottom: '2px' }}>Lisans Uyarıları</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: expiredLicenses > 0 ? 'var(--red)' : 'var(--text-1)' }}>
              {expiredLicenses} Kritik
            </div>
          </div>
        </div>
      </div>

      {/* ─── Tabs & Toolbar ─── */}
      <div className="card" style={{ padding: '12px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
          <div className="segmented-control">
            <button className={tab === 'stock' ? 'active' : ''} onClick={() => setTab('stock')}>Stok Listesi</button>
            <button className={tab === 'inventory' ? 'active' : ''} onClick={() => setTab('inventory')}>Zimmetli Envanter</button>
            <button className={tab === 'licenses' ? 'active' : ''} onClick={() => setTab('licenses')}>Lisanslar</button>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flex: 1, justifyContent: 'flex-end' }}>
            <div className="search-bar" style={{ width: '100%', maxWidth: '320px' }}>
              <Search size={15} color="var(--text-3)" />
              <input placeholder="Seri no, marka veya model ara..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            {tab !== 'licenses' && (
              <select className="form-select" style={{ width: 'auto', minWidth: '180px', height: '38px', padding: '0 12px' }} value={catFilter} onChange={e => setCatFilter(e.target.value)}>
                <option value="">Tüm Kategoriler</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            )}
          </div>
        </div>
      </div>

      {/* ─── Data Table ─── */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            {tab === 'licenses' ? (
              <tr>
                <th style={{ width: 240 }}>Yazılım Adı</th>
                <th>Lisans Anahtarı</th>
                <th>Tip</th>
                <th>Bitiş Tarihi</th>
                <th>Atanan</th>
                <th style={{ width: 80, textAlign: 'center' }}>İşlemler</th>
              </tr>
            ) : (
              <tr>
                <th style={{ width: 200 }}>Varlık Bilgisi</th>
                <th>Seri No / PC İsmi</th>
                <th>Tür</th>
                {tab === 'stock' && <th>Durum</th>}
                {tab === 'inventory' && <th>Zimmetli</th>}
                <th style={{ width: 100, textAlign: 'center' }}>İşlemler</th>
              </tr>
            )}
          </thead>
          <tbody>
            {filtered.map(item => {
              if (tab === 'licenses') {
                const isExpired = item.expirationDate && new Date(item.expirationDate) < new Date();
                return (
                  <tr key={item.id} className={isExpired ? 'row-danger' : ''}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div className={`icon-box-sm ${isExpired ? 'icon-red' : 'icon-blue'}`}><ShieldCheck size={14} /></div>
                        <div style={{ fontWeight: 800, color: 'var(--text-1)', fontSize: '13px' }}>{item.softwareName}</div>
                      </div>
                    </td>
                    <td><code style={{ fontSize: '11px', color: 'var(--text-2)' }}>{item.licenseKey || '—'}</code></td>
                    <td><span className="badge badge-neutral" style={{ fontSize: '10px' }}>{item.licenseType.toUpperCase()}</span></td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: isExpired ? 'var(--red)' : 'var(--text-2)', fontWeight: 600, fontSize: '12px' }}>
                        {isExpired && <AlertTriangle size={12} />}
                        {item.expirationDate ? new Date(item.expirationDate).toLocaleDateString('tr-TR') : 'SÜRESİZ'}
                      </div>
                    </td>
                    <td style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-1)' }}>{item.assignedTo || '—'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                        <button className="btn-icon" onClick={() => openEdit(item)} title="Düzenle"><Pencil size={13} /></button>
                        <button className="btn-icon" style={{ borderColor: 'var(--red-border)', color: 'var(--red)' }} onClick={() => handleDelete(item.id)} title="Sil"><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                );
              }

              // Asset Icons Mapping
              const getIcon = (cat) => {
                switch(cat) {
                  case 'Bilgisayar': return <Monitor size={14} />;
                  case 'Telefon': return <Phone size={14} />;
                  case 'Tablet': return <Tablet size={14} />;
                  case 'Yazıcı': return <Printer size={14} />;
                  case 'Ağ Cihazı': return <Wifi size={14} />;
                  default: return <Package size={14} />;
                }
              };

              const isDefective = item.status === 'Arızalı';
              
              return (
                <tr key={item.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div className="icon-box-sm icon-slate">{getIcon(item.category)}</div>
                      <div>
                        <div style={{ fontWeight: 800, color: 'var(--text-1)', fontSize: '13px' }}>{item.brand} {item.model}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>{item.category}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <code style={{ fontSize: '11px', color: 'var(--text-1)', fontWeight: 700 }}>{item.serialNo || '—'}</code>
                    {item.pcIsmi && <div style={{ fontSize: '10px', color: 'var(--blue)', fontWeight: 800 }}>{item.pcIsmi}</div>}
                  </td>
                  <td><span className="badge badge-neutral" style={{ fontSize: '10px' }}>{item.envanterTuru === 'Personel Envanteri' ? 'PERSONEL' : 'ŞİRKET'}</span></td>
                  
                  {tab === 'stock' && (
                    <td>
                      <span className={`badge ${isDefective ? 'badge-red' : 'badge-green'}`} style={{ fontSize: '10px' }}>
                        {(item.status || 'SAĞLAM').toUpperCase()}
                      </span>
                    </td>
                  )}
                  
                  {tab === 'inventory' && (
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div className="avatar-initials" style={{ width: 24, height: 24, fontSize: '10px' }}>
                          {(item.assignedTo?.[0] || '?').toUpperCase()}
                        </div>
                        <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-1)' }}>{item.assignedTo || '—'}</div>
                      </div>
                    </td>
                  )}
                  
                  <td>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                      {tab === 'stock' && (
                        <button className="btn-icon" style={{ borderColor: 'var(--amber-border)', color: 'var(--amber)' }} title="Personele Zimmetle" onClick={() => openAssign(item)}>
                          <ArrowRightLeft size={13} />
                        </button>
                      )}
                      {tab === 'inventory' && (
                        <button className="btn-icon" style={{ borderColor: 'var(--blue-border)', color: 'var(--blue)' }} title="Stoğa İade Et" onClick={() => handleReturn(item)}>
                          <ArrowRightLeft size={13} />
                        </button>
                      )}
                      <button className="btn-icon" onClick={() => openEdit(item)} title="Düzenle"><Pencil size={13} /></button>
                      <button className="btn-icon" style={{ borderColor: 'var(--red-border)', color: 'var(--red)' }} onClick={() => handleDelete(item.id)} title="Sil"><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
            
            {filtered.length === 0 && (
              <tr>
                <td colSpan={10} style={{ textAlign: 'center', padding: '80px' }}>
                  <div style={{ opacity: 0.2, marginBottom: '16px' }}><Package size={48} /></div>
                  <p style={{ fontWeight: 600, color: 'var(--text-3)' }}>Aranan kriterlere uygun varlık bulunamadı.</p>
                  <button className="btn btn-ghost" style={{ marginTop: '12px' }} onClick={() => { setSearch(''); setCatFilter(''); }}>Filtreleri Temizle</button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ─── Add/Edit Modal ─── */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal-content" style={{ maxWidth: 720 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                <div className="icon-box-sm icon-slate"><Plus size={16} /></div>
                {editId ? 'Varlığı Düzenle' : 'Yeni Varlık Kaydı'}
              </h2>
              <button className="icon-btn" onClick={() => setModal(false)}><X size={18} /></button>
            </div>
            
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {tab === 'licenses' ? (
                <>
                  <div className="form-group">
                    <label className="form-label">Yazılım / Uygulama Adı</label>
                    <input required className="form-input" value={form.softwareName} onChange={e => setForm({...form, softwareName: e.target.value})} placeholder="Ör: Microsoft Office 2024" />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="form-group">
                      <label className="form-label">Lisans Anahtarı</label>
                      <input className="form-input" value={form.licenseKey} onChange={e => setForm({...form, licenseKey: e.target.value})} placeholder="XXXXX-XXXXX..." />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Lisans Tipi</label>
                      <select className="form-select" value={form.licenseType} onChange={e => setForm({...form, licenseType: e.target.value})}>
                        <option value="Retail">Retail</option>
                        <option value="OEM">OEM</option>
                        <option value="Volume">Volume</option>
                        <option value="Subscription">Subscription</option>
                      </select>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="form-group">
                      <label className="form-label">Bitiş Tarihi</label>
                      <input type="date" className="form-input" value={form.expirationDate} onChange={e => setForm({...form, expirationDate: e.target.value})} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Atanan Kişi veya Cihaz</label>
                      <input className="form-input" value={form.assignedTo} onChange={e => setForm({...form, assignedTo: e.target.value})} placeholder="İsim veya PC-ID" />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Ek Notlar</label>
                    <textarea className="form-input" rows={2} value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder="Lisans detayları, satın alım bilgisi vb." />
                  </div>
                </>
              ) : (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="form-group">
                      <label className="form-label">Kategori</label>
                      <select className="form-select" value={form.category} onChange={e => setForm({...form, category: e.target.value, brand: '', model: ''})}>
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Envanter Türü</label>
                      <select className="form-select" value={form.envanterTuru} onChange={e => setForm({...form, envanterTuru: e.target.value})}>
                        {ENVANTER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="form-group">
                      <label className="form-label">Marka</label>
                      <input list="brand-suggestions" required className="form-input" value={form.brand} onChange={e => setForm({ ...form, brand: e.target.value, model: '' })} placeholder="Örn: Dell, HP, Apple" />
                      <datalist id="brand-suggestions">
                        {Object.keys(CATEGORY_MODELS[form.category] || {}).map(b => <option key={b} value={b} />)}
                      </datalist>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Model</label>
                      <input list="model-suggestions" className="form-input" value={form.model} onChange={e => setForm({...form, model: e.target.value})} placeholder="Model seçin veya yazın" />
                      <datalist id="model-suggestions">
                        {((CATEGORY_MODELS[form.category] || {})[form.brand] || []).map(m => <option key={m} value={m} />)}
                      </datalist>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="form-group">
                      <label className="form-label">Seri Numarası</label>
                      <input className="form-input" value={form.serialNo} onChange={e => setForm({...form, serialNo: e.target.value})} placeholder="S/N: 1234..." />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Cihaz İsmi (Hostname)</label>
                      <input className="form-input" value={form.pcIsmi} onChange={e => setForm({...form, pcIsmi: e.target.value})} placeholder="Ör: REPKON-PC-01" />
                    </div>
                  </div>

                  {tab === 'stock' && (
                    <div className="form-group">
                      <label className="form-label">Fiziksel Durum</label>
                      <select className="form-select" value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                        {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  )}

                  {!editId && form.category === 'Bilgisayar' && (
                    <div style={{ padding: '16px', background: 'var(--green-light)', borderRadius: '12px', border: '1px solid var(--green-border)', marginTop: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                        <input type="checkbox" id="syncPing" checked={form.addToMonitoring} onChange={e => setValue('addToMonitoring', e.target.checked)} />
                        <label htmlFor="syncPing" style={{ fontWeight: 700, fontSize: '13px', color: 'var(--green)', cursor: 'pointer' }}>Ağ İzleme Listesine (Ping) Otomatik Ekle</label>
                      </div>
                      {form.addToMonitoring && (
                        <div className="form-group">
                          <label className="form-label" style={{ color: 'var(--green)' }}>IP Adresi veya Hostname</label>
                          <input className="form-input" placeholder="192.168.1.XX" value={form.monitorHost} onChange={e => setValue('monitorHost', e.target.value)} />
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setModal(false)}>İptal</button>
                <button type="submit" className="btn btn-primary">
                  {editId ? 'Değişiklikleri Kaydet' : 'Varlığı Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Assignment Modal ─── */}
      {assignModal && (
        <div className="modal-overlay" onClick={() => setAssignModal(false)}>
          <div className="modal-content" style={{ maxWidth: 460 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                <div className="icon-box-sm icon-amber"><ArrowRightLeft size={16} /></div>
                Personele Zimmetle
              </h2>
              <button className="icon-btn" onClick={() => setAssignModal(false)}><X size={18} /></button>
            </div>
            
            <div className="info-box" style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-3)', fontWeight: 600 }}>TANIMLANACAK VARLIK</div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-1)' }}>{assignItem?.brand} {assignItem?.model}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-2)' }}>S/N: {assignItem?.serialNo}</div>
            </div>

            <div className="form-group">
              <label className="form-label">Personel Arayın</label>
              <div className="search-bar" style={{ marginBottom: '12px' }}>
                <Search size={15} color="var(--text-3)" />
                <input placeholder="İsim veya soyisim ile ara..." value={searchPerson} onChange={e => { setSearchPerson(e.target.value); setAssignTo(''); }} />
              </div>

              <div style={{ maxHeight: '240px', overflowY: 'auto', borderRadius: '12px', border: '1px solid var(--border)' }}>
                {personnel.filter(p => (p.adSoyad || `${p.ad} ${p.soyad}`).toLowerCase().includes(searchPerson.toLowerCase())).map(p => {
                  const name = p.adSoyad || `${p.ad} ${p.soyad}`;
                  const isSelected = assignTo === name;
                  return (
                    <div key={p.id} onClick={() => { setAssignTo(name); setSearchPerson(name); }}
                      style={{ padding: '10px 15px', cursor: 'pointer', borderBottom: '1px solid var(--border)', background: isSelected ? 'var(--blue-light)' : 'transparent', transition: 'all 0.2s' }}>
                      <div style={{ fontWeight: 800, fontSize: '13px', color: isSelected ? 'var(--blue)' : 'var(--text-1)' }}>{name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>{p.bolum} · {p.firma}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
              <button className="btn btn-secondary" onClick={() => setAssignModal(false)}>İptal</button>
              <button className="btn btn-primary" onClick={handleAssign} disabled={!assignTo}>Zimmeti Tamamla</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Context Confirmation Modal ─── */}
      {confModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 400 }}>
            <h2 style={{ color: confModal.color || 'var(--red)', marginBottom: '12px' }}>{confModal.title}</h2>
            <p style={{ fontSize: '14px', lineHeight: '1.6', color: 'var(--text-2)' }}>{confModal.msg}</p>
            <div style={{ marginTop: '24px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setConfModal(null)} disabled={deleting}>Vazgeç</button>
              <button className="btn btn-primary" style={{ background: confModal.color || 'var(--blue)', borderColor: confModal.color || 'var(--blue)' }} onClick={confModal.onConfirm} disabled={deleting}>
                {deleting ? 'İşlem Yapılıyor...' : 'Onayla'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .badge { display: inline-flex; padding: 2px 10px; border-radius: 12px; font-size: 11px; font-weight: 600; }
        .badge-success { background: rgba(34, 197, 94, 0.1); color: #4ade80; border: 1px solid rgba(34, 197, 94, 0.2); }
        .badge-warn { background: rgba(234, 179, 8, 0.1); color: #facc15; border: 1px solid rgba(234, 179, 8, 0.2); }
        .badge-default { background: rgba(255, 255, 255, 0.05); color: var(--text-muted); border: 1px solid var(--border-color); }
        .person-item:hover { background: rgba(255, 255, 255, 0.05) !important; }
        .modal-content h3 { font-size: 18px; font-weight: 700; margin-top: 0; }
        .action-cell { display: flex; gap: 4px; }
      `}</style>
    </div>
  );
}
