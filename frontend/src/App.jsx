
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Moon, Sun, ChevronDown } from 'lucide-react';
import { useState, useEffect } from 'react';

import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';

const SIDEBAR_WIDTH = 250;

const App = () => {
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    document.body.style.margin = '0';
    document.body.style.minWidth = '320px';
    document.body.style.minHeight = '100vh';
    document.body.style.backgroundColor = isDarkMode
      ? '#0f172a'
      : '#f8fafc';
    document.body.style.color = isDarkMode ? '#f8fafc' : '#0f172a';
    document.body.style.fontFamily =
      'Inter, system-ui, -apple-system, sans-serif';

    return () => {
      document.body.style.margin = '';
      document.body.style.minWidth = '';
      document.body.style.minHeight = '';
      document.body.style.backgroundColor = '';
      document.body.style.color = '';
      document.body.style.fontFamily = '';
    };
  }, [isDarkMode]);

  const theme = {
    background: isDarkMode ? '#0f172a' : '#f8fafc',
    header: isDarkMode ? '#1e293b' : '#ffffff',
    border: isDarkMode ? '#334155' : '#e2e8f0',
    text: isDarkMode ? '#f8fafc' : '#0f172a',
    muted: isDarkMode ? '#94a3b8' : '#64748b',
  };

  return (
    <Router>
      <div
        style={{
          minHeight: '100vh',
          background: theme.background,
          color: theme.text,
        }}
      >
        <Sidebar isDarkMode={isDarkMode} />

        {/* Main area must reserve space for the fixed sidebar */}
        <div
          style={{
            marginLeft: `${SIDEBAR_WIDTH}px`,
            width: `calc(100% - ${SIDEBAR_WIDTH}px)`,
            minWidth: 0,
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            boxSizing: 'border-box',
          }}
        >
          <header
            style={{
              minHeight: 70,
              padding: '12px 24px',
              boxSizing: 'border-box',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              borderBottom: `1px solid ${theme.border}`,
              background: theme.header,
              position: 'sticky',
              top: 0,
              zIndex: 50,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 18,
              }}
            >
              <button
                type="button"
                onClick={() => setIsDarkMode((value) => !value)}
                aria-label={
                  isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'
                }
                title="Toggle theme"
                style={{
                  width: 40,
                  height: 40,
                  display: 'grid',
                  placeItems: 'center',
                  border: `1px solid ${theme.border}`,
                  borderRadius: '50%',
                  background: isDarkMode ? '#334155' : '#f1f5f9',
                  cursor: 'pointer',
                }}
              >
                {isDarkMode ? (
                  <Sun size={19} color="#f8fafc" />
                ) : (
                  <Moon size={19} color="#334155" />
                )}
              </button>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <div
                  style={{
                    width: 38,
                    height: 38,
                    flexShrink: 0,
                    borderRadius: '50%',
                    display: 'grid',
                    placeItems: 'center',
                    background: '#3b82f6',
                    color: '#ffffff',
                    fontWeight: 700,
                  }}
                >
                  N
                </div>

                <div>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Naushad Ahamad
                  </div>
                  <div style={{ fontSize: 12, color: theme.muted }}>
                    Admin
                  </div>
                </div>

                <ChevronDown size={16} color={theme.muted} />
              </div>
            </div>
          </header>

          <main
            style={{
              width: '100%',
              minWidth: 0,
              flex: 1,
              boxSizing: 'border-box',
              padding: 'clamp(16px, 2vw, 28px)',
              background: theme.background,
            }}
          >
            <Routes>
              <Route
                path="/"
                element={<Dashboard isDarkMode={isDarkMode} />}
              />
              <Route
                path="/inventory"
                element={<Inventory isDarkMode={isDarkMode} />}
              />
              <Route
                path="/analytics"
                element={<Dashboard isDarkMode={isDarkMode} />}
              />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
};

export default App;
