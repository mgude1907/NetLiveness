import { useState, useEffect } from 'react';
import { ShieldCheck, PlayCircle, ClipboardList, Save, History, User, Calendar, FilePenLine, CheckCircle2, AlertTriangle, Link, Plus, Trash2, GripVertical, Download, BookOpen } from 'lucide-react';
import axios from 'axios';
import { uploadVideo, STATIC_URL } from '../api';
import { isAllowedTrainingMedia } from '../utils/trainingMedia';

export default function CyberOrientationAdmin() {
  const [settings, setSettings] = useState({ videoUrl: '', questionsJson: '[]' });
  const [questions, setQuestions] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('settings');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [toast, setToast] = useState(null); 

  useEffect(() => {
    fetchData();
    // Yalnızca sayfa açılışında yüklenir.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchData = async () => {
    try {
      const [settingsRes, resultsRes] = await Promise.all([
        axios.get('/api/training/settings'),
        axios.get('/api/training/results')
      ]);
      
      const sData = settingsRes.data || { videoUrl: '', questionsJson: '[]' };
      setSettings(sData);
      setResults(resultsRes.data || []);

      try {
        const parsed = JSON.parse(sData.questionsJson || '[]');
        setQuestions(parsed);
      } catch (e) {
        console.error("JSON parse hatası", e);
        setQuestions([]);
      }
    } catch (error) {
      console.error('Veri çekme hatası:', error);
      showToast('error', 'Veriler yüklenirken hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setSaveLoading(true);
    try {
      const updatedSettings = {
        ...settings,
        questionsJson: JSON.stringify(questions)
      };

      await axios.post('/api/training/settings', updatedSettings);
      showToast('success', '✅ Ayarlar ve Sorular başarıyla kaydedildi!');
    } catch (error) {
      console.error('Kaydetme hatası:', error);
      showToast('error', `❌ Kaydedilirken hata oluştu.`);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleVideoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!isAllowedTrainingMedia(file)) {
      showToast('error', 'Lütfen geçerli bir video veya sunum dosyası seçin (.mp4, .pptx, .pdf)');
      e.target.value = '';
      return;
    }

    const isVideo = (file.type || '').toLowerCase().startsWith('video/');
    setUploading(true);
    setUploadProgress(0);

    try {
      const res = await uploadVideo(file, (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setUploadProgress(percentCompleted);
      });
      setSettings(prev => ({ ...prev, videoUrl: res.url }));
      showToast('success', isVideo ? '✅ Video başarıyla yüklendi!' : '✅ Dosya başarıyla yüklendi!');
    } catch (error) {
      console.error('Dosya yükleme hatası:', error);
      const apiMessage = typeof error.response?.data === 'string' ? error.response.data : null;
      showToast('error', apiMessage || 'Dosya yüklenirken hata oluştu.');
    } finally {
      setUploading(false);
      setUploadProgress(0);
      e.target.value = '';
    }
  };

  // --- Soru Yöneticisi Fonksiyonları ---
  const addQuestion = () => {
    const newId = questions.length > 0 ? Math.max(...questions.map(q => q.id)) + 1 : 1;
    setQuestions([
      ...questions,
      {
        id: newId,
        text: "",
        options: [
          { id: 'a', text: "", correct: true },
          { id: 'b', text: "" }
        ]
      }
    ]);
  };

  const removeQuestion = (qIndex) => {
    if (window.confirm('Bu soruyu silmek istediğinize emin misiniz?')) {
      const newQ = [...questions];
      newQ.splice(qIndex, 1);
      setQuestions(newQ);
    }
  };

  const updateQuestionText = (qIndex, text) => {
    const newQ = [...questions];
    newQ[qIndex].text = text;
    setQuestions(newQ);
  };

  const addOption = (qIndex) => {
    const newQ = [...questions];
    const letters = 'abcdefghijklmnopqrstuvwxyz';
    const nextId = letters[newQ[qIndex].options.length] || Date.now().toString();
    newQ[qIndex].options.push({ id: nextId, text: "" });
    setQuestions(newQ);
  };

  const removeOption = (qIndex, oIndex) => {
    const newQ = [...questions];
    if (newQ[qIndex].options.length <= 2) {
      alert('En az 2 seçenek olmalıdır.');
      return;
    }
    // Eğer silinen seçenek doğru cevapsa, ilk seçeneği doğru yap
    if (newQ[qIndex].options[oIndex].correct) {
      newQ[qIndex].options[oIndex === 0 ? 1 : 0].correct = true;
    }
    newQ[qIndex].options.splice(oIndex, 1);
    setQuestions(newQ);
  };

  const updateOptionText = (qIndex, oIndex, text) => {
    const newQ = [...questions];
    newQ[qIndex].options[oIndex].text = text;
    setQuestions(newQ);
  };

  const setCorrectOption = (qIndex, oIndex) => {
    const newQ = [...questions];
    newQ[qIndex].options.forEach((opt, idx) => {
      opt.correct = (idx === oIndex);
    });
    setQuestions(newQ);
  };

  // --- Video Render Mantığı ---
  const isLocalVideo = settings.videoUrl && settings.videoUrl.startsWith('/uploads/videos');
  const isRepkonSftp = settings.videoUrl && settings.videoUrl.includes('sftp.repkon.com.tr');
  const mediaName = (settings.videoUrl || '').toLowerCase();
  const isPptxUrl = mediaName.endsWith('.pptx') || mediaName.endsWith('.ppt');

  let displayVideoUrl = settings.videoUrl;
  if (isLocalVideo) {
    displayVideoUrl = `${STATIC_URL}${settings.videoUrl}`;
  } else if (isRepkonSftp) {
    const encoded = encodeURIComponent(
      settings.videoUrl.endsWith('/download') ? settings.videoUrl : `${settings.videoUrl}/download`
    );
    displayVideoUrl = `/api/training/proxy-video?url=${encoded}`;
  }

  let finalIframeUrl = displayVideoUrl;
  const isPublicUrl = displayVideoUrl.startsWith('http') && !displayVideoUrl.includes('localhost') && !displayVideoUrl.includes('192.168.') && !displayVideoUrl.includes('10.') && !displayVideoUrl.includes('172.') && !displayVideoUrl.includes('206.16.0.6');
  
  if (isPptxUrl && isPublicUrl) {
    finalIframeUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(displayVideoUrl)}`;
  }

  const exportToCSV = () => {
    if (results.length === 0) return;
    
    const headers = ["Personel Adı", "E-posta", "Puan", "Tamamlama Tarihi"];
    const csvContent = [
      headers.join(","),
      ...results.map(r => 
        `"${r.participantName}","${r.email}","${r.score}","${new Date(r.completedAt).toLocaleString('tr-TR')}"`
      )
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Siber_Oryantasyon_Raporu_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isYoutube = settings.videoUrl && (
    settings.videoUrl.includes('youtube.com') || settings.videoUrl.includes('youtu.be')
  );
  const useVideoTag = !isPptxUrl && (isLocalVideo || isRepkonSftp || (!isYoutube && settings.videoUrl && settings.videoUrl.endsWith('.mp4')));

  if (loading) return <div className="p-8 text-center">Yükleniyor...</div>;

  return (
    <div className="animate-fade-in">
      {toast && (
        <div
          style={{
            position: 'fixed', top: '24px', right: '24px', zIndex: 9999,
            background: toast.type === 'success' ? '#dcfce7' : '#fee2e2',
            border: `1px solid ${toast.type === 'success' ? '#86efac' : '#fca5a5'}`,
            color: toast.type === 'success' ? '#166534' : '#991b1b',
            padding: '14px 20px', borderRadius: '12px', fontWeight: 700,
            fontSize: '14px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            display: 'flex', alignItems: 'center', gap: '8px',
            animation: 'fadeIn 0.3s ease'
          }}
        >
          {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
          {toast.message}
        </div>
      )}

      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="page-title">
            <div className="icon-box-sm icon-violet"><ShieldCheck size={16} /></div>
            Siber Oryantasyon Yönetimi
          </h1>
          <p className="page-subtitle">Eğitim videosu/sunumu, sorular ve personel raporlarını yönetin</p>
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        <button
          className={`btn ${activeTab === 'settings' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setActiveTab('settings')}
        >
          <FilePenLine size={16} /> İçerik Hazırlama
        </button>
        <button
          className={`btn ${activeTab === 'reports' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setActiveTab('reports')}
        >
          <History size={16} /> Katılım Raporları
        </button>
      </div>

      {activeTab === 'settings' && (
        <div className="flex flex-col gap-8">
          
          {/* VİDEO/SUNUM AYARLARI */}
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="icon-box-sm icon-amber"><PlayCircle size={16} /></div>
              <h3 className="text-lg font-bold">Medya Ayarları</h3>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-bold mb-2">Medya Bağlantısı</label>

              <div className="flex flex-col gap-3">
                <div style={{ position: 'relative' }}>
                  <Link size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                  <input
                    type="text"
                    className="input w-full"
                    style={{ paddingLeft: '34px' }}
                    placeholder="https://www.youtube.com/embed/... veya sftp.repkon.com.tr/s/..."
                    value={settings.videoUrl}
                    onChange={(e) => setSettings({ ...settings, videoUrl: e.target.value })}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-400 px-2">VEYA</span>
                  <div className="flex-1">
                    <label className={`btn btn-secondary cursor-pointer ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                      {uploading ? '⏳ Yükleniyor...' : '📁 Bilgisayardan Dosya Seç'}
                      <input type="file" accept="video/*,.ppt,.pptx,.pdf" className="hidden" onChange={handleVideoUpload} />
                    </label>
                  </div>
                </div>

                {uploading && (
                  <div className="mt-2 p-3 bg-gray-50 border border-gray-100 rounded-lg">
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="text-blue-600">Dosya Sunucuya Yükleniyor...</span>
                      <span>%{uploadProgress}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                      <div 
                        className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {settings.videoUrl && (
              <div className="aspect-video bg-black rounded-lg overflow-hidden flex justify-center items-center" style={{ minHeight: '200px', maxWidth: '500px' }}>
                {useVideoTag ? (
                  <video
                    key={displayVideoUrl}
                    width="100%" height="100%"
                    src={displayVideoUrl}
                    controls
                    className="w-full h-full object-contain"
                    onError={(e) => console.error('Video yüklenemedi:', e)}
                  />
                ) : isPptxUrl && !isPublicUrl ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', width: '100%', background: '#f8fafc', padding: '24px', textAlign: 'center' }}>
                    <div style={{ width: 48, height: 48, borderRadius: '12px', background: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                      <BookOpen size={24} />
                    </div>
                    <h4 style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>Sunum Dosyası</h4>
                    <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px', maxWidth: '300px' }}>Bu sunum dosyası yerel ağda barındırıldığı için tarayıcı içinde doğrudan önizlenemez.</p>
                    <a href={displayVideoUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#fff', border: '1px solid #cbd5e1' }}>
                      <Download size={16} /> Sunumu İndir / Aç
                    </a>
                  </div>
                ) : (
                  <iframe
                    key={finalIframeUrl}
                    width="100%" height="100%"
                    src={finalIframeUrl}
                    frameBorder="0" allowFullScreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  />
                )}
              </div>
            )}
          </div>

          {/* SORU HAZIRLAMA SİHİRBAZI */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="icon-box-sm icon-violet"><ClipboardList size={16} /></div>
                <h3 className="text-lg font-bold">Soru Hazırlama Sihirbazı</h3>
              </div>
              <span className="text-sm font-bold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                Toplam: {questions.length} Soru
              </span>
            </div>

            <div className="space-y-6">
              {questions.length === 0 ? (
                <div className="p-8 border-2 border-dashed border-gray-200 rounded-xl text-center">
                  <p className="text-gray-500 mb-4">Henüz hiç soru eklemediniz.</p>
                  <button className="btn btn-secondary mx-auto" onClick={addQuestion}>
                    <Plus size={16} /> İlk Soruyu Ekle
                  </button>
                </div>
              ) : (
                questions.map((q, qIndex) => (
                  <div key={qIndex} className="p-5 border border-gray-100 rounded-xl bg-gray-50/50 hover:bg-white hover:shadow-sm transition-all group">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="mt-2 text-gray-300 cursor-move">
                        <GripVertical size={20} />
                      </div>
                      <div className="flex-1">
                        <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Soru {qIndex + 1}</label>
                        <input 
                          type="text" 
                          className="input w-full text-sm font-bold" 
                          placeholder="Soru metnini girin..." 
                          value={q.text} 
                          onChange={(e) => updateQuestionText(qIndex, e.target.value)}
                        />
                      </div>
                      <button 
                        className="btn btn-ghost text-red-500 hover:bg-red-50 p-2" 
                        onClick={() => removeQuestion(qIndex)}
                        title="Soruyu Sil"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="pl-10 space-y-3">
                      <label className="text-xs font-bold text-gray-500 uppercase block">Seçenekler (Doğru cevabı işaretleyin)</label>
                      {q.options.map((opt, oIndex) => (
                        <div key={oIndex} className="flex items-center gap-3 bg-white p-2 border border-gray-100 rounded-lg">
                          <input 
                            type="radio" 
                            name={`correct-${qIndex}`} 
                            checked={opt.correct || false}
                            onChange={() => setCorrectOption(qIndex, oIndex)}
                            className="w-4 h-4 text-violet-600 focus:ring-violet-500 ml-2 cursor-pointer"
                          />
                          <span className="font-mono text-xs font-bold text-gray-400 w-4 text-center">{opt.id.toUpperCase()}</span>
                          <input 
                            type="text" 
                            className="input flex-1 py-1 px-3 text-sm border-transparent hover:border-gray-200 focus:border-violet-500" 
                            placeholder="Seçenek metni..." 
                            value={opt.text}
                            onChange={(e) => updateOptionText(qIndex, oIndex, e.target.value)}
                          />
                          <button 
                            className="text-gray-400 hover:text-red-500 px-2"
                            onClick={() => removeOption(qIndex, oIndex)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                      
                      <button 
                        className="text-xs font-bold text-violet-600 hover:text-violet-800 flex items-center gap-1 mt-2"
                        onClick={() => addOption(qIndex)}
                      >
                        <Plus size={14} /> Yeni Seçenek Ekle
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {questions.length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-100">
                <button className="btn btn-secondary border-dashed border-2 bg-transparent hover:bg-gray-50 text-gray-600 w-full" onClick={addQuestion}>
                  <Plus size={16} /> Başka Soru Ekle
                </button>
              </div>
            )}

            <div className="mt-8 pt-6 border-t border-gray-200">
              <button
                className="btn btn-primary w-full shadow-lg shadow-violet-500/20"
                onClick={handleSaveSettings}
                disabled={saveLoading}
                style={{ fontSize: '15px', padding: '14px' }}
              >
                {saveLoading ? '⏳ Kaydediliyor...' : <><Save size={18} /> Tüm Eğitim İçeriğini Kaydet</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'reports' && (
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <h3 className="font-bold text-gray-700">Katılım Geçmişi</h3>
            <button 
              className="btn btn-secondary text-sm" 
              onClick={exportToCSV}
              disabled={results.length === 0}
            >
              <Download size={16} /> Raporu İndir (CSV)
            </button>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: 'var(--bg-inset)', borderBottom: '1px solid var(--border)' }}>
              <tr>
                <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-2)' }}>Personel</th>
                <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-2)' }}>E-posta</th>
                <th style={{ padding: '16px 24px', textAlign: 'center', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-2)' }}>Puan</th>
                <th style={{ padding: '16px 24px', textAlign: 'right', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-2)' }}>Tarih</th>
              </tr>
            </thead>
            <tbody>
              {results.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ padding: '32px 24px', textAlign: 'center', color: 'var(--text-3)', fontStyle: 'italic' }}>Henüz katılım raporu bulunmuyor.</td>
                </tr>
              ) : (
                results.map((r) => (
                  <tr key={r.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }} onMouseOver={(e) => e.currentTarget.style.background = 'var(--bg-surface)'} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div className="icon-box-sm icon-blue" style={{ width: '32px', height: '32px', borderRadius: '8px', flexShrink: 0 }}>
                          <User size={14} />
                        </div>
                        <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-1)' }}>{r.participantName}</span>
                      </div>
                    </td>
                    <td style={{ padding: '16px 24px', color: 'var(--text-2)', fontSize: '14px' }}>{r.email}</td>
                    <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                      <span style={{ 
                        padding: '6px 12px', borderRadius: '99px', fontSize: '12px', fontWeight: 800,
                        background: r.score >= 80 ? 'var(--green-soft)' : 'var(--amber-soft)',
                        color: r.score >= 80 ? 'var(--green-text)' : 'var(--amber-text)'
                      }}>
                        {r.score} / 100
                      </span>
                    </td>
                    <td style={{ padding: '16px 24px', textAlign: 'right', fontSize: '14px', color: 'var(--text-2)', fontWeight: 600 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                        <Calendar size={14} style={{ color: 'var(--text-3)' }} />
                        {new Date(r.completedAt).toLocaleDateString('tr-TR')}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
