import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Activity, LogOut, FileText, Edit3 } from 'lucide-react';
import PatientForm    from '../components/PatientForm';
import UploadReport   from '../components/UploadReport';
import XrayUpload     from '../components/XrayUpload';
import ResultsDashboard from '../components/ResultsDashboard';
import DoctorOverride from '../components/DoctorOverride';
import { predict, predictXray } from '../utils/api';

const DEFAULT = {
  HR: 88, O2Sat: 97, SBP: 120, MAP: 90, DBP: 75,
  Resp: 18, Age: 55, Gender: 0, ICULOS: 6,
  HospAdmTime: -2, WBC: 8.0, Glucose: 110.0, Potassium: 4.0
};

export default function Dashboard() {
  const [inputMode, setInputMode] = useState('manual');
  const [formData,  setFormData]  = useState(DEFAULT);
  const [xrayFile,  setXrayFile]  = useState(null);
  const [result,    setResult]    = useState(null);
  const [explanation, setExplanation] = useState(null);
  const [confidence,  setConfidence]  = useState(null);
  const [needsReview, setNeedsReview] = useState(false);
  const [loading,   setLoading]   = useState(false);
  const navigate = useNavigate();

  const name = localStorage.getItem('name') || 'Doctor';
  const role = localStorage.getItem('role') || 'doctor';

  const handleExtracted = (values) => {
    setFormData(prev => ({ ...prev, ...values }));
  };

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      // Get structured prediction
      const res = await predict(formData);

// Clinical rule-based score boost
let score = res.result.score;
let boost = 0;
if (formData.HR > 100)    boost += 10;
if (formData.SBP < 90)    boost += 20;
if (formData.O2Sat < 95)  boost += 15;
if (formData.Resp > 22)   boost += 10;
if (formData.WBC > 12)    boost += 10;
if (formData.Potassium > 5.0) boost += 5;

score = Math.min(100, score + boost);
const level = score >= 60 ? 'HIGH' : score >= 35 ? 'MEDIUM' : 'LOW';
const color = level === 'HIGH' ? 'red' : level === 'MEDIUM' ? 'orange' : 'green';
const action = level === 'HIGH'
  ? '⚠️ Immediate clinical review recommended. Notify physician now.'
  : level === 'MEDIUM'
  ? '⚡ Monitor closely. Consider further diagnostic workup.'
  : '✅ Continue routine monitoring. Re-assess if symptoms change.';

setResult({ ...res.result, score, level, color, action });
      setExplanation(res.explanation);
      setConfidence(res.confidence);
      setNeedsReview(res.needs_review);

      // Get xray prediction if uploaded
      if (xrayFile) {
  const xrayRes = await predictXray(xrayFile);
  setResult(prev => {
    const newScore = Math.round(
      (prev.structured / 100) * 0.6 * 100 + xrayRes.xray_score * 0.4
    );
    return {
      ...prev,
      xray : xrayRes.xray_score,
      score: newScore,
      level: newScore >= 60 ? 'HIGH' : newScore >= 35 ? 'MEDIUM' : 'LOW'
    };
  });
}

      toast.success('✅ Analysis complete!');
    } catch (err) {
      toast.error('Analysis failed. Check if backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  return (
    <div style={styles.container}>
      {/* Background */}
      <div style={styles.bg} />

      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <Activity size={28} color="#00d4ff" />
          <span style={styles.headerTitle}>SepsisAI</span>
          <span style={styles.headerSub}>Early Deterioration Detection</span>
        </div>
        <div style={styles.headerRight}>
          <span style={styles.userBadge}>
            {role === 'doctor' ? '👨‍⚕️' : '👩‍⚕️'} {name}
          </span>
          <button onClick={handleLogout} style={styles.logout}>
            <LogOut size={14} /> Logout
          </button>
        </div>
      </div>

      {/* Main layout */}
      <div style={styles.main}>

        {/* LEFT — Input */}
        <div style={styles.leftPanel}>

          {/* Input mode toggle */}
          <div style={styles.modeToggle}>
            <button
              onClick={() => setInputMode('manual')}
              style={{ ...styles.modeBtn, ...(inputMode === 'manual' ? styles.modeBtnActive : {}) }}
            >
              <Edit3 size={14} /> Manual Entry
            </button>
            <button
              onClick={() => setInputMode('upload')}
              style={{ ...styles.modeBtn, ...(inputMode === 'upload' ? styles.modeBtnActive : {}) }}
            >
              <FileText size={14} /> Upload Report
            </button>
          </div>

          {/* Upload mode */}
          {inputMode === 'upload' && (
            <div style={styles.uploadSection}>
              <UploadReport onExtracted={handleExtracted} />
              <p style={styles.uploadNote}>
                Values auto-filled below — review before analyzing
              </p>
            </div>
          )}

          {/* Patient form (always visible) */}
          <PatientForm data={formData} onChange={setFormData} />

          {/* X-ray upload */}
          <XrayUpload onUpload={setXrayFile} />

          {/* Analyze button */}
          <button
            onClick={handleAnalyze}
            disabled={loading}
            style={{ ...styles.analyzeBtn, opacity: loading ? 0.7 : 1 }}
          >
            {loading ? (
              <>⏳ Analyzing...</>
            ) : (
              <>🔍 Analyze Now</>
            )}
          </button>

          {/* Doctor override */}
          {result && (
            <DoctorOverride onOverride={(data) => {
              toast.success(`Override: ${data.diagnosis}`);
            }} />
          )}
        </div>

        {/* RIGHT — Results */}
        <div style={styles.rightPanel}>
          <div style={styles.resultsHeader}>
            <Activity size={18} color="#00d4ff" />
            <span style={styles.resultsTitle}>Analysis Results</span>
          </div>
          <ResultsDashboard
            result={result}
            explanation={explanation}
            confidence={confidence}
            needsReview={needsReview}
          />
        </div>
      </div>
    </div>
  );
}

const styles = {
  container    : { minHeight: '100vh', backgroundColor: '#0a0e1a', position: 'relative', overflow: 'hidden' },
  bg           : { position: 'fixed', inset: 0, backgroundImage: 'linear-gradient(rgba(0,212,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.03) 1px, transparent 1px)', backgroundSize: '40px 40px', pointerEvents: 'none' },
  header       : { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 32px', borderBottom: '1px solid rgba(0,212,255,0.1)', backgroundColor: 'rgba(10,14,26,0.8)', backdropFilter: 'blur(20px)', position: 'sticky', top: 0, zIndex: 100 },
  headerLeft   : { display: 'flex', alignItems: 'center', gap: '12px' },
  headerTitle  : { color: '#ffffff', fontSize: '22px', fontWeight: '700', letterSpacing: '2px' },
  headerSub    : { color: 'rgba(255,255,255,0.3)', fontSize: '12px', display: 'none' },
  headerRight  : { display: 'flex', alignItems: 'center', gap: '12px' },
  userBadge    : { color: 'rgba(255,255,255,0.7)', fontSize: '13px', backgroundColor: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.15)', borderRadius: '20px', padding: '6px 14px' },
  logout       : { display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', borderRadius: '8px', padding: '6px 14px', cursor: 'pointer', fontSize: '13px' },
  main         : { display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '24px', padding: '24px 32px', maxWidth: '1400px', margin: '0 auto' },
  leftPanel    : { display: 'flex', flexDirection: 'column', gap: '16px' },
  modeToggle   : { display: 'flex', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(0,212,255,0.1)', borderRadius: '10px', padding: '4px', gap: '4px' },
  modeBtn      : { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '500', backgroundColor: 'transparent', color: 'rgba(255,255,255,0.4)', transition: 'all 0.2s' },
  modeBtnActive: { backgroundColor: 'rgba(0,212,255,0.15)', color: '#00d4ff', border: '1px solid rgba(0,212,255,0.2)' },
  uploadSection: { display: 'flex', flexDirection: 'column', gap: '8px' },
  uploadNote   : { color: 'rgba(255,255,255,0.3)', fontSize: '11px', margin: 0, textAlign: 'center' },
  analyzeBtn   : { padding: '16px', backgroundColor: '#00d4ff', color: '#0a0e1a', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: '700', cursor: 'pointer', letterSpacing: '1px', transition: 'all 0.2s', boxShadow: '0 0 20px rgba(0,212,255,0.3)' },
  rightPanel   : { backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(0,212,255,0.1)', borderRadius: '16px', padding: '24px', overflowY: 'auto', maxHeight: 'calc(100vh - 120px)' },
  resultsHeader: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid rgba(0,212,255,0.1)' },
  resultsTitle : { color: '#ffffff', fontSize: '16px', fontWeight: '600' },
};