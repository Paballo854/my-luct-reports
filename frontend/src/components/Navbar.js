import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const getNavLinkClass = (path) => {
    return location.pathname === path ? 'nav-link active' : 'nav-link';
  };

  const getRoleBasedLinks = () => {
    const baseLinks = [
      { path: '/dashboard', label: 'Dashboard' },
    ];

    if (user.role === 'student') {
      baseLinks.push(
        { path: '/reports', label: 'Monitor Reports' }
      );
    } else if (user.role === 'program_leader') {
      baseLinks.push(
        { path: '/reports', label: 'Reports' },
        { path: '/courses', label: 'Courses' },
        { path: '/users', label: 'Users' },
        { path: '/classes', label: 'Classes' }
      );
    } else if (user.role === 'principal_lecturer') {
      baseLinks.push(
        { path: '/reports', label: 'Reports' },
        { path: '/courses', label: 'Courses' },
        { path: '/classes', label: 'Classes' }
      );
    } else if (user.role === 'lecturer') {
      baseLinks.push(
        { path: '/reports', label: 'Reports' },
        { path: '/my-classes', label: 'My Classes' }
      );
    }

    return baseLinks;
  };

  return (
    <nav className="navbar">
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '3rem' }}>
            {/* 🔥 UPDATED: Link to landing page */}
            <Link to="/" className="nav-brand">
              LUCT Reports
            </Link>
            
            <ul className="nav-menu">
              {getRoleBasedLinks().map(link => (
                <li key={link.path}>
                  <Link to={link.path} className={getNavLinkClass(link.path)}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ color: 'white', fontWeight: '500' }}>
              {user.first_name} {user.last_name} ({user.role})
            </span>
            <button 
              onClick={logout}
              className="btn btn-secondary"
              style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;