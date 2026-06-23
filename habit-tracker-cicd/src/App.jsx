import { useState, useEffect } from 'react';
import './App.css';

export default function App() {
  const [habits, setHabits] = useState(() => {
    const saved = localStorage.getItem('maquee-habits');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [activeTab, setActiveTab] = useState('habits');

  useEffect(() => {
    localStorage.setItem('maquee-habits', JSON.stringify(habits));
  }, [habits]);

  // Derived Analytics Data
  const totalHabits = habits.length;
  const completedToday = habits.filter(h => h.completedToday).length;
  const completionRate = totalHabits > 0 ? Math.round((completedToday / totalHabits) * 100) : 0;

  return (
    <div className="app-layout">
      {/* 5. Left Sidebar Component */}
      <aside className="sidebar">
        <h2>⚡ Habit Spark</h2>
        <nav className="sidebar-menu">
          <div className={`menu-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>📊 Dashboard</div>
          <div className={`menu-item ${activeTab === 'habits' ? 'active' : ''}`} onClick={() => setActiveTab('habits')}>🔥 Habits</div>
          <div className={`menu-item ${activeTab === 'calendar' ? 'active' : ''}`} onClick={() => setActiveTab('calendar')}>📅 Calendar</div>
          <div className={`menu-item ${activeTab === 'achievements' ? 'active' : ''}`} onClick={() => setActiveTab('achievements')}>🏆 Achievements</div>
          <div className={`menu-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>⚙️ Settings</div>
        </nav>
      </aside>

      {/* Main Workspace */}
      <main className="main-content">
        <header style={{ marginBottom: '2rem' }}>
          <h1>Welcome back, Maquee</h1>
          <p style={{ color: 'var(--text-muted)' }}>Here is your consistency overview for today.</p>
        </header>

        {/* 1. Dashboard Analytics Section */}
        <section className="stats-grid">
          <div className="stat-card">
            <span className="stat-label">🔥 Current Streak</span>
            <span className="stat-value">12 Days</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">📈 Completion Rate</span>
            <span className="stat-value">{completionRate}%</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">🏆 Longest Streak</span>
            <span className="stat-value">31 Days</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">✅ Habits Completed Today</span>
            <span className="stat-value">{completedToday} / {totalHabits}</span>
          </div>
        </section>

        {/* 6. Daily Goal Progress Bar */}
        <div className="progress-container">
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
            <span style={{ fontWeight: '500' }}>Today's Progress</span>
            <span style={{ color: 'var(--text-muted)' }}>{completionRate}% Complete</span>
          </div>
          <div className="progress-bar-wrapper">
            <div className="progress-bar-fill" style={{ width: `${completionRate}%` }}></div>
          </div>
        </div>

        {/* Temporary warning/placeholder while building tabs */}
        {activeTab === 'habits' ? (
          <div>
            {/* We will drop our upgraded habit creation form and cards right here next! */}
            <p style={{ color: 'var(--text-muted)' }}>Habit listing loading...</p>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            The {activeTab} workspace layout configuration is coming soon in Phase 4!
          </div>
        )}
      </main>
    </div>
  );
}