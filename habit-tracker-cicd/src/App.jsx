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
            {/* Interactive Habit Creator Form */}
            <div className="habit-form-box">
              <form onSubmit={(e) => {
                e.preventDefault();
                const name = e.target.habitName.value.trim();
                const category = e.target.habitCategory.value;
                if (!name) return;

                const newHabit = {
                  id: crypto.randomUUID(),
                  name,
                  category,
                  completedToday: false,
                  streak: 0,
                  lastCompleted: 'Never',
                  completionRate: 100
                };

                setHabits([...habits, newHabit]);
                e.target.reset();
              }}>
                <div className="form-row">
                  <input name="habitName" type="text" placeholder="What habit are we building today?..." maxLength={40} required />
                  <select name="habitCategory" defaultValue="Learning">
                    <option value="Fitness">💪 Fitness</option>
                    <option value="Learning">📚 Learning</option>
                    <option value="Gaming">🎮 Gaming</option>
                    <option value="Finance">💰 Finance</option>
                    <option value="Mental Health">🧠 Mental Health</option>
                  </select>
                </div>
                <button type="submit" className="submit-btn">Create Custom Habit</button>
              </form>
            </div>

            {/* Enhanced Habit Cards Grid View */}
            <div className="habits-grid">
              {habits.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>No habits tracked in this space yet. Add one above!</p>
              ) : (
                habits.map((habit) => {
                  // Resolve category classes
                  const catClass = habit.category ? habit.category.toLowerCase().replace(' ', '-') : 'learning';
                  
                  return (
                    <div key={habit.id} className={`enhanced-card ${habit.completedToday ? 'is-completed' : ''}`}>
                      <div className="card-header">
                        <div className="card-title">
                          <span>{habit.category === 'Fitness' ? '💪' : habit.category === 'Learning' ? '📚' : habit.category === 'Gaming' ? '🎮' : habit.category === 'Finance' ? '💰' : '🧠'}</span>
                          {habit.name}
                        </div>
                        <span className={`category-tag cat-${catClass}`}>{habit.category || 'General'}</span>
                      </div>

                      <div className="card-stats">
                        <span>🔥 Streak: <strong>{habit.streak} Days</strong></span>
                        <span>📅 Last Completed: <strong>{habit.completedToday ? 'Today' : habit.lastCompleted}</strong></span>
                        <span>📊 Completion Rate: <strong>{habit.completionRate}%</strong></span>
                      </div>

                      <div className="card-actions">
                        <button 
                          className="action-btn complete-toggle"
                          onClick={() => {
                            setHabits(habits.map(h => {
                              if (h.id === habit.id) {
                                const nextState = !h.completedToday;
                                return {
                                  ...h,
                                  completedToday: nextState,
                                  streak: nextState ? h.streak + 1 : Math.max(0, h.streak - 1),
                                  lastCompleted: nextState ? 'Today' : 'Yesterday'
                                };
                              }
                              return h;
                            }));
                          }}
                        >
                          {habit.completedToday ? '✓ Completed' : 'Mark Complete'}
                        </button>
                        <button 
                          className="action-btn delete-toggle"
                          onClick={() => setHabits(habits.filter(h => h.id !== habit.id))}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
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