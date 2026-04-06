import React, { useState, useCallback, useEffect } from 'react';
import { Upload as UploadIcon, FileVideo, X, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';

export default function Upload() {
  const navigate = useNavigate();
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'processing' | 'completed' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Robust redirection logic
  useEffect(() => {
    if (status === 'completed' && sessionId) {
      const timer = setTimeout(() => {
        console.log('Redirecting to session:', sessionId);
        navigate(`/session/${sessionId}`);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [status, sessionId, navigate]);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === 'video/mp4') {
      setFile(droppedFile);
      setError(null);
    } else {
      setError('Please upload a valid MP4 video file.');
    }
  }, []);

  const handleUpload = async () => {
    if (!file) return;
    setStatus('uploading');
    setError(null);
    setProgress(0);
    
    const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    const currentSessionId = crypto.randomUUID();

    try {
      console.log(`Starting chunked upload for ${file.name}. Total chunks: ${totalChunks}`);
      
      for (let i = 0; i < totalChunks; i++) {
        const start = i * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, file.size);
        const chunk = file.slice(start, end);
        
        const formData = new FormData();
        formData.append('chunk', chunk);
        formData.append('sessionId', currentSessionId);
        formData.append('chunkIndex', i.toString());
        formData.append('totalChunks', totalChunks.toString());
        formData.append('fileName', file.name);

        const response = await fetch('/api/upload/chunk', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const text = await response.text();
          throw new Error(`Chunk ${i} failed: ${text}`);
        }

        setProgress(Math.round(((i + 1) / totalChunks) * 90));
        
        // Small delay to prevent overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Finalize upload
      console.log('All chunks uploaded. Finalizing...');
      setStatus('processing');
      
      const completeResponse = await fetch('/api/upload/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: currentSessionId,
          fileName: file.name,
          totalChunks
        }),
      });

      const result = await completeResponse.json().catch(() => null);
      
      if (!completeResponse.ok || !result) {
        throw new Error(result?.message || 'Failed to finalize upload');
      }

      setProgress(100);
      setSessionId(result.sessionId);
      
      setTimeout(() => {
        setStatus('completed');
      }, 1000);

    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'An unexpected error occurred.');
      setStatus('error');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <header className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-slate-900">Analyze New Session</h1>
        <p className="text-slate-500">Upload an MP4 recording to start the non-AI analysis pipeline.</p>
      </header>

      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={cn(
          "relative border-2 border-dashed rounded-3xl p-12 transition-all duration-200 text-center",
          isDragging ? "border-blue-500 bg-blue-50" : "border-slate-200 bg-white",
          (status !== 'idle' && status !== 'error') && "pointer-events-none opacity-60"
        )}
      >
        <AnimatePresence mode="wait">
          {status === 'idle' || status === 'error' ? (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <div className={cn(
                "w-20 h-20 rounded-full flex items-center justify-center mx-auto",
                status === 'error' ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600"
              )}>
                {status === 'error' ? <AlertCircle size={32} /> : <UploadIcon size={32} />}
              </div>
              <div>
                <p className="text-lg font-semibold text-slate-900">
                  {file ? file.name : "Drag and drop your MP4 file here"}
                </p>
                <p className="text-slate-500 text-sm mt-1">
                  or click to browse from your computer
                </p>
              </div>
              <input
                type="file"
                accept="video/mp4"
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    setFile(e.target.files[0]);
                    setStatus('idle');
                    setError(null);
                  }
                }}
              />
            </motion.div>
          ) : (
            <motion.div
              key="active"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6"
            >
              <div className="w-20 h-20 bg-slate-50 text-slate-600 rounded-full flex items-center justify-center mx-auto">
                {status === 'uploading' || status === 'processing' ? (
                  <Loader2 size={32} className="animate-spin text-blue-600" />
                ) : (
                  <CheckCircle2 size={32} className="text-green-600" />
                )}
              </div>
              <div className="space-y-2">
                <p className="text-lg font-semibold text-slate-900">
                  {status === 'uploading' ? 'Uploading Video...' : 
                   status === 'processing' ? 'Running Analysis Pipeline...' : 
                   'Analysis Complete!'}
                </p>
                <div className="w-full max-w-md mx-auto h-2 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div 
                    className={cn("h-full transition-all duration-300", status === 'completed' ? "bg-green-500" : "bg-blue-600")}
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-sm text-slate-500">
                  {status === 'processing' ? 'Extracting features, OCR, and audio signals...' : 
                   status === 'completed' ? 'Redirecting to results...' : `${progress}%`}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {error && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-700"
        >
          <AlertCircle size={20} />
          <p className="text-sm font-medium">{error}</p>
        </motion.div>
      )}

      {file && (status === 'idle' || status === 'error') && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <FileVideo size={20} />
            </div>
            <div>
              <p className="font-medium text-slate-900 truncate max-w-[200px] md:max-w-md">{file.name}</p>
              <p className="text-xs text-slate-500">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => { setFile(null); setStatus('idle'); setError(null); }}
              className="p-2 text-slate-400 hover:text-red-500 transition-colors"
            >
              <X size={20} />
            </button>
            <button 
              onClick={handleUpload}
              className="px-6 py-2 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
            >
              Start Analysis
            </button>
          </div>
        </motion.div>
      )}

      {/* Pipeline Steps Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
        {[
          { title: 'Signal Extraction', desc: 'Audio diarization and prosody analysis using Librosa.' },
          { title: 'Visual Tracking', desc: 'Gaze and attention monitoring via MediaPipe.' },
          { title: 'Rule-Based Scoring', desc: 'Weighted metrics for engagement and quality.' }
        ].map((step, i) => (
          <div key={i} className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-sm font-bold text-slate-400 mb-4 border border-slate-100">
              {i + 1}
            </div>
            <h4 className="font-semibold text-slate-900 mb-1">{step.title}</h4>
            <p className="text-sm text-slate-500 leading-relaxed">{step.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
