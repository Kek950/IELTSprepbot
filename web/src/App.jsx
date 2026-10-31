import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Header from './components/Header';
import AuthModal from './components/AuthModal';
import LoginGate from './components/LoginGate';
import WritingView from './components/views/WritingView';
import PracticeView from './components/views/PracticeView';
import HomeworkView from './components/views/HomeworkView';
import HistoryView from './components/views/HistoryView';
import TokensView from './components/views/TokensView';
import ClassroomView from './components/views/ClassroomView';
import TeacherView from './components/views/TeacherView';
import SettingsView from './components/views/SettingsView';

function MainApp() {
  const { user } = useAuth();
  const [currentView, setCurrentView] = useState('writing');
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('ielts_theme') || 'dark');
  const [currentPalette, setCurrentPalette] = useState(() => localStorage.getItem('ielts_palette') || 'amber');
  const [density, setDensity] = useState(() => localStorage.getItem('ielts_density') || 'comfortable');
  const [editorFont, setEditorFont] = useState(() => localStorage.getItem('ielts_font') || 'sans');
  const [targetBand, setTargetBand] = useState(() => localStorage.getItem('ielts_target_band') || '7.5');

  // Theme attribute
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('ielts_theme', theme);
  }, [theme]);

  // Palette attribute
  useEffect(() => {
    document.documentElement.setAttribute('data-palette', currentPalette);
    localStorage.setItem('ielts_palette', currentPalette);
  }, [currentPalette]);

  // Density attribute
  useEffect(() => {
    document.documentElement.setAttribute('data-density', density);
    localStorage.setItem('ielts_density', density);
  }, [density]);

  // Font attribute
  useEffect(() => {
    document.documentElement.setAttribute('data-font', editorFont);
    localStorage.setItem('ielts_font', editorFont);
  }, [editorFont]);

  // Target Band
  useEffect(() => {
    localStorage.setItem('ielts_target_band', targetBand);
  }, [targetBand]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const toggleDensity = () => {
    setDensity(prev => (prev === 'compact' ? 'comfortable' : 'compact'));
  };

  const cyclePalette = () => {
    const palettes = ['amber', 'emerald', 'rose', 'violet', 'cyan', 'monochrome'];
    const next = palettes[(palettes.indexOf(currentPalette) + 1) % palettes.length];
    setCurrentPalette(next);
  };

  const handleStartEssayFromHomework = (hw) => {
    setCurrentView('writing');
  };

  // STRICT AUTHENTICATION GATE:
  // Before accessing the website, user must enter phone number and confirmation code.
  if (!user) {
    return (
      <LoginGate
        theme={theme}
        toggleTheme={toggleTheme}
        currentPalette={currentPalette}
        setCurrentPalette={setCurrentPalette}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-theme-base text-theme-primary font-sans transition-colors">
      <Header
        currentView={currentView}
        setCurrentView={setCurrentView}
        theme={theme}
        toggleTheme={toggleTheme}
        currentPalette={currentPalette}
        setCurrentPalette={setCurrentPalette}
        cyclePalette={cyclePalette}
        density={density}
        toggleDensity={toggleDensity}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      <main className="flex-1 max-w-[1400px] w-full mx-auto px-3 sm:px-6 lg:px-8 py-6">
        {currentView === 'writing' && (
          <WritingView 
            editorFont={editorFont}
            targetBand={targetBand}
          />
        )}
        {currentView === 'practice' && <PracticeView />}
        {currentView === 'homework' && <HomeworkView onStartEssay={handleStartEssayFromHomework} />}
        {currentView === 'history' && <HistoryView />}
        {currentView === 'tokens' && <TokensView />}
        {currentView === 'classroom' && <ClassroomView />}
        {currentView === 'teacher' && <TeacherView />}
        {currentView === 'settings' && (
          <SettingsView
            currentPalette={currentPalette}
            setCurrentPalette={setCurrentPalette}
            density={density}
            setDensity={setDensity}
            editorFont={editorFont}
            setEditorFont={setEditorFont}
            targetBand={targetBand}
            setTargetBand={setTargetBand}
            onOpenAuth={() => setIsAuthOpen(true)}
          />
        )}
      </main>

      <footer className="border-t border-theme-subtle bg-theme-surface py-5 text-center text-xs text-theme-muted transition-colors">
        <div className="max-w-[1400px] mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>IELTS Preparation Platform & Examiner • Connected with Telegram Bot</span>
          <div className="flex items-center gap-4 text-theme-secondary">
            <button onClick={() => setIsAuthOpen(true)} className="hover:text-theme-accent transition">
              Switch Phone Account
            </button>
            <span>•</span>
            <span className="font-mono">{user ? `User: ${user.phone_number}` : 'Not Signed In'}</span>
          </div>
        </div>
      </footer>

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}