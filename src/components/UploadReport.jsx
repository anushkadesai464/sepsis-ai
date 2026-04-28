import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { FileText, Upload, CheckCircle, X } from 'lucide-react';
import { extractReport } from '../utils/api';
import { toast } from 'react-toastify';

export default function UploadReport({ onExtracted }) {
  const [loading,   setLoading]   = useState(false);
  const [extracted, setExtracted] = useState(null);
  const [file,      setFile]      = useState(null);

  const onDrop = useCallback(async (accepted) => {
    const f = accepted[0];
    if (!f) return;
    setFile(f);
    setLoading(true);
    try {
      const result = await extractReport(f);
      setExtracted(result.extracted_values);
      onExtracted(result.extracted_values);
      toast.success(`✅ Extracted ${result.fields_found} values!`);
    } catch {
      toast.error('Could not extract. Please enter manually.');
    } finally {
      setLoading(false);
    }
  }, [onExtracted]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept  : { 'application/pdf': ['.pdf'], 'image/*': ['.jpg','.jpeg','.png'] },
    maxFiles: 1
  });

  const clear = () => { setFile(null); setExtracted(null); onExtracted({}); };

  return (
    <div style={styles.container}>
      {!file ? (
        <div
          {...getRootProps()}
          style={{
            ...styles.dropzone,
            borderColor     : isDragActive ? '#00d4ff' : 'rgba(0,212,255,0.2)',
            backgroundColor : isDragActive ? 'rgba(0,212,255,0.08)' : 'rgba(255,255,255,0.02)'
          }}
        >
          <input {...getInputProps()} />
          <FileText size={36} color="rgba(0,212,255,0.6)" />
          <p style={styles.dropText}>
            {isDragActive ? 'Drop report here...' : 'Drag & drop lab report'}
          </p>
          <p style={styles.dropSub}>PDF or Image · Auto-extracts values</p>
          <div style={styles.uploadBtn}>
            <Upload size={14} /> Browse Files
          </div>
        </div>
      ) : (
        <div style={styles.result}>
          {loading ? (
            <div style={styles.loading}>
              <div style={styles.spinner} />
              <p style={styles.loadingText}>Extracting values...</p>
            </div>
          ) : (
            <>
              <div style={styles.successHeader}>
                <CheckCircle size={20} color="#00cc88" />
                <span style={styles.successText}>
                  Extracted {Object.keys(extracted || {}).length} values
                </span>
                <button onClick={clear} style={styles.clearBtn}>
                  <X size={14} />
                </button>
              </div>
              <div style={styles.values}>
                {Object.entries(extracted || {}).map(([k, v]) => (
                  <div key={k} style={styles.valueTag}>
                    <span style={styles.valueKey}>{k}</span>
                    <span style={styles.valueVal}>{v}</span>
                  </div>
                ))}
              </div>
              <p style={styles.editNote}>✏️ Review values below — edit if needed</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}

const styles = {
  container    : { width: '100%' },
  dropzone     : { border: '2px dashed', borderRadius: '12px', padding: '36px 20px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' },
  dropText     : { color: 'rgba(255,255,255,0.7)', fontSize: '15px', margin: 0, fontWeight: '500' },
  dropSub      : { color: 'rgba(255,255,255,0.3)', fontSize: '12px', margin: 0 },
  uploadBtn    : { display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.3)', color: '#00d4ff', borderRadius: '8px', padding: '8px 20px', fontSize: '13px', marginTop: '4px' },
  result       : { backgroundColor: 'rgba(0,204,136,0.05)', border: '1px solid rgba(0,204,136,0.2)', borderRadius: '12px', padding: '16px' },
  loading      : { display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'center', padding: '16px' },
  spinner      : { width: '24px', height: '24px', border: '3px solid rgba(0,212,255,0.2)', borderTop: '3px solid #00d4ff', borderRadius: '50%', animation: 'spin 1s linear infinite' },
  loadingText  : { color: 'rgba(255,255,255,0.6)', fontSize: '14px', margin: 0 },
  successHeader: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' },
  successText  : { color: '#00cc88', fontSize: '14px', fontWeight: '600', flex: 1 },
  clearBtn     : { background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: '2px' },
  values       : { display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' },
  valueTag     : { backgroundColor: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.15)', borderRadius: '6px', padding: '4px 10px', display: 'flex', gap: '6px' },
  valueKey     : { color: 'rgba(255,255,255,0.5)', fontSize: '11px' },
  valueVal     : { color: '#00d4ff', fontSize: '11px', fontWeight: '600' },
  editNote     : { color: 'rgba(255,255,255,0.4)', fontSize: '11px', margin: 0 },
};