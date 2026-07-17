import React, { useState, useCallback, useRef } from 'react';
import { UploadCloud, FileType, CheckCircle2, AlertCircle, X, FolderOutput, RefreshCw, AlertTriangle, MessageCircle, Instagram, Globe, Youtube, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

function formatBytes(bytes, decimals = 2) {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export default function App() {
  const [files, setFiles] = useState([]);
  const [targetExt, setTargetExt] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [globalError, setGlobalError] = useState(null);
  const [activeTab, setActiveTab] = useState('converter');
  const [copiedDiscord, setCopiedDiscord] = useState(false);
  const fileInputRef = useRef(null);

  const copyDiscord = () => {
    navigator.clipboard.writeText('MADBLOX252#2834');
    setCopiedDiscord(true);
    setTimeout(() => setCopiedDiscord(false), 2000);
  };

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const addFiles = useCallback((newFiles) => {
    const newItems = newFiles.map(file => ({
      id: crypto.randomUUID(),
      file,
      status: 'pending'
    }));
    setFiles(prev => [...prev, ...newItems]);
    setGlobalError(null);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(Array.from(e.dataTransfer.files));
    }
  }, [addFiles]);

  const removeFile = useCallback((id) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  }, []);

  const updateFileStatus = useCallback((id, status, errorMsg) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, status, errorMsg } : f));
  }, []);

  const processFiles = async () => {
    if (!targetExt) return;
    setGlobalError(null);

    let ext = targetExt.trim();
    if (!ext.startsWith('.')) ext = '.' + ext;

    try {
      setIsProcessing(true);
      
      let dirHandle = null;
      let useFallback = false;
      
      if ('showDirectoryPicker' in window) {
        try {
          dirHandle = await window.showDirectoryPicker({ mode: 'readwrite' });
        } catch (err) {
          if (err.name === 'AbortError') {
             setIsProcessing(false);
             return;
          }
          if (err.name === 'SecurityError' || (err.message && err.message.includes('Cross origin'))) {
            useFallback = true;
            console.warn("File System Access API blocked (likely in iframe). Falling back to standard downloads.");
          } else {
            throw err;
          }
        }
      } else {
        useFallback = true;
      }

      for (let i = 0; i < files.length; i++) {
        const item = files[i];
        if (item.status === 'success') continue;

        updateFileStatus(item.id, 'processing');

        try {
          const originalName = item.file.name;
          const lastDotIndex = originalName.lastIndexOf('.');
          const baseName = lastDotIndex !== -1 ? originalName.substring(0, lastDotIndex) : originalName;
          const newName = `${baseName}${ext}`;

          let finalFile = item.file;
          
          // Image Transcoding (deep convert)
          if (item.file.type.startsWith('image/') && ['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) {
            finalFile = await new Promise((resolve) => {
              const img = new Image();
              img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                
                let mimeType = 'image/png';
                if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg';
                else if (ext === '.webp') mimeType = 'image/webp';
                
                canvas.toBlob((blob) => {
                  resolve(blob ? blob : item.file);
                }, mimeType, 0.95);
              };
              img.onerror = () => resolve(item.file);
              img.src = URL.createObjectURL(item.file);
            });
          }

          if (useFallback) {
             const url = URL.createObjectURL(finalFile);
             const a = document.createElement('a');
             a.href = url;
             a.download = newName;
             document.body.appendChild(a);
             a.click();
             document.body.removeChild(a);
             setTimeout(() => URL.revokeObjectURL(url), 1000);
             await new Promise(r => setTimeout(r, 200));
          } else {
             const fileHandle = await dirHandle.getFileHandle(newName, { create: true });
             const writable = await fileHandle.createWritable();
             await writable.write(finalFile);
             await writable.close();
          }

          updateFileStatus(item.id, 'success');
        } catch (err) {
          console.error("Error writing file:", err);
          updateFileStatus(item.id, 'error', err.message || 'Failed to convert file');
        }
      }
    } catch (err) {
      console.error("Process failed:", err);
      setGlobalError(`Operation failed: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const pendingCount = files.filter(f => f.status === 'pending' || f.status === 'error').length;
  const successCount = files.filter(f => f.status === 'success').length;

  return (
    <div className="min-h-screen bg-slate-950 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(244,114,182,0.15),rgba(2,6,23,1))] text-slate-200 font-sans selection:bg-rose-500/30 selection:text-rose-200 pb-20">
      {/* Header */}
      <header className="px-8 py-5 border-b border-white/10 bg-slate-900/40 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-tr from-rose-400 to-pink-500 p-2.5 rounded-xl text-white shadow-lg shadow-rose-500/20">
              <Sparkles size={22} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-100 leading-tight">Lumivert</h1>
            </div>
          </div>
          
          <div className="flex items-center gap-2 bg-slate-800/50 p-1 rounded-full border border-white/10 shadow-sm">
            <button 
              onClick={() => setActiveTab('converter')}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${activeTab === 'converter' ? 'bg-slate-700/80 text-rose-400 shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Converter
            </button>
            <button 
              onClick={() => setActiveTab('credits')}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${activeTab === 'credits' ? 'bg-slate-700/80 text-rose-400 shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Credits
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 mt-8 space-y-6">
        {activeTab === 'credits' ? (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="credits-panel bg-slate-900/40 backdrop-blur-xl rounded-3xl border border-white/10 p-8 shadow-[0_8px_32px_rgba(0,0,0,0.2)] max-w-2xl mx-auto"
          >
            <div className="credits-logo">
              <Sparkles className="mx-auto" size={48} />
            </div>
            <h2 className="credits-title">Lumivert</h2>
            <div className="credits-subtitle">Batch file extension converter</div>
            
            <div className="credits-divider"></div>
            
            <div className="credits-block">
              <span className="credits-label">Developer</span>
              <div>
                <div className="credits-name">MADBLOX252</div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 text-left">
              <a href="https://madblox252.framer.website" target="_blank" rel="noreferrer" className="flex items-center gap-4 p-4 bg-slate-800/50 hover:bg-slate-700/80 rounded-2xl transition-all border border-white/10 shadow-sm text-slate-300 hover:text-rose-400 group">
                <div className="bg-rose-500/10 p-2.5 rounded-xl group-hover:bg-rose-500/20 group-hover:scale-110 transition-all border border-rose-500/20">
                  <Globe size={22} className="text-rose-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="block font-semibold">Portfolio</span>
                  <span className="block text-xs text-slate-500 truncate">madblox252.framer.website</span>
                </div>
              </a>
              <a href="https://www.youtube.com/@madblox252" target="_blank" rel="noreferrer" className="flex items-center gap-4 p-4 bg-slate-800/50 hover:bg-slate-700/80 rounded-2xl transition-all border border-white/10 shadow-sm text-slate-300 hover:text-rose-400 group">
                <div className="bg-rose-500/10 p-2.5 rounded-xl group-hover:bg-rose-500/20 group-hover:scale-110 transition-all border border-rose-500/20">
                  <Youtube size={22} className="text-rose-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="block font-semibold">YouTube</span>
                  <span className="block text-xs text-slate-500 truncate">@madblox252</span>
                </div>
              </a>
              <a href="https://www.instagram.com/madblox252" target="_blank" rel="noreferrer" className="flex items-center gap-4 p-4 bg-slate-800/50 hover:bg-slate-700/80 rounded-2xl transition-all border border-white/10 shadow-sm text-slate-300 hover:text-rose-400 group">
                <div className="bg-rose-500/10 p-2.5 rounded-xl group-hover:bg-rose-500/20 group-hover:scale-110 transition-all border border-rose-500/20">
                  <Instagram size={22} className="text-rose-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="block font-semibold">Instagram</span>
                  <span className="block text-xs text-slate-500 truncate">@madblox252</span>
                </div>
              </a>
              <button onClick={copyDiscord} className="flex items-center gap-4 p-4 bg-slate-800/50 hover:bg-slate-700/80 transition-all rounded-2xl border border-white/10 shadow-sm text-slate-300 w-full text-left group">
                <div className="bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/20 group-hover:bg-rose-500/20 group-hover:scale-110 transition-all">
                  {copiedDiscord ? <CheckCircle2 size={22} className="text-emerald-400" /> : <MessageCircle size={22} className="text-rose-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="block font-semibold">Discord</span>
                  <span className={`block text-xs truncate transition-colors ${copiedDiscord ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {copiedDiscord ? 'Copied!' : 'MADBLOX252#2834'}
                  </span>
                </div>
              </button>
            </div>
            
            <div className="credits-footer mt-8">
              Designed & Built by MADBLOX252
            </div>
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >

        {globalError && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex gap-3 text-red-800">
            <AlertCircle className="flex-shrink-0 mt-0.5" size={20} />
            <p className="text-sm">{globalError}</p>
          </div>
        )}

        {/* Control Panel */}
        <div className="bg-slate-900/40 backdrop-blur-xl rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.2)] border border-white/10 p-6 sm:p-8 flex flex-col sm:flex-row gap-5 items-end">
          <div className="flex-1 w-full">
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              Target Extension
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-mono text-lg select-none">.</span>
              <input 
                type="text" 
                placeholder="mp4, csv, json, txt..." 
                value={targetExt}
                onChange={e => setTargetExt(e.target.value.replace(/[^a-zA-Z0-9]/g, '').toLowerCase())}
                className="w-full pl-9 pr-4 py-3 bg-slate-950/50 border border-white/10 rounded-xl focus:ring-4 focus:ring-rose-500/20 focus:border-rose-400 focus:bg-slate-900/80 transition-all font-mono text-slate-100 placeholder:text-slate-500 text-lg outline-none shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)]"
              />
            </div>
          </div>
          <button 
            onClick={processFiles}
            disabled={isProcessing || pendingCount === 0 || !targetExt}
            className="w-full sm:w-auto px-8 py-3 bg-rose-500 hover:bg-rose-600 active:bg-rose-700 disabled:bg-slate-800/50 disabled:text-slate-500 disabled:border-white/10 disabled:cursor-not-allowed text-white font-semibold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 border border-transparent"
          >
            {isProcessing ? (
              <>
                <RefreshCw size={20} className="animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <FolderOutput size={20} />
                Convert {pendingCount > 0 ? pendingCount : ''} Files
              </>
            )}
          </button>
        </div>

        {/* Dropzone */}
        <div 
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-3xl p-12 flex flex-col items-center justify-center transition-all duration-200 backdrop-blur-sm ${
            isDragging 
              ? 'border-rose-400 bg-rose-500/10 scale-[1.01]' 
              : 'border-white/10 bg-slate-900/40 hover:border-rose-400/50 hover:bg-slate-900/60 cursor-pointer shadow-[0_8px_32px_rgba(0,0,0,0.2)]'
          }`}
        >
          <input 
            type="file" 
            multiple 
            className="hidden" 
            ref={fileInputRef}
            onChange={e => {
              if (e.target.files) addFiles(Array.from(e.target.files));
              e.target.value = '';
            }}
          />
          <div className={`p-4 rounded-2xl mb-4 transition-colors ${isDragging ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-slate-800/80 text-slate-400 border border-white/10 shadow-sm'}`}>
            <UploadCloud size={36} strokeWidth={2} />
          </div>
          <h3 className="text-xl font-semibold text-slate-100 mb-2">
            {isDragging ? 'Drop files to add' : 'Drop files here or click to browse'}
          </h3>
          <p className="text-slate-400 text-sm max-w-sm text-center">
            You can select multiple files of any format. They will be processed efficiently in batches.
          </p>
        </div>

        {/* File List */}
        {files.length > 0 && (
          <div className="bg-slate-900/40 backdrop-blur-xl rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.2)] border border-white/10 overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-slate-900/40">
              <div className="flex items-center gap-3">
                <h3 className="font-semibold text-slate-100">Queue</h3>
                <span className="bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold px-2 py-0.5 rounded-full">
                  {files.length}
                </span>
                {successCount > 0 && (
                  <span className="text-xs font-medium text-emerald-400">
                    {successCount} completed
                  </span>
                )}
              </div>
              <button 
                onClick={() => setFiles([])}
                disabled={isProcessing}
                className="text-sm text-slate-400 hover:text-slate-200 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Clear All
              </button>
            </div>
            
            <ul className="divide-y divide-white/5 max-h-[500px] overflow-y-auto p-2">
              <AnimatePresence initial={false}>
                {files.map(item => {
                  const baseName = item.file.name.substring(0, item.file.name.lastIndexOf('.')) || item.file.name;
                  const ext = targetExt ? `.${targetExt}` : '';
                  const newName = `${baseName}${ext}`;

                  return (
                    <motion.li 
                      key={item.id}
                      initial={{ opacity: 0, scale: 0.98, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.98, y: 10, transition: { duration: 0.15 } }}
                      transition={{ duration: 0.2 }}
                      className="flex items-center gap-4 px-4 py-3 hover:bg-slate-800/50 rounded-xl transition-colors group"
                    >
                      <div className="flex-shrink-0">
                        {item.status === 'success' ? (
                          <div className="bg-emerald-500/20 p-1.5 rounded-full text-emerald-400 border border-emerald-500/30">
                            <CheckCircle2 size={18} strokeWidth={2.5} />
                          </div>
                        ) : item.status === 'error' ? (
                          <div className="bg-red-500/20 p-1.5 rounded-full text-red-400 border border-red-500/30">
                            <AlertCircle size={18} strokeWidth={2.5} />
                          </div>
                        ) : item.status === 'processing' ? (
                          <div className="p-1.5 text-rose-400">
                            <RefreshCw size={18} strokeWidth={2.5} className="animate-spin" />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-full border-2 border-slate-700 flex items-center justify-center">
                            <div className="w-2 h-2 rounded-full bg-slate-600" />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-slate-200 truncate" title={item.file.name}>
                            {item.file.name}
                          </span>
                          {targetExt && item.status !== 'success' && (
                            <>
                              <span className="text-slate-600 flex-shrink-0">→</span>
                              <span className="text-sm font-semibold text-rose-400 truncate flex-shrink-0" title={newName}>
                                {newName}
                              </span>
                            </>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-xs">
                          <span className="text-slate-400 font-medium">
                            {formatBytes(item.file.size)}
                          </span>
                          {item.errorMsg && (
                            <>
                              <span className="text-slate-600">•</span>
                              <span className="text-red-400 font-medium">{item.errorMsg}</span>
                            </>
                          )}
                          {item.status === 'success' && (
                            <>
                              <span className="text-slate-600">•</span>
                              <span className="text-emerald-400 font-medium">Saved</span>
                            </>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile(item.id);
                        }}
                        disabled={isProcessing && item.status === 'processing'}
                        className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-0"
                      >
                        <X size={18} />
                      </button>
                    </motion.li>
                  )
                })}
              </AnimatePresence>
            </ul>
          </div>
        )}
          </motion.div>
        )}
      </main>
    </div>
  );
}
