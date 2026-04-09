import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const dashboardPath = user?.role === 'TEACHER' ? '/teacher' : '/student';

  return (
    <div className="navbar-float">
      <div className="navbar-user">
        <div className="navbar-name">{user?.name || 'User'}</div>
        <div className="navbar-role">{user?.role || 'MEMBER'}</div>
      </div>

      <button type="button" className="btn btn-secondary" onClick={() => navigate(dashboardPath)}>
        Dashboard
      </button>

      <button
        type="button"
        className="btn btn-logout"
        onClick={() => {
          logout();
          navigate('/login');
        }}
      >
        Logout
      </button>
    </div>
  );
}
