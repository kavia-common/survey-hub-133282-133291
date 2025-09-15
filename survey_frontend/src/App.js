import React, { useState, useEffect } from 'react';
import './App.css';
import SchemaPreview from './components/SchemaPreview';

// PUBLIC_INTERFACE
function App() {
  const [theme, setTheme] = useState('dark');

  // Effect to apply theme to document element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // PUBLIC_INTERFACE
  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  return (
    <div className="App">
      <header className="App-header">
        <button 
          className="theme-toggle" 
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
        </button>
        <SchemaPreview />
      </header>
    </div>
  );
}

export default App;
