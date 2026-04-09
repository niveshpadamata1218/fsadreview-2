import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { resendOtp, verifyOtp } from '../../api/auth';
import { useAuth } from '../../context/AuthContext';
import { extractApiError } from '../../utils/errors';

const BOX_COUNT = 6;

export default function VerifyOtp() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [searchParams] = useSearchParams();
  const email = useMemo(() => searchParams.get('email') || '', [searchParams]);

  const [digits, setDigits] = useState(Array(BOX_COUNT).fill(''));
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState('');

  const refs = useRef([]);

  useEffect(() => {
    if (!email) {
      navigate('/register');
    }
  }, [email, navigate]);

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const timer = setInterval(() => setCooldown((p) => p - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const updateDigit = (index, value) => {
    if (!/^\d?$/.test(value)) return;

    setDigits((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });

    if (value && index < BOX_COUNT - 1) {
      refs.current[index + 1]?.focus();
    }
  };

  const onKeyDown = (index, event) => {
    if (event.key === 'Backspace' && !digits[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const otp = digits.join('');
    if (otp.length !== BOX_COUNT) {
      setError('Enter all 6 digits');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const response = await verifyOtp({ email, otp });
      const payload = response.data;

      login(payload.token, {
        userId: payload.userId,
        name: payload.name,
        email: payload.email,
        role: payload.role,
      });

      navigate(payload.role === 'TEACHER' ? '/teacher' : '/student');
    } catch (err) {
      setError(extractApiError(err).message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    try {
      setResendLoading(true);
      setError('');
      await resendOtp({ email });
      setCooldown(60);
    } catch (err) {
      setError(extractApiError(err).message);
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2>Verify your email</h2>
        <p className="small-muted">We sent a 6-digit code to {email}</p>

        <div className="otp-grid">
          {digits.map((digit, idx) => (
            <input
              key={idx}
              ref={(el) => {
                refs.current[idx] = el;
              }}
              className="otp-box"
              value={digit}
              onChange={(e) => updateDigit(idx, e.target.value)}
              onKeyDown={(e) => onKeyDown(idx, e)}
              maxLength={1}
            />
          ))}
        </div>

        {error ? <div className="alert-error">{error}</div> : null}

        <button type="button" className="btn btn-primary full" disabled={loading} onClick={handleVerify}>
          {loading ? 'Verifying...' : 'Verify account'}
        </button>

        <button
          type="button"
          className="btn btn-link"
          disabled={resendLoading || cooldown > 0}
          onClick={handleResend}
        >
          {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
        </button>
      </div>
    </div>
  );
}
