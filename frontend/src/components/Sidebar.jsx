import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  BarChart2,
  Triangle,
} from 'lucide-react';

const Sidebar = ({ isDarkMode }) => {
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Inventory', path: '/inventory', icon: Package },
    { name: 'Analytics', path: '/analytics', icon: BarChart2 },
  ];

  const sidebarBg = isDarkMode ? '#020617' : '#ffffff';
  const borderCol = isDarkMode ? '#1f2937' : '#e2e8f0';
  const textMuted = isDarkMode ? '#9ca3af' : '#64748b';

  return (
    <aside
      style={{
        width: '250px',
        minWidth: '250px',
        flexShrink: 0,
        backgroundColor: sidebarBg,
        borderRight: `1px solid ${borderCol}`,
        color: isDarkMode ? '#ffffff' : '#0f172a',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        zIndex: 100,
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          padding: '24px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <Triangle size={28} fill="#3b82f6" color="#3b82f6" />
        <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 'bold' }}>
          Aura Engine
        </h2>
      </div>

      <nav style={{ flex: 1, padding: '10px' }}>
        {navItems.map((item) => {
          const isActive =
            item.path === '/'
              ? location.pathname === '/'
              : location.pathname === item.path;

          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              to={item.path}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                margin: '4px 0',
                borderRadius: '8px',
                textDecoration: 'none',
                color: isActive ? '#ffffff' : textMuted,
                backgroundColor: isActive ? '#3b82f6' : 'transparent',
                transition: 'background-color 0.2s ease',
                fontWeight: isActive ? '600' : '400',
              }}
            >
              <Icon size={20} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;