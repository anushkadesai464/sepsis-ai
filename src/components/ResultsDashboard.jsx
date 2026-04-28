import RiskGauge from './RiskGauge';
import { AlertTriangle, CheckCircle, Activity, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function ResultsDashboard({ result, explanation, confidence, needsReview }) {
  if (!result) return (
    <div style={styles.empty}>
      <Activity size={48} color="rgba(0,212,255,0.3)" />
      <p style={styles.emptyText}>Fill in patient data and click</p>
      <p style={styles.emptyHighlight}>🔍 Analyze Now</p>
      <p style={styles.emptyText}>to see results</p>
    </div>
  );

  const { score, level, color, action, structured, xray } = result;

  // Chart data for vitals breakdown
  const chartData = [
    { name: 'Vitals+Labs', value: structured, fill: '#00d4ff' },
    { name: 'X-ray CNN',   value: xray,       fill: '#7c3aed' },
    { name: 'Final Score', value: score,       fill: color === 'red' ? '#ff4444' : color === 'orange' ? '#ffaa00' : '#00cc88' },
  ];

  return (
    <div style={styles.container}>

      {/* Low confidence warning */}
      {needsReview && (
        <div style={styles.reviewAlert}>
          <AlertTriangle size={18} color="#ffaa00" />
          <div>
            <p style={styles.reviewTitle}>Low Confidence — Doctor Review Required</p>
            <p style={styles.reviewSub}>Model confidence: {confidence}% · Human verification needed</p>
          </div>
        </div>
      )}

      {/* Risk gauge */}
      <div style={styles.gaugeSection}>
        <RiskGauge score={score} level={level} />
      </div>

      {/* Score breakdown chart */}
      <div style={styles.section}>
        <p style={styles.sectionTitle}>
          <TrendingUp size={14} /> Score Breakdown
        </p>
        <ResponsiveContainer width="100%" height={120}>
          <BarChart data={chartData} layout="vertical">
            <XAxis type="number" domain={[0,100]} tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} />
            <YAxis type="category" dataKey="name" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} width={80} />
            <Tooltip
              contentStyle={{ backgroundColor: '#0a0e1a', border: '1px solid rgba(0,212,255,0.2)', borderRadius: '8px', color: '#fff' }}
            />
            <Bar dataKey="value" radius={4}>
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Clinical action */}
      <div style={{
        ...styles.actionBox,
        borderColor: level === 'HIGH' ? 'rgba(255,68,68,0.3)' : level === 'MEDIUM' ? 'rgba(255,170,0,0.3)' : 'rgba(0,204,136,0.3)',
        backgroundColor: level === 'HIGH' ? 'rgba(255,68,68,0.05)' : level === 'MEDIUM' ? 'rgba(255,170,0,0.05)' : 'rgba(0,204,136,0.05)',
      }}>
        <p style={styles.actionTitle}>🏥 Recommended Action</p>
        <p style={styles.actionText}>{action}</p>
      </div>

      {/* Abnormal flags */}
      {explanation?.flags?.length > 0 && (
        <div style={styles.section}>
          <p style={styles.sectionTitle}>⚠️ Abnormal Values Detected</p>
          <div style={styles.flags}>
            {explanation.flags.map((f, i) => (
              <div key={i} style={styles.flag}>
                <span style={{ color: f.status === 'HIGH' ? '#ff4444' : '#ffaa00' }}>
                  {f.icon} {f.feature}
                </span>
                <span style={styles.flagVal}>{f.value}</span>
                <span style={styles.flagNormal}>Normal: {f.normal}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Condition */}
      {explanation?.condition && (
        <div style={styles.condition}>
          <CheckCircle size={16} color="#00d4ff" />
          <div>
            <p style={styles.conditionTitle}>{explanation.condition}</p>
            <p style={styles.conditionAdvice}>{explanation.advice}</p>
          </div>
        </div>
      )}

      {/* Clinical actions */}
      {explanation?.actions?.length > 0 && (
        <div style={styles.section}>
          <p style={styles.sectionTitle}>💊 Suggested Clinical Actions</p>
          {explanation.actions.map((a, i) => (
            <div key={i} style={styles.actionItem}>
              <span style={styles.actionNum}>{i + 1}</span>
              <span style={styles.actionItemText}>{a}</span>
            </div>
          ))}
        </div>
      )}

      {/* Confidence */}
      <div style={styles.confidence}>
        <span style={styles.confLabel}>Model Confidence</span>
        <div style={styles.confBar}>
          <div style={{ ...styles.confFill, width: `${confidence}%`, backgroundColor: confidence >= 80 ? '#00cc88' : confidence >= 65 ? '#ffaa00' : '#ff4444' }} />
        </div>
        <span style={styles.confVal}>{confidence}%</span>
      </div>

    </div>
  );
}

const styles = {
  container      : { display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' },
  empty          : { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '400px', gap: '8px' },
  emptyText      : { color: 'rgba(255,255,255,0.3)', fontSize: '14px', margin: 0 },
  emptyHighlight : { color: '#00d4ff', fontSize: '16px', fontWeight: '600', margin: 0 },
  gaugeSection   : { display: 'flex', justifyContent: 'center', padding: '16px 0' },
  section        : { backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(0,212,255,0.08)', borderRadius: '12px', padding: '14px' },
  sectionTitle   : { color: '#00d4ff', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px', margin: '0 0 12px 0' },
  reviewAlert    : { display: 'flex', gap: '12px', alignItems: 'flex-start', backgroundColor: 'rgba(255,170,0,0.08)', border: '1px solid rgba(255,170,0,0.3)', borderRadius: '12px', padding: '14px' },
  reviewTitle    : { color: '#ffaa00', fontSize: '13px', fontWeight: '600', margin: '0 0 4px 0' },
  reviewSub      : { color: 'rgba(255,255,255,0.4)', fontSize: '12px', margin: 0 },
  actionBox      : { border: '1px solid', borderRadius: '12px', padding: '14px' },
  actionTitle    : { color: 'rgba(255,255,255,0.7)', fontSize: '12px', fontWeight: '600', margin: '0 0 6px 0', textTransform: 'uppercase', letterSpacing: '1px' },
  actionText     : { color: '#ffffff', fontSize: '14px', margin: 0, lineHeight: '1.5' },
  flags          : { display: 'flex', flexDirection: 'column', gap: '8px' },
  flag           : { display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '8px', padding: '8px 12px' },
  flagVal        : { color: '#ffffff', fontWeight: '600', marginLeft: 'auto' },
  flagNormal     : { color: 'rgba(255,255,255,0.3)', fontSize: '11px' },
  condition      : { display: 'flex', gap: '10px', alignItems: 'flex-start', backgroundColor: 'rgba(0,212,255,0.05)', border: '1px solid rgba(0,212,255,0.15)', borderRadius: '12px', padding: '14px' },
  conditionTitle : { color: '#00d4ff', fontSize: '14px', fontWeight: '700', margin: '0 0 4px 0' },
  conditionAdvice: { color: 'rgba(255,255,255,0.5)', fontSize: '12px', margin: 0 },
  actionItem     : { display: 'flex', gap: '10px', alignItems: 'flex-start', marginBottom: '8px' },
  actionNum      : { backgroundColor: 'rgba(0,212,255,0.15)', color: '#00d4ff', borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '700', flexShrink: 0 },
  actionItemText : { color: 'rgba(255,255,255,0.7)', fontSize: '13px', lineHeight: '1.5' },
  confidence     : { display: 'flex', alignItems: 'center', gap: '10px' },
  confLabel      : { color: 'rgba(255,255,255,0.4)', fontSize: '12px', whiteSpace: 'nowrap' },
  confBar        : { flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '4px', height: '6px', overflow: 'hidden' },
  confFill       : { height: '100%', borderRadius: '4px', transition: 'width 1s ease' },
  confVal        : { color: 'rgba(255,255,255,0.6)', fontSize: '12px', whiteSpace: 'nowrap' },
};