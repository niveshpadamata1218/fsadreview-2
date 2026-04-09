import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerUser } from '../../api/auth';
import { extractApiError } from '../../utils/errors';

export default function Register() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [values, setValues] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'TEACHER',
  });

  const onChange = (key, value) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => ({ ...prev, [key]: '' }));
    setError('');
  };

  const validate = () => {
    const nextErrors = {};

    if (!values.name.trim()) nextErrors.name = 'Full name is required';
    if (!values.email.trim()) nextErrors.email = 'Email is required';
    if (!values.password) nextErrors.password = 'Password is required';
    if (values.password.length < 6) nextErrors.password = 'Password must be at least 6 characters';
    if (values.password !== values.confirmPassword) {
      nextErrors.confirmPassword = 'Passwords do not match';
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    setError('');

    try {
      await registerUser({
        name: values.name.trim(),
        email: values.email.trim(),
        password: values.password,
        role: values.role,
      });
      navigate(`/verify-otp?email=${encodeURIComponent(values.email.trim())}`);
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
        <h2>Create account</h2>
        <p className="small-muted">Build classroom peer review loops in one place.</p>

        <label>Full name</label>
        <input value={values.name} onChange={(e) => onChange('name', e.target.value)} />
        {fieldErrors.name ? <div className="field-error">{fieldErrors.name}</div> : null}

        <label>Email</label>
        <input value={values.email} onChange={(e) => onChange('email', e.target.value)} />
        {fieldErrors.email ? <div className="field-error">{fieldErrors.email}</div> : null}

        <label>Password</label>
        <div className="input-inline">
          <input
            type={showPassword ? 'text' : 'password'}
            value={values.password}
            onChange={(e) => onChange('password', e.target.value)}
          />
          <button className="btn btn-secondary" type="button" onClick={() => setShowPassword((p) => !p)}>
            {showPassword ? 'Hide' : 'Show'}
          </button>
        </div>
        {fieldErrors.password ? <div className="field-error">{fieldErrors.password}</div> : null}

        <label>Confirm password</label>
        <div className="input-inline">
          <input
            type={showConfirmPassword ? 'text' : 'password'}
            value={values.confirmPassword}
            onChange={(e) => onChange('confirmPassword', e.target.value)}
          />
          <button
            className="btn btn-secondary"
            type="button"
            onClick={() => setShowConfirmPassword((p) => !p)}
          >
            {showConfirmPassword ? 'Hide' : 'Show'}
          </button>
        </div>
        {fieldErrors.confirmPassword ? <div className="field-error">{fieldErrors.confirmPassword}</div> : null}

        <label>Role</label>
        <div className="role-grid">
          {['TEACHER', 'STUDENT'].map((role) => (
            <button
              key={role}
              type="button"
              className={`role-card ${values.role === role ? 'role-card-active' : ''}`}
              onClick={() => onChange('role', role)}
            >
              {role}
            </button>
          ))}
        </div>

        {error ? <div className="alert-error">{error}</div> : null}

        <button type="button" className="btn btn-primary full" disabled={loading} onClick={handleSubmit}>
          {loading ? 'Creating account...' : 'Create account'}
        </button>

        <div className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
