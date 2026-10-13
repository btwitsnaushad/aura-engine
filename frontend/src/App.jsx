import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Moon, Sun, ChevronDown } from 'lucide-react';
import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';

const App = () => {
  // Light/Dark Theme State
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Apply theme to body background
  useEffect(() => {
    document.body.style.margin = "0";
    document.body.style.backgroundColor = isDarkMode ? "#0f172a" : "#f8fafc";
    document.body.style.color = isDarkMode ? "white" : "#0f172a";
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const themeColors = {
    bg: isDarkMode ? '#0f172a' : '#f8fafc',
    headerBg: isDarkMode ? '#1e293b' : 'white',
    border: isDarkMode ? '#334155' : '#e2e8f0',
    text: isDarkMode ? 'white' : '#0f172a',
    textMuted: isDarkMode ? '#9ca3af' : '#64748b'
  };

  return (
    <Router>
      <div style={{ display: 'flex', minHeight: '100vh', width: '100vw', overflowX: 'hidden', backgroundColor: themeColors.bg, color: themeColors.text, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        
        {/* Pass theme to Sidebar */}
        <Sidebar isDarkMode={isDarkMode} />
        
        {/* Main Content Area - Full remaining width */}
        <div style={{ flex: 1, marginLeft: '250px', display: 'flex', flexDirection: 'column', width: 'calc(100vw - 250px)' }}>
          
          {/* Top Header */}
          <header style={{ height: '70px', borderBottom: `1px solid ${themeColors.border}`, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', padding: '0 30px', backgroundColor: themeColors.headerBg }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              
              {/* Theme Toggle Button */}
              <div onClick={toggleTheme} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px', borderRadius: '50%', background: isDarkMode ? '#334155' : '#f1f5f9' }}>
                {isDarkMode ? <Sun size={20} color="#e2e8f0" /> : <Moon size={20} color="#475569" />}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: 'white' }}>N</div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: themeColors.text }}>Naushad Ahamad</div>
                  <div style={{ fontSize: '12px', color: themeColors.textMuted }}>Admin</div>
                </div>
                <ChevronDown size={16} color={themeColors.textMuted} />
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main style={{ padding: '30px', overflowY: 'auto', flex: 1, backgroundColor: themeColors.bg }}>
            {/* We pass the theme down so charts and cards can update colors */}
            <Routes>
              <Route path="/" element={<Dashboard isDarkMode={isDarkMode} />} />
              <Route path="/inventory" element={<Inventory isDarkMode={isDarkMode} />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
};

export default App;