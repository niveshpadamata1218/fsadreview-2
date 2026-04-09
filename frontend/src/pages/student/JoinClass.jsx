import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { joinClass } from '../../api/student';
import { extractApiError } from '../../utils/errors';

export default function JoinClass() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [values, setValues] = useState({ classCode: '', password: '' });

  const onChange = (key, value) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => ({ ...prev, [key]: '' }));
    setError('');
  };

  const validate = () => {
    const nextErrors = {};
    if (!values.classCode.trim()) nextErrors.classCode = 'Class code is required';
    if (!values.password.trim()) nextErrors.password = 'Password is required';
    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      setLoading(true);
      await joinClass({
        classCode: values.classCode.trim().toUpperCase(),
        password: values.password.trim(),
      });
      navigate('/student/classes');
    } catch (err) {
      const parsed = extractApiError(err);
      setError(parsed.message);
      setFieldErrors((prev) => ({ ...prev, ...parsed.fieldErrors }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="stack-lg">
      <h2>Enter class credentials</h2>

      <div className="card form-card">
        <label>Class ID</label>
        <input value={values.classCode} onChange={(e) => onChange('classCode', e.target.value)} />
        {fieldErrors.classCode ? <div className="field-error">{fieldErrors.classCode}</div> : null}

        <label>Password</label>
        <input value={values.password} onChange={(e) => onChange('password', e.target.value)} />
        {fieldErrors.password ? <div className="field-error">{fieldErrors.password}</div> : null}

        {error ? <div className="alert-error">{error}</div> : null}

        <button type="button" className="btn btn-primary" disabled={loading} onClick={handleSubmit}>
          {loading ? 'Joining...' : 'Join class'}
        </button>
      </div>
    </div>
  );
}
