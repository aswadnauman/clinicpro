import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Heart, Lock, User } from 'lucide-react';

const Login = () => {
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(credentials.username, credentials.password);
    
    if (!result.success) {
      setError(result.error);
    }
    
    setLoading(false);
  };

  const handleChange = (e) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '1rem'
    }}>
      <div style={{
        background: 'white',
        padding: '3rem',
        borderRadius: '1rem',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        width: '100%',
        maxWidth: '400px'
      }}>
        {/* Logo and Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            marginBottom: '1rem'
          }}>
            <Heart size={32} color="#3b82f6" />
            <h1 style={{
              fontSize: '1.75rem',
              fontWeight: 'bold',
              color: '#1e40af'
            }}>
              SmallCare
            </h1>
          </div>
          <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
            Clinic Management System
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit}>
          {error && (
            <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
              {error}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">
              <User size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />
              Username
            </label>
            <input
              type="text"
              name="username"
              value={credentials.username}
              onChange={handleChange}
              className="form-input"
              placeholder="Enter your username"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              <Lock size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />
              Password
            </label>
            <input
              type="password"
              name="password"
              value={credentials.password}
              onChange={handleChange}
              className="form-input"
              placeholder="Enter your password"
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            style={{ width: '100%', marginTop: '1rem' }}
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Demo Credentials */}
        <div style={{
          marginTop: '2rem',
          padding: '1rem',
          background: '#f9fafb',
          borderRadius: '0.5rem',
          fontSize: '0.875rem'
        }}>
          <h4 style={{ fontWeight: '600', marginBottom: '0.5rem', color: '#374151' }}>
            Demo Credentials:
          </h4>
          <div style={{ color: '#6b7280' }}>
            <div><strong>Admin:</strong> admin / admin123</div>
            <div><strong>Doctor:</strong> dr_smith / admin123</div>
            <div><strong>Receptionist:</strong> receptionist / admin123</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;