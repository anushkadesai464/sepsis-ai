import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../utils/api';
import { toast } from 'react-toastify';
import { Activity, Lock, User } from 'lucide-react';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await login(username, password);
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('role',  data.role);
      localStorage.setItem('name',  data.name);
      toast.success(`Welcome, ${data.name}!`);
      navigate('/dashboard');
    } catch {
      toast.error('Invalid credentials. Try doctor1 / doctor123');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      {/* Background grid */}
      <div style={styles.grid} />

      {/* Card */}
      <div style={styles.card}>
        {/* Logo */}
        <div style={styles.logo}>
          <Activity size={40} color="#00d4ff" />
          <h1 style={styles.title}>SepsisAI</h1>
        </div>
        <p style={styles.subtitle}>
          AI-Powered Early Deterioration Detection
        </p>

        {/* Form */}
        <form onSubmit={handleLogin} style={styles.form}>
          <div style={styles.inputGroup}>
            <User size={18} color="#00d4ff" style={styles.icon} />
            <input
              style={styles.input}
              type="text"
              placeholder="Username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
            />
          </div>

          <div style={styles.inputGroup}>
            <Lock size={18} color="#00d4ff" style={styles.icon} />
            <input
              style={styles.input}
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            style={{
              ...styles.button,
              opacity: loading ? 0.7 : 1
            }}
            type="submit"
            disabled={loading}
          >
            {loading ? '🔄 Logging in...' : '🔐 Login'}
          </button>
        </form>

        {/* Demo credentials */}
        <div style={styles.demo}>
          <p style={styles.demoTitle}>Demo Credentials:</p>
          <p style={styles.demoText}>👨‍⚕️ Doctor: doctor1 / doctor123</p>
          <p style={styles.demoText}>👩‍⚕️ Nurse: nurse1 / nurse123</p>
          <p style={styles.demoText}>⚙️ Admin: admin1 / admin123</p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight       : '100vh',
    backgroundColor : '#0a0e1a',
    display         : 'flex',
    alignItems      : 'center',
    justifyContent  : 'center',
    position        : 'relative',
    overflow        : 'hidden',
  },
  grid: {
    position        : 'absolute',
    inset           : 0,
    backgroundImage : `
      linear-gradient(rgba(0,212,255,0.05) 1px, transparent 1px),
      linear-gradient(90deg, rgba(0,212,255,0.05) 1px, transparent 1px)
    `,
    backgroundSize  : '40px 40px',
  },
  card: {
    backgroundColor : 'rgba(255,255,255,0.03)',
    border          : '1px solid rgba(0,212,255,0.2)',
    borderRadius    : '20px',
    padding         : '48px 40px',
    width           : '400px',
    backdropFilter  : 'blur(20px)',
    boxShadow       : '0 0 40px rgba(0,212,255,0.1)',
    zIndex          : 1,
  },
  logo: {
    display         : 'flex',
    alignItems      : 'center',
    gap             : '12px',
    marginBottom    : '8px',
  },
  title: {
    color           : '#ffffff',
    fontSize        : '32px',
    fontWeight      : '700',
    margin          : 0,
    letterSpacing   : '2px',
  },
  subtitle: {
    color           : 'rgba(255,255,255,0.4)',
    fontSize        : '13px',
    marginBottom    : '36px',
    marginTop       : '4px',
  },
  form: {
    display         : 'flex',
    flexDirection   : 'column',
    gap             : '16px',
  },
  inputGroup: {
    position        : 'relative',
    display         : 'flex',
    alignItems      : 'center',
  },
  icon: {
    position        : 'absolute',
    left            : '14px',
    zIndex          : 1,
  },
  input: {
    width           : '100%',
    padding         : '14px 14px 14px 44px',
    backgroundColor : 'rgba(255,255,255,0.05)',
    border          : '1px solid rgba(0,212,255,0.2)',
    borderRadius    : '10px',
    color           : '#ffffff',
    fontSize        : '14px',
    outline         : 'none',
    boxSizing       : 'border-box',
  },
  button: {
    padding         : '14px',
    backgroundColor : '#00d4ff',
    color           : '#0a0e1a',
    border          : 'none',
    borderRadius    : '10px',
    fontSize        : '16px',
    fontWeight      : '700',
    cursor          : 'pointer',
    marginTop       : '8px',
    transition      : 'all 0.2s',
  },
  demo: {
    marginTop       : '28px',
    padding         : '16px',
    backgroundColor : 'rgba(0,212,255,0.05)',
    borderRadius    : '10px',
    border          : '1px solid rgba(0,212,255,0.1)',
  },
  demoTitle: {
    color           : '#00d4ff',
    fontSize        : '12px',
    fontWeight      : '600',
    marginBottom    : '8px',
    margin          : '0 0 8px 0',
  },
  demoText: {
    color           : 'rgba(255,255,255,0.5)',
    fontSize        : '12px',
    margin          : '4px 0',
  },
};