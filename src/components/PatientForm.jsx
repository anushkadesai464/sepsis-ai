import { useState } from 'react';
import { Heart, Activity, Thermometer, FlaskConical } from 'lucide-react';

const Field = ({ label, value, onChange, min, max, step = 1 }) => (
  <div style={styles.field}>
    <label style={styles.label}>{label}</label>
    <input
      type="number"
      value={value}
      onChange={e => onChange(parseFloat(e.target.value))}
      min={min} max={max} step={step}
      style={styles.input}
    />
  </div>
);

export default function PatientForm({ data, onChange }) {
  const set = (key) => (val) => onChange({ ...data, [key]: val });

  return (
    <div style={styles.container}>

      {/* Vitals */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>
          <Heart size={16} color="#00d4ff" />
          <span>Vital Signs</span>
        </div>
        <div style={styles.grid}>
          <Field label="Heart Rate (bpm)"    value={data.HR}     onChange={set('HR')}     min={0}  max={300} />
          <Field label="Systolic BP (mmHg)"  value={data.SBP}    onChange={set('SBP')}    min={0}  max={300} />
          <Field label="Diastolic BP (mmHg)" value={data.DBP}    onChange={set('DBP')}    min={0}  max={200} />
          <Field label="MAP (mmHg)"          value={data.MAP}    onChange={set('MAP')}    min={0}  max={200} />
          <Field label="SpO2 (%)"            value={data.O2Sat}  onChange={set('O2Sat')}  min={0}  max={100} />
          <Field label="Resp Rate (/min)"    value={data.Resp}   onChange={set('Resp')}   min={0}  max={60}  />
        </div>
      </div>

      {/* Labs */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>
          <FlaskConical size={16} color="#00d4ff" />
          <span>Lab Values</span>
        </div>
        <div style={styles.grid}>
          <Field label="WBC (K/µL)"       value={data.WBC}       onChange={set('WBC')}       min={0} max={100}  step={0.1} />
          <Field label="Glucose (mg/dL)"  value={data.Glucose}   onChange={set('Glucose')}   min={0} max={600}  step={0.1} />
          <Field label="Potassium (mEq/L)"value={data.Potassium} onChange={set('Potassium')} min={0} max={10}   step={0.1} />
        </div>
      </div>

      {/* Patient Info */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>
          <Activity size={16} color="#00d4ff" />
          <span>Patient Info</span>
        </div>
        <div style={styles.grid}>
          <Field label="Age (years)"           value={data.Age}          onChange={set('Age')}         min={0}    max={120} />
          <Field label="ICU Hours"             value={data.ICULOS}       onChange={set('ICULOS')}      min={0}    max={500} />
          <Field label="Hours Since Admission" value={data.HospAdmTime}  onChange={set('HospAdmTime')} min={-200} max={0}   />
          <div style={styles.field}>
            <label style={styles.label}>Gender</label>
            <select
              value={data.Gender}
              onChange={e => set('Gender')(parseInt(e.target.value))}
              style={styles.input}
            >
              <option value={0}>Male</option>
              <option value={1}>Female</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container    : { display: 'flex', flexDirection: 'column', gap: '20px' },
  section      : { backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(0,212,255,0.08)', borderRadius: '12px', padding: '16px' },
  sectionTitle : { display: 'flex', alignItems: 'center', gap: '8px', color: '#00d4ff', fontSize: '13px', fontWeight: '600', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '1px' },
  grid         : { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
  field        : { display: 'flex', flexDirection: 'column', gap: '4px' },
  label        : { color: 'rgba(255,255,255,0.5)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' },
  input        : { backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(0,212,255,0.15)', borderRadius: '8px', color: '#ffffff', padding: '8px 12px', fontSize: '14px', outline: 'none', width: '100%', boxSizing: 'border-box' },
};