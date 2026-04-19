import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthService from '../services/AuthService';
import { LogIn, User, Lock, Loader2, GraduationCap, School, Shield } from 'lucide-react';

const LoginPage = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('STUDENT');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await AuthService.login(identifier, password);
      
      // Role validation to make selector "effective"
      if (data.role !== role) {
        setError('Invalid username or password.');
        setLoading(false);
        return;
      }

      login(data, data.token);
      
      if (data.role === 'ADMIN') navigate('/admin');
      else if (data.role === 'ADMINISTRATIVE') navigate('/administrative');
      else if (data.role === 'ACADEMICIAN') navigate('/academician');
      else navigate('/student');
      
    } catch (err) {
      setError('Invalid username or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container" style={styles.container}>
      <div className="glass-card" style={styles.card}>
        <div style={styles.header}>
          <div style={{ 
            ...styles.iconBadge, 
            background: role === 'STUDENT' ? 'var(--accent-student)' : 
                       role === 'ACADEMICIAN' ? 'var(--accent-academician)' : 
                       role === 'ADMINISTRATIVE' ? 'var(--accent-admin)' : '#f85149' 
          }}>
            {role === 'STUDENT' ? <GraduationCap size={32} color="white" /> : 
             role === 'ACADEMICIAN' ? <School size={32} color="white" /> : 
             role === 'ADMINISTRATIVE' ? <User size={32} color="white" /> : <Shield size={32} color="white" />}
          </div>
          <h1 style={styles.title}>OBS Portal</h1>
          <p style={styles.subtitle}>
            Welcome back, please login to your account
          </p>
        </div>

        <form onSubmit={handleLogin} style={styles.form}>
          {error && <div style={styles.error}>{error}</div>}

          <div style={styles.inputGroup}>
            <label style={styles.label}>Username</label>
            <div style={styles.inputWrapper}>
              <User size={18} style={styles.inputIcon} />
              <input
                type="text"
                placeholder="johndoe"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                style={styles.input}
                required
              />
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <div style={styles.inputWrapper}>
              <Lock size={18} style={styles.inputIcon} />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={styles.input}
                required
              />
            </div>
          </div>

          <button type="submit" disabled={loading} style={{ 
            ...styles.loginButton,
            background: role === 'STUDENT' ? 'var(--accent-student)' : 
                       role === 'ACADEMICIAN' ? 'var(--accent-academician)' : 
                       role === 'ADMINISTRATIVE' ? 'var(--accent-admin)' : '#f85149',
            boxShadow: `0 0 20px ${role === 'STUDENT' ? 'rgba(35, 134, 54, 0.3)' : 
                                   role === 'ACADEMICIAN' ? 'rgba(137, 87, 229, 0.3)' : 
                                   role === 'ADMINISTRATIVE' ? 'rgba(210, 153, 34, 0.3)' : 'rgba(248, 81, 73, 0.3)'}`
          }}>
            {loading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <>
                <LogIn size={20} />
                <span>Sign In</span>
              </>
            )}
          </button>
        </form>

        {/* Role Selector Bar */}
        <div style={styles.roleSelector}>
          <div 
            onClick={() => setRole('STUDENT')}
            style={{ 
              ...styles.roleOption, 
              background: role === 'STUDENT' ? 'var(--accent-student)' : 'transparent',
              color: role === 'STUDENT' ? 'white' : 'var(--text-dim)'
            }}
          >
            Student
          </div>
          <div 
            onClick={() => setRole('ACADEMICIAN')}
            style={{ 
              ...styles.roleOption, 
              background: role === 'ACADEMICIAN' ? 'var(--accent-academician)' : 'transparent',
              color: role === 'ACADEMICIAN' ? 'white' : 'var(--text-dim)'
            }}
          >
            Academician
          </div>
          <div 
            onClick={() => setRole('ADMINISTRATIVE')}
            style={{ 
              ...styles.roleOption, 
              background: role === 'ADMINISTRATIVE' ? 'var(--accent-admin)' : 'transparent',
              color: role === 'ADMINISTRATIVE' ? 'white' : 'var(--text-dim)'
            }}
          >
            Staff
          </div>
          <div 
            onClick={() => setRole('ADMIN')}
            style={{ 
              ...styles.roleOption, 
              background: role === 'ADMIN' ? '#f85149' : 'transparent',
              color: role === 'ADMIN' ? 'white' : 'var(--text-dim)'
            }}
          >
            Admin
          </div>
        </div>

        <div style={styles.footer}>
          <p style={styles.footerText}>
            Authorized Access Only
          </p>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0a0c10 0%, #161b22 100%)',
    padding: '1rem',
  },
  card: {
    width: '100%',
    maxWidth: '450px',
    padding: '2.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '2rem',
  },
  header: {
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.5rem',
  },
  iconBadge: {
    width: '64px',
    height: '64px',
    borderRadius: '16px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: '1rem',
    transition: 'all 0.3s ease',
    boxShadow: '0 8px 16px rgba(0, 0, 0, 0.4)',
  },
  title: {
    fontSize: '1.8rem',
    fontWeight: '800',
    background: 'linear-gradient(to right, #fff, #8b949e)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  subtitle: {
    color: 'var(--text-secondary)',
    fontSize: '0.9rem',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.2rem',
  },
  inputGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1rem',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  label: {
    fontSize: '0.85rem',
    fontWeight: '600',
    color: 'var(--text-secondary)',
    marginLeft: '4px',
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: '12px',
    color: 'var(--text-dim)',
  },
  input: {
    width: '100%',
    background: 'rgba(0, 0, 0, 0.2)',
    border: '1px solid var(--border-glass)',
    borderRadius: '12px',
    padding: '0.8rem 1rem 0.8rem 2.5rem',
    color: 'white',
    fontSize: '1rem',
    outline: 'none',
    transition: 'border-color 0.2s ease',
  },
  loginButton: {
    marginTop: '1rem',
    height: '50px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '0.8rem',
    color: 'white',
    fontSize: '1rem',
    fontWeight: '700',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  error: {
    background: 'rgba(248, 81, 73, 0.1)',
    border: '1px solid #f85149',
    color: '#f85149',
    padding: '0.8rem',
    borderRadius: '8px',
    fontSize: '0.85rem',
    textAlign: 'center',
  },
  success: {
    background: 'rgba(35, 134, 54, 0.1)',
    border: '1px solid #238636',
    color: '#238636',
    padding: '0.8rem',
    borderRadius: '8px',
    fontSize: '0.85rem',
    textAlign: 'center',
  },
  footer: {
    textAlign: 'center',
    marginTop: '0.5rem',
  },
  footerText: {
    color: 'var(--text-secondary)',
    fontSize: '0.85rem',
  },
  link: {
    fontWeight: '700',
    cursor: 'pointer',
    marginLeft: '5px',
  },
  roleSelector: {
    display: 'flex',
    background: 'rgba(255, 255, 255, 0.03)',
    borderRadius: '12px',
    padding: '4px',
    border: '1px solid var(--border-glass)',
    marginTop: '0.5rem'
  },
  roleOption: {
    flex: 1,
    padding: '0.6rem',
    textAlign: 'center',
    fontSize: '0.8rem',
    fontWeight: '700',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  }
};

export default LoginPage;
