import { useEffect, useState } from 'react';

export default function RiskGauge({ score, level }) {
  const [displayed, setDisplayed] = useState(0);

  // Animate score counting up
  useEffect(() => {
    let start = 0;
    const timer = setInterval(() => {
      start += 2;
      if (start >= score) {
        setDisplayed(score);
        clearInterval(timer);
      } else {
        setDisplayed(start);
      }
    }, 20);
    return () => clearInterval(timer);
  }, [score]);

  const color = {
    HIGH   : '#ff4444',
    MEDIUM : '#ffaa00',
    LOW    : '#00cc88'
  }[level] || '#00d4ff';

  const circumference = 2 * Math.PI * 80;
  const offset = circumference - (displayed / 100) * circumference;

  return (
    <div style={styles.container}>
      <svg width="200" height="200" style={styles.svg}>
        {/* Background circle */}
        <circle
          cx="100" cy="100" r="80"
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth="12"
        />
        {/* Progress circle */}
        <circle
          cx="100" cy="100" r="80"
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 100 100)"
          style={{ transition: 'stroke-dashoffset 0.1s ease', filter: `drop-shadow(0 0 8px ${color})` }}
        />
        {/* Score text */}
        <text x="100" y="90" textAnchor="middle" fill="#ffffff" fontSize="42" fontWeight="700">
          {displayed}
        </text>
        <text x="100" y="115" textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="13">
          out of 100
        </text>
        <text x="100" y="140" textAnchor="middle" fill={color} fontSize="16" fontWeight="700">
          {level} RISK
        </text>
      </svg>

      {/* Threshold labels */}
      <div style={styles.labels}>
        <span style={{ color: '#00cc88' }}>● Low (0-35)</span>
        <span style={{ color: '#ffaa00' }}>● Medium (35-60)</span>
        <span style={{ color: '#ff4444' }}>● High (60+)</span>
      </div>
    </div>
  );
}

const styles = {
  container : { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' },
  svg       : { filter: 'drop-shadow(0 0 20px rgba(0,212,255,0.2))' },
  labels    : { display: 'flex', gap: '16px', fontSize: '11px', color: 'rgba(255,255,255,0.5)', flexWrap: 'wrap', justifyContent: 'center' },
};