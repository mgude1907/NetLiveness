import React, { useState, useEffect } from 'react';
import { getBackups, createSnapshot, restoreSnapshot, deleteBackup, restartSystem } from '../api';
import { History, Plus, RotateCcw, Trash2, Database, HardDrive, TriangleAlert, CircleCheck, Clock, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function BackupManagement() {
    const [backups, setBackups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({ name: '', description: '' });

    const loadBackups = async () => {
        try {
            const data = await getBackups();
            setBackups(data);
        } catch (e) {
            toast.error('Yedek listesi yüklenemedi.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadBackups(); }, []);

    const handleCreate = async (e) => {
        e.preventDefault();
        setCreating(true);
        try {
            await createSnapshot(form);
            toast.success('Geri yükleme noktası oluşturuldu.');
            setShowModal(false);
            setForm({ name: '', description: '' });
            loadBackups();
        } catch (e) {
            toast.error('Yedek oluşturma başarısız.');
        } finally {
            setCreating(false);
        }
    };

    const handleRestore = async (id) => {
        if (!window.confirm('DİKKAT: Sistem verileri bu tarihteki haline geri döndürülecektir. Devam edilsin mi?')) return;
        
        const tid = toast.loading('Geri yükleme hazırlanıyor...');
        try {
            const res = await restoreSnapshot(id);
            toast.success(res.message, { id: tid, duration: 6000 });
            
            // Eğer sistemin yeniden başlatılması gerekiyorsa bir buton gösterebiliriz
            if (res.pending) {
                setTimeout(() => {
                    if (window.confirm('Geri yüklemenin tamamlanması için sistemin şimdi yeniden başlatılması gerekiyor. Onaylıyor musunuz?')) {
                        restartSystem().then(() => toast.success('Sistem yeniden başlatılıyor...'));
                    }
                }, 1000);
            }
        } catch (e) {
            toast.error('Geri yükleme başarısız oldu.', { id: tid });
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Bu yedeği silmek istediğinize emin misiniz?')) return;
        try {
            await deleteBackup(id);
            toast.success('Yedek silindi.');
            loadBackups();
        } catch (e) {
            toast.error('Silme işlemi başarısız.');
        }
    };

    const formatSize = (bytes) => {
        if (!bytes) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    if (loading) return <div className="loading-spinner"><div className="spinner"></div></div>;

    return (
        <div className="page-container animate-fade-in">
            <div className="page-header" style={{ marginBottom: '30px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div className="header-icon" style={{ background: 'var(--accent-purple-dim)', color: 'var(--accent-purple)' }}>
                        <History size={24} />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '24px', fontWeight: '800' }}>Geri Yükleme & Versiyonlar</h1>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Sistemi eski bir tarihteki haline geri döndürün.</p>
                    </div>
                </div>
                <button className="btn btn-primary" onClick={() => setShowModal(true)} disabled={creating}>
                    <Plus size={18} /> {creating ? 'Cihaz Yedekleniyor...' : 'Geri Yükleme Noktası Oluştur'}
                </button>
            </div>

            <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Yedek Adı / Açıklama</th>
                            <th>Tarih</th>
                            <th>Boyut</th>
                            <th>Tür</th>
                            <th style={{ textAlign: 'right' }}>İşlemler</th>
                        </tr>
                    </thead>
                    <tbody>
                        {backups.map(b => (
                            <tr key={b.id}>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div className={`status-dot ${b.dbOnly ? 'success' : 'warning'}`}></div>
                                        <div>
                                            <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{b.name}</div>
                                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{b.description}</div>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                                        <Clock size={14} /> {new Date(b.createdAt).toLocaleString()}
                                    </div>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)' }}>
                                        <HardDrive size={14} /> {formatSize(b.sizeBytes)}
                                    </div>
                                </td>
                                <td>
                                    <span className="badge badge-ghost" style={{ fontSize: '11px' }}>
                                        {b.dbOnly ? 'Sadece Veritabanı' : 'Tam Sistem'}
                                    </span>
                                </td>
                                <td style={{ textAlign: 'right' }}>
                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                        <button className="btn btn-ghost btn-sm" onClick={() => handleRestore(b.id)} title="Bu versiyona dön" style={{ color: 'var(--accent-purple)' }}>
                                            <RotateCcw size={16} /> Geri Yükle
                                        </button>
                                        <button className="icon-btn danger" onClick={() => handleDelete(b.id)} title="Sil">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {backups.length === 0 && (
                            <tr>
                                <td colSpan="5" style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
                                    <Database size={40} style={{ marginBottom: '12px', opacity: 0.3 }} />
                                    <p>Henüz bir geri yükleme noktası oluşturulmadı.</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className="alert-box warning" style={{ marginTop: '24px' }}>
                <TriangleAlert size={20} />
                <div>
                    <strong>Önemli Bilgi:</strong> Geri yükleme işlemi sadece veritabanı kayıtlarını kapsar. Kod değişikliklerini geri almak için sistem yedeklemesi ayrıca yapılmalıdır. Geri yükleme sonrası sistemin otomatik olarak yeniden başlatılması önerilir.
                </div>
            </div>

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '450px' }}>
                        <div className="modal-header">
                            <h2>Yedek Oluştur</h2>
                            <button className="icon-btn" onClick={() => setShowModal(false)}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleCreate}>
                            <div className="form-group">
                                <label>Yedek Adı</label>
                                <input type="text" className="form-input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Örn: Güncelleme Öncesi Yedek" required />
                            </div>
                            <div className="form-group">
                                <label>Açıklama</label>
                                <textarea className="form-input" value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Bu yedeği neden alıyorsunuz?" style={{ minHeight: '80px' }} />
                            </div>
                            <div className="modal-footer" style={{ marginTop: '20px' }}>
                                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>İptal</button>
                                <button type="submit" className="btn btn-primary" disabled={creating}>
                                    <CircleCheck size={18} /> {creating ? 'Oluşturuluyor...' : 'Yedeği Onayla'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
