import { NavLink, useLocation } from 'react-router-dom';
import { useMemo } from 'react';
import { useAuth } from '../context/AuthContext';

const teacherNav = [
  { label: 'Overview', to: '/teacher' },
  { label: 'My classes', to: '/teacher/classes' },
  { label: 'Create class', to: '/teacher/classes/new' },
];

const studentNav = [
  { label: 'Overview', to: '/student' },
  { label: 'My classes', to: '/student/classes' },
  { label: 'Join class', to: '/student/classes/join' },
  { label: 'Review peers', to: '/student/peer-reviews' },
];

function titleFromPath(pathname) {
  const parts = pathname.split('/').filter(Boolean);
  if (parts.length === 0) return 'Dashboard';
  return parts[parts.length - 1].replace(/-/g, ' ');
}

export default function Sidebar() {
  const { user } = useAuth();
  const location = useLocation();

  const navItems = useMemo(() => {
    if (!user) return [];
    return user.role === 'TEACHER' ? teacherNav : studentNav;
  }, [user]);

  return (
    <aside className="sidebar">
      <div className="sidebar-logo-wrap">
        <span className="logo-text">REVIEW.IN</span>
        <h1 className="sidebar-title">{titleFromPath(location.pathname)}</h1>
      </div>

      <div className="sidebar-section-label">Navigate</div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
