import React, { useState, useEffect } from 'react';
import { 
  FileText, Upload, Trash2, Eye, Download, X, FileCheck, 
  CircleAlert, Loader2, Maximize2, FilePlus, EyeOff
} from 'lucide-react';
import { 
  getComplianceDocuments, uploadComplianceDocument, 
  deleteComplianceDocument, previewComplianceDocument 
} from '../api';
import toast from 'react-hot-toast';

export default function ComplianceDocManager({ standard }) {
  const [docs, setDocs]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      const data = await getComplianceDocuments(standard);
      setDocs(data);
      if (data.length > 0 && !selectedDoc) {
        setSelectedDoc(data[0]);
      }
    } catch (e) {
      console.error('Docs load error', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [standard]);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const tid = toast.loading('Belge yükleniyor...');
      await uploadComplianceDocument(standard, file);
      toast.success('Belge başarıyla eklendi.', { id: tid });
      load();
    } catch (err) {
      toast.error('Belge yüklenemedi.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Bu belgeyi silmek istediğinize emin misiniz?')) return;
    try {
      await deleteComplianceDocument(id);
      toast.success('Belge silindi.');
      if (selectedDoc?.id === id) setSelectedDoc(null);
      load();
    } catch (err) {
      toast.error('Silme işlemi başarısız.');
    }
  };

  const isImage = (name) => /\.(jpg|jpeg|png)$/i.test(name);

  return (
    <div className="glass-card" style={{ padding: '24px', marginBottom: '24px', minHeight: '400px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', pb: '16px' }}>
        <div>
          <h3 style={{ fontSize: '18px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-primary)' }}>
            <FilePlus size={20} className="text-secondary" />
            Kurumsal Sertifika ve Belgeler
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Resmi sertifikalarınızı yükleyip yan yana önizleme panelinden kontrol edin.
          </p>
        </div>
        <label className="btn btn-primary" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px' }}>
          {uploading ? <Loader2 size={18} className="spin" /> : <Upload size={18} />}
          Yeni Belge Yükle
          <input type="file" hidden onChange={handleUpload} disabled={uploading} accept=".pdf,.png,.jpg,.jpeg" />
        </label>
      </div>

      <div style={{ display: 'flex', gap: '24px', minHeight: '450px' }}>
        {/* Sol Taraf: Liste */}
        <div style={{ flex: '0 0 350px', display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', maxH: '600px' }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}><Loader2 className="spin" size={32} opacity={0.3} /></div>
          ) : docs.length === 0 ? (
            <div style={{ 
              textAlign: 'center', padding: '40px 20px', background: 'rgba(255,255,255,0.01)', 
              borderRadius: '12px', border: '1px dashed var(--border-color)'
            }}>
              <CircleAlert size={40} style={{ opacity: 0.1, marginBottom: '12px' }} />
              <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Henüz bir belge eklenmemiş.</p>
            </div>
          ) : (
            docs.map(doc => (
              <div 
                key={doc.id} 
                className={`doc-card ${selectedDoc?.id === doc.id ? 'active' : ''}`}
                onClick={() => setSelectedDoc(doc)}
                style={{ 
                  padding: '14px', borderRadius: '12px', cursor: 'pointer',
                  background: selectedDoc?.id === doc.id ? 'var(--accent-green-dim)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${selectedDoc?.id === doc.id ? 'var(--accent-green)' : 'var(--border-color)'}`,
                  transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', gap: '12px'
                }}
              >
                <div style={{ 
                  width: '44px', height: '44px', borderRadius: '8px', 
                  background: isImage(doc.fileName) ? 'rgba(56, 189, 248, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                  color: isImage(doc.fileName) ? '#38bdf8' : 'var(--accent-green)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden'
                }}>
                  {isImage(doc.fileName) ? (
                    <img src={previewComplianceDocument(doc.id)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : <FileCheck size={20} />}
                </div>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                    {doc.fileName}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {new Date(doc.uploadDate).toLocaleDateString('tr-TR')}
                  </div>
                </div>
                <button 
                  className="btn-icon-small" 
                  onClick={(e) => { e.stopPropagation(); handleDelete(doc.id); }}
                  style={{ color: 'var(--accent-red)', opacity: 0.6 }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )
          ))}
        </div>

        {/* Sağ Taraf: Önizleme */}
        <div style={{ flex: 1, border: '1px solid var(--border-color)', borderRadius: '16px', background: 'rgba(0,0,0,0.2)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {selectedDoc ? (
            <>
              <div style={{ padding: '12px 20px', background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>{selectedDoc.fileName}</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                   <a 
                     href={previewComplianceDocument(selectedDoc.id)} 
                     target="_blank" 
                     className="btn-icon-small" 
                     title="Tam Ekran Aç"
                   >
                     <Maximize2 size={16} />
                   </a>
                   <a 
                     href={previewComplianceDocument(selectedDoc.id)} 
                     download={selectedDoc.fileName}
                     className="btn-icon-small"
                     title="İndir"
                   >
                     <Download size={16} />
                   </a>
                </div>
              </div>
              <div style={{ flex: 1, background: '#111', position: 'relative' }}>
                {selectedDoc.fileName.toLowerCase().endsWith('.pdf') ? (
                  <iframe 
                    src={`${previewComplianceDocument(selectedDoc.id)}#toolbar=0`} 
                    style={{ width: '100%', height: '100%', border: 'none' }}
                    title="PDF"
                  />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <img 
                      src={previewComplianceDocument(selectedDoc.id)} 
                      alt="Görsel" 
                      style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }} 
                    />
                  </div>
                )}
              </div>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', gap: '16px' }}>
              <EyeOff size={48} style={{ opacity: 0.1 }} />
              <p style={{ fontSize: '14px' }}>Önizlemek istediğiniz belgeyi soldan seçin.</p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
        .doc-card:hover { background: rgba(255,255,255,0.06) !important; transform: translateX(4px); }
        .doc-card.active { box-shadow: 0 0 15px rgba(34, 197, 94, 0.1); }
        .btn-icon-small { 
          background: transparent; border: none; padding: 6px; 
          border-radius: 6px; cursor: pointer; color: var(--text-secondary);
          display: flex; align-items: center; justify-content: center;
          transition: all 0.2s;
        }
        .btn-icon-small:hover { background: rgba(255,255,255,0.1); color: var(--text-primary); }
      `}</style>
    </div>
  );
}
