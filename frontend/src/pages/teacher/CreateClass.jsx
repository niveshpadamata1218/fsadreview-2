import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createClass } from '../../api/teacher';
import { extractApiError } from '../../utils/errors';

export default function CreateClass() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const [values, setValues] = useState({
    name: '',
    subject: '',
    gradeLevel: '',
    classFocus: '',
  });

  const onChange = (key, value) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => ({ ...prev, [key]: '' }));
    setError('');
  };

  const validate = () => {
    const nextErrors = {};
    if (!values.name.trim()) nextErrors.name = 'Class name is required';
    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      setLoading(true);
      const response = await createClass(values);
      navigate(`/teacher/classes/${response.data.classCode}`);
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
      <h2>New class space</h2>

      <div className="card form-card">
        <label>Class name</label>
        <input value={values.name} onChange={(e) => onChange('name', e.target.value)} />
        {fieldErrors.name ? <div className="field-error">{fieldErrors.name}</div> : null}

        <label>Subject</label>
        <input value={values.subject} onChange={(e) => onChange('subject', e.target.value)} />

        <label>Grade level</label>
        <input value={values.gradeLevel} onChange={(e) => onChange('gradeLevel', e.target.value)} />

        <label>Class focus</label>
        <textarea value={values.classFocus} onChange={(e) => onChange('classFocus', e.target.value)} />

        {error ? <div className="alert-error">{error}</div> : null}

        <button type="button" className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
          {loading ? 'Creating class...' : 'Create class'}
        </button>
      </div>
    </div>
  );
}
