import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loginUser } from '../../api/auth';
import { useAuth } from '../../context/AuthContext';
import { extractApiError } from '../../utils/errors';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [values, setValues] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const onChange = (key, value) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => ({ ...prev, [key]: '' }));
    setError('');
  };

  const validate = () => {
    const nextErrors = {};
    if (!values.email.trim()) nextErrors.email = 'Email is required';
    if (!values.password) nextErrors.password = 'Password is required';
    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      setLoading(true);
      const response = await loginUser(values);
      const payload = response.data;
      login(payload.token, {
        userId: payload.userId,
        name: payload.name,
        email: payload.email,
        role: payload.role,
      });
      navigate(payload.role === 'TEACHER' ? '/teacher' : '/student');
    } catch (err) {
      const parsed = extractApiError(err);
      setError(parsed.message);
      setFieldErrors((prev) => ({ ...prev, ...parsed.fieldErrors }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2>Welcome back</h2>
        <p className="small-muted">Sign in to continue reviewing and collaborating.</p>

        <label>Email</label>
        <input value={values.email} onChange={(e) => onChange('email', e.target.value)} />
        {fieldErrors.email ? <div className="field-error">{fieldErrors.email}</div> : null}

        <label>Password</label>
        <input
          type="password"
          value={values.password}
          onChange={(e) => onChange('password', e.target.value)}
        />
        {fieldErrors.password ? <div className="field-error">{fieldErrors.password}</div> : null}

        {error ? <div className="alert-error">{error}</div> : null}

        <button type="button" className="btn btn-primary full" disabled={loading} onClick={handleSubmit}>
          {loading ? 'Signing in...' : 'Sign in'}
        </button>

        <div className="auth-footer">
          Don't have an account? <Link to="/register">Create one</Link>
        </div>
      </div>
    </div>
  );
}
