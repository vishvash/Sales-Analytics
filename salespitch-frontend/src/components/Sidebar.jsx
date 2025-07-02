import { Link, useLocation } from 'react-router-dom';
import { FaChartBar, FaListAlt, FaBalanceScale, FaFileAlt, FaFileSignature, FaHome } from 'react-icons/fa';
import './Sidebar.css';
import React from 'react';

const menu = [
  { to: '/dashboard/hpi', icon: <FaHome />, label: 'HPI Dashboard' },
  { to: '/dashboard/kpi', icon: <FaChartBar />, label: 'KPI Dashboard' },
  { to: '/results', icon: <FaListAlt />, label: 'Results' },
  { to: '/comparative-analysis', icon: <FaBalanceScale />, label: 'Comparative' },
  { to: '/interview-test', icon: <FaFileSignature />, label: 'Interview Test' },
  { to: '/detailed-report', icon: <FaFileAlt />, label: 'View Detailed Report' },
];

export default function Sidebar() {
  const location = useLocation();
  return (
    <aside className="sidebar-menu compact" style={{
      background: 'linear-gradient(180deg, #f0f4ff 0%, #f9fafb 100%)',
      boxShadow: '2px 0 12px 0 rgba(99,102,241,0.07)',
      borderRight: '1.5px solid #e0e7ff',
      paddingTop: '1.5rem',
      minHeight: '100vh',
      zIndex: 20
    }}>
      <ul style={{ marginTop: '1.5rem' }}>
        {menu.map(item => (
          <li key={item.to} className={location.pathname === item.to ? 'active' : ''} style={{ marginBottom: '0.7rem' }}>
            <Link to={item.to} style={{ position: 'relative', borderRadius: 14, boxShadow: '0 2px 8px rgba(99,102,241,0.04)' }}>
              <span className="sidebar-icon" style={{ filter: location.pathname === item.to ? 'drop-shadow(0 2px 6px #6366f1aa)' : 'none', transition: 'filter 0.2s' }}>{item.icon}</span>
              <span className="sidebar-label">{item.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}
