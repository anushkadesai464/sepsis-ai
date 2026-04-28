import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Image } from 'lucide-react';

export default function XrayUpload({ onUpload }) {
  const [preview, setPreview] = useState(null);
  const [file,    setFile]    = useState(null);

  const onDrop = useCallback((accepted) => {
    const f = accepted[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    onUpload(f);
  }, [onUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept : { 'image/*': ['.jpg', '.jpeg', '.png'] },
    maxFiles: 1
  });

  const remove = () => {
    setFile(null);
    setPreview(null);
    onUpload(null);
  };

  return (
    <div style={styles.container}>
      <p style={styles.label}>
        <Image size={16} color="#00d4ff" /> Chest X-ray (Optional)
      </p>

      {!preview ? (
        <div
          {...getRootProps()}
          style={{
            ...styles.dropzone,
            borderColor: isDragActive ? '#00d4ff' : 'rgba(0,212,255,0.2)',
            backgroundColor: isDragActive ? 'rgba(0,212,255,0.08)' : 'rgba(255,255,255,0.02)'
          }}
        >
          <input {...getInputProps()} />
          <Upload size={32} color="rgba(0,212,255,0.5)" />
          <p style={styles.dropText}>
            {isDragActive ? 'Drop X-ray here...' : 'Drag & drop X-ray'}
          </p>
          <p style={styles.dropSub}>or click to browse · JPG, PNG</p>
        </div>
      ) : (
        <div style={styles.preview}>
          <img src={preview} alt="X-ray" style={styles.image} />
          <button onClick={remove} style={styles.remove}>
            <X size={16} /> Remove
          </button>
          <p style={styles.filename}>{file?.name}</p>
        </div>
      )}
    </div>
  );
}

const styles = {
  container : { display: 'flex', flexDirection: 'column', gap: '8px' },
  label     : { color: '#00d4ff', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 },
  dropzone  : { border: '2px dashed', borderRadius: '12px', padding: '32px 16px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' },
  dropText  : { color: 'rgba(255,255,255,0.6)', fontSize: '14px', margin: 0 },
  dropSub   : { color: 'rgba(255,255,255,0.3)', fontSize: '12px', margin: 0 },
  preview   : { position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' },
  image     : { width: '100%', maxHeight: '200px', objectFit: 'contain', borderRadius: '8px', border: '1px solid rgba(0,212,255,0.2)' },
  remove    : { display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(255,68,68,0.1)', border: '1px solid rgba(255,68,68,0.3)', color: '#ff4444', borderRadius: '6px', padding: '4px 12px', cursor: 'pointer', fontSize: '12px' },
  filename  : { color: 'rgba(255,255,255,0.4)', fontSize: '11px', margin: 0 },
};