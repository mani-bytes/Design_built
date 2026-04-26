import { useState, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { useApp } from '../context/AppContext';
import { Upload, Link as LinkIcon, X, Image, Film, Play, Loader2, Zap, AlertCircle, FileText, Type } from 'lucide-react';
import toast from 'react-hot-toast';

export default function UploadZone({ onAnalysisStart }) {
  const { analyze, analyzing, uploadProgress, analysisStep } = useApp();
  const [mode, setMode] = useState('file'); // 'file' | 'url' | 'text'
  const [url, setUrl] = useState('');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [textInput, setTextInput] = useState('');
  const [textFileName, setTextFileName] = useState('');
  const [fileError, setFileError] = useState('');
  const videoRef = useRef();
  const textFileInputRef = useRef(null);

  const ACCEPTED = {
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'video/mp4': ['.mp4'],
    'video/webm': ['.webm'],
    'video/quicktime': ['.mov'],
    'text/plain': ['.txt'],
    'text/markdown': ['.md'],
  };

  const onDrop = (accepted, rejected) => {
    setFileError('');
    if (rejected.length > 0) {
      setFileError('Invalid file type. Accept: JPG, PNG, MP4, WEBM, MOV, TXT, MD');
      return;
    }
    if (accepted.length > 0) {
      const f = accepted[0];
      setFile(f);

      if (f.type.startsWith('text/') || /\.(txt|md)$/i.test(f.name)) {
        const reader = new FileReader();
        reader.onload = () => {
          const content = String(reader.result || '');
          setTextInput(content);
          setTextFileName(f.name);
        };
        reader.onerror = () => {
          setFileError('Unable to read text file. Please try another file.');
        };
        reader.readAsText(f);
        if (preview) {
          URL.revokeObjectURL(preview);
          setPreview(null);
        }
        setMode('text');
        return;
      }

      const mediaPreviewUrl = URL.createObjectURL(f);
      setPreview(mediaPreviewUrl);
      setMode('file');
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED,
    multiple: false,
    disabled: analyzing,
    maxSize: 100 * 1024 * 1024,
  });

  const clearFile = () => {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null);
    setPreview(null);
    setTextFileName('');
  };

  const handleTextFilePick = (event) => {
    const picked = event.target.files?.[0];
    if (!picked) return;

    if (!(picked.type.startsWith('text/') || /\.(txt|md)$/i.test(picked.name))) {
      setFileError('Invalid text file. Accept: TXT, MD');
      return;
    }

    setFileError('');
    const reader = new FileReader();
    reader.onload = () => {
      const content = String(reader.result || '');
      setTextInput(content);
      setTextFileName(picked.name);
      setFile(picked);
    };
    reader.onerror = () => {
      setFileError('Unable to read text file. Please try another file.');
    };
    reader.readAsText(picked);
  };

  const handleAnalyze = async () => {
    let mediaInfo = null;

    if (mode === 'file') {
      if (!file) { toast.error('Please select a file first'); return; }
      const isVideo = file.type.startsWith('video');
      mediaInfo = {
        name: file.name,
        type: isVideo ? 'video' : 'image',
        previewUrl: preview,
      };
    } else if (mode === 'url') {
      if (!url.trim()) { toast.error('Please enter a URL'); return; }
      if (!/^https?:\/\/.+/.test(url.trim())) { toast.error('Please enter a valid URL starting with http:// or https://'); return; }
      const isVideo = /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url);
      mediaInfo = { name: url, type: isVideo ? 'video' : 'image', previewUrl: url };
    } else {
      const trimmed = textInput.trim();
      if (!trimmed) { toast.error('Please add text to analyze'); return; }
      mediaInfo = {
        name: textFileName || 'Text Input',
        type: 'text',
        text: trimmed,
      };
    }

    try {
      const report = await analyze(mediaInfo);
      onAnalysisStart?.(report);
      toast.success('Analysis complete!', { icon: '🎯' });
    } catch {
      toast.error('Analysis failed. Please try again.');
    }
  };

  const isImage = file && file.type.startsWith('image');
  const isVideo = file && file.type.startsWith('video');

  return (
    <div className="glass-card" style={{ padding: '1.75rem' }}>
      <div style={{ marginBottom: '1.25rem' }}>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'white', marginBottom: 4 }}>Upload Media for Analysis</h2>
        <p style={{ color: 'var(--color-muted)', fontSize: '0.875rem' }}>Upload images, videos, add text, or provide a URL to analyze for bias</p>
      </div>

      {/* Mode Toggle */}
      <div style={{ display: 'flex', gap: 8, marginBottom: '1.25rem', background: 'var(--color-surface-alt)', borderRadius: '0.75rem', padding: 4 }}>
        {[
          { id: 'file', label: 'File Upload', icon: Upload },
          { id: 'url', label: 'URL Input', icon: LinkIcon },
          { id: 'text', label: 'Text Input', icon: Type },
        ].map((item) => (
          <button
            key={item.id}
            id={`mode-${item.id}`}
            onClick={() => setMode(item.id)}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              padding: '0.5rem', borderRadius: '0.625rem', border: 'none', cursor: 'pointer',
              fontSize: '0.875rem', fontWeight: 500, transition: 'all 0.2s ease', fontFamily: 'inherit',
              background: mode === item.id ? 'var(--color-surface)' : 'transparent',
              color: mode === item.id ? 'white' : 'var(--color-muted)',
              boxShadow: mode === item.id ? '0 2px 8px rgba(0,0,0,0.3)' : 'none',
            }}
          >
            <item.icon size={15} /> {item.label}
          </button>
        ))}
      </div>

      {mode === 'file' ? (
        <>
          {/* Drop zone */}
          {!file && (
            <div
              {...getRootProps()}
              className={`upload-zone ${isDragActive ? 'active' : ''}`}
              style={{ padding: '2.5rem', textAlign: 'center', outline: 'none' }}
            >
              <input {...getInputProps()} id="file-upload-input" />
              <div style={{
                width: 56, height: 56, borderRadius: '1rem', margin: '0 auto 1rem',
                background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {isDragActive ? <Zap size={24} style={{ color: '#6366F1' }} /> : <Upload size={24} style={{ color: '#6366F1' }} />}
              </div>
              <p style={{ color: 'white', fontWeight: 600, marginBottom: 4 }}>
                {isDragActive ? 'Drop your file here' : 'Drag & drop your media here'}
              </p>
              <p style={{ color: 'var(--color-muted)', fontSize: '0.8rem', marginBottom: '1rem' }}>
                or click to browse files
              </p>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
                {['JPG', 'PNG', 'MP4', 'WEBM', 'MOV', 'TXT', 'MD'].map(t => (
                  <span key={t} className="badge" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-muted)' }}>{t}</span>
                ))}
              </div>
              <p style={{ color: 'var(--color-muted)', fontSize: '0.75rem', marginTop: 8 }}>Max 100MB</p>
            </div>
          )}

          {fileError && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#EF4444', fontSize: '0.8rem', marginTop: 8 }}>
              <AlertCircle size={14} /> {fileError}
            </div>
          )}

          {/* File preview */}
          {file && preview && (
            <div style={{ position: 'relative' }}>
              <div style={{ borderRadius: '0.875rem', overflow: 'hidden', background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)' }}>
                {isImage && (
                  <img src={preview} alt="preview" style={{ width: '100%', maxHeight: 280, objectFit: 'cover', display: 'block' }} />
                )}
                {isVideo && (
                  <video ref={videoRef} src={preview} style={{ width: '100%', maxHeight: 280, display: 'block' }} controls />
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
                {isImage ? <Image size={15} style={{ color: '#6366F1' }} /> : <Film size={15} style={{ color: '#8B5CF6' }} />}
                <span style={{ color: 'white', fontSize: '0.875rem', fontWeight: 500, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</span>
                <span style={{ color: 'var(--color-muted)', fontSize: '0.8rem' }}>{(file.size / 1024 / 1024).toFixed(1)} MB</span>
                <button onClick={clearFile} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-muted)', padding: 4, borderRadius: 4 }}>
                  <X size={16} />
                </button>
              </div>
            </div>
          )}
        </>
      ) : mode === 'url' ? (
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Media URL
          </label>
          <div style={{ position: 'relative' }}>
            <LinkIcon size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted)' }} />
            <input
              id="url-input"
              type="url"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://example.com/image.jpg or video.mp4"
              className="form-input"
              style={{ paddingLeft: '2.5rem' }}
            />
          </div>
          <p style={{ color: 'var(--color-muted)', fontSize: '0.78rem', marginTop: 6 }}>
            Supports image and video URLs (MP4, WEBM, MOV)
          </p>
        </div>
      ) : (
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Text Content
          </label>
          <textarea
            id="text-input"
            value={textInput}
            onChange={e => setTextInput(e.target.value)}
            placeholder="Paste text content here for analysis..."
            className="form-input"
            rows={7}
            style={{ resize: 'vertical', minHeight: 140 }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => textFileInputRef.current?.click()}
              className="btn"
              style={{ padding: '0.45rem 0.75rem', fontSize: '0.8rem' }}
            >
              <FileText size={14} />
              Upload TXT / MD
            </button>
            <input
              ref={textFileInputRef}
              type="file"
              accept=".txt,.md,text/plain,text/markdown"
              onChange={handleTextFilePick}
              style={{ display: 'none' }}
            />
            <span style={{ color: 'var(--color-muted)', fontSize: '0.78rem' }}>
              {textFileName ? `Loaded: ${textFileName}` : `${textInput.trim().length} characters`}
            </span>
          </div>
        </div>
      )}

      {/* Upload progress */}
      {analyzing && (
        <div style={{ marginTop: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
              {analysisStep}
            </span>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#6366F1' }}>{uploadProgress}%</span>
          </div>
          <div style={{ background: 'var(--color-surface-alt)', borderRadius: 9999, height: 6, overflow: 'hidden' }}>
            <div
              className="progress-shimmer"
              style={{ height: '100%', borderRadius: 9999, width: `${uploadProgress}%`, transition: 'width 0.5s ease' }}
            />
          </div>
        </div>
      )}

      {/* Analyze button */}
      <button
        id="analyze-btn"
        onClick={handleAnalyze}
        disabled={analyzing}
        className="btn btn-primary"
        style={{ width: '100%', padding: '0.875rem', fontSize: '0.95rem', marginTop: '1.25rem' }}
      >
        {analyzing ? (
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
            Analyzing...
          </span>
        ) : (
          <>
            <Play size={16} />
            Analyze for Bias
          </>
        )}
      </button>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
