import { useState } from 'react';
import { submitOverride } from '../utils/api';
import { toast } from 'react-toastify';
import { ShieldAlert } from 'lucide-react';

export default function DoctorOverride({ onOverride }) {
  const [open,      setOpen]      = useState(false);
  const [diagnosis, setDiagnosis] = useState('');
  const [note,      setNote]      = useState('');
  const [loading,   setLoading]   = useState(false);

  const role = localStorage.getItem('role');
  if (role !== 'doctor') return null;

  const handleSubmit = async () => {
    if (!diagnosis || !note) {
      toast.error('Please fill in both fields');
      return;
    }
    setLoading(true);
    try {
      await submitOverride({
        prediction_id  : 'current',
        override_note  : note,
        final_diagnosis: diagnosis
      });
      toast.success('✅ Override recorded successfully');
      onOverride({ diagnosis, note });
      setOpen(false);
    } catch {
      toast.error('Override failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={() => setOpen(!open)} style={styles.trigger}>
        <ShieldAlert size={16} />
        Doctor Override
      </button>

      {open && (
        <div style={styles.panel}>
          <p style={styles.title}>⚕️ Manual Diagnosis Override</p>
          <p style={styles.subtitle}>
            Use when AI confidence is low or clinical judgement differs
          </p>

          <div style={styles.field}>
            <label style={styles.label}>Final Diagnosis</label>
            <select
              value={diagnosis}
              onChange={e => setDiagnosis(e.target.value)}
              style={styles.input}
            >
              <option value="">Select diagnosis...</option>
              <option value="Septic Shock">Septic Shock</option>
              <option value="Severe Sepsis">Severe Sepsis</option>
              <option value="Early Sepsis">Early Sepsis</option>
              <option value="No Sepsis">No Sepsis</option>
              <option value="Further Tests Required">Further Tests Required</option>
            </select>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Clinical Notes</label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Explain reason for override..."
              style={styles.textarea}
              rows={3}
            />
          </div>

          <div style={styles.buttons}>
            <button onClick={() => setOpen(false)} style={styles.cancel}>
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              style={styles.confirm}
              disabled={loading}
            >
              {loading ? 'Saving...' : '✅ Confirm Override'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  trigger  : { display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'rgba(255,170,0,0.1)', border: '1px solid rgba(255,170,0,0.3)', color: '#ffaa00', borderRadius: '8px', padding: '8px 16px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' },
  panel    : { backgroundColor: 'rgba(255,170,0,0.05)', border: '1px solid rgba(255,170,0,0.2)', borderRadius: '12px', padding: '20px', marginTop: '12px' },
  title    : { color: '#ffaa00', fontSize: '15px', fontWeight: '700', margin: '0 0 4px 0' },
  subtitle : { color: 'rgba(255,255,255,0.4)', fontSize: '12px', margin: '0 0 16px 0' },
  field    : { marginBottom: '12px' },
  label    : { color: 'rgba(255,255,255,0.5)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' },
  input    : { width: '100%', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,170,0,0.2)', borderRadius: '8px', color: '#ffffff', padding: '10px 12px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' },
  textarea : { width: '100%', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,170,0,0.2)', borderRadius: '8px', color: '#ffffff', padding: '10px 12px', fontSize: '13px', outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' },
  buttons  : { display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '16px' },
  cancel   : { backgroundColor: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', borderRadius: '8px', padding: '8px 16px', cursor: 'pointer', fontSize: '13px' },
  confirm  : { backgroundColor: '#ffaa00', color: '#0a0e1a', border: 'none', borderRadius: '8px', padding: '8px 20px', cursor: 'pointer', fontSize: '13px', fontWeight: '700' },
};