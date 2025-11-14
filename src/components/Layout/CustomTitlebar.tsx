import { useState, useEffect } from 'react';
import { Minus, Square, X, Moon, Sun } from 'lucide-react';

export default function CustomTitlebar() {
  const [darkMode, setDarkMode] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    // Load theme
    const savedTheme = localStorage.getItem('theme');
    const isDark = savedTheme === 'dark';
    setDarkMode(isDark);
    
    if (isDark) {
      document.documentElement.classList.add('dark');
    }

    // Check if window is maximized
    if (window.electronAPI) {
      window.electronAPI.isMaximized().then(setIsMaximized);
    }
  }, []);

  const handleMinimize = () => {
    if (window.electronAPI) {
      window.electronAPI.minimizeWindow();
    }
  };

  const handleMaximize = () => {
    if (window.electronAPI) {
      window.electronAPI.maximizeWindow();
      setIsMaximized(!isMaximized);
    }
  };

  const handleClose = () => {
    if (window.electronAPI) {
      window.electronAPI.closeWindow();
    }
  };

  const toggleTheme = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    
    if (newMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  return (
    <div className="app-dragger flex items-center justify-between h-12 bg-sidebar border-b border-sidebar-border px-4">
      {/* Left: App Title/Logo */}
      <div className="flex items-center gap-3">
        <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
          <span className="text-primary-foreground text-sm font-bold">P</span>
        </div>
        <span className="text-sm font-semibold text-sidebar-foreground">
          POS System
        </span>
      </div>

      {/* Right: Theme Toggle + Window Controls */}
      <div className="flex items-center gap-2">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="h-8 w-8 flex items-center justify-center rounded hover:bg-sidebar-accent transition-colors"
          title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {darkMode ? (
            <Sun className="h-4 w-4 text-sidebar-foreground" />
          ) : (
            <Moon className="h-4 w-4 text-sidebar-foreground" />
          )}
        </button>

        {/* Window Controls */}
        <div className="flex items-center gap-1 ml-2">
          {/* Minimize */}
          <button
            onClick={handleMinimize}
            className="h-8 w-10 flex items-center justify-center hover:bg-sidebar-accent transition-colors rounded"
            title="Minimize"
          >
            <Minus className="h-4 w-4 text-sidebar-foreground" />
          </button>

          {/* Maximize/Restore */}
          <button
            onClick={handleMaximize}
            className="h-8 w-10 flex items-center justify-center hover:bg-sidebar-accent transition-colors rounded"
            title={isMaximized ? 'Restore' : 'Maximize'}
          >
            <Square className="h-3.5 w-3.5 text-sidebar-foreground" />
          </button>

          {/* Close */}
          <button
            onClick={handleClose}
            className="h-8 w-10 flex items-center justify-center hover:bg-destructive hover:text-destructive-foreground transition-colors rounded"
            title="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}