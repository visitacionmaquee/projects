import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import './App.css';

export default function App() {
  const [user, setUser] = useState(null);
  const [identifier, setIdentifier] = useState(''); // Holds username or email input
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  
  const [habits, setHabits] = useState([]);
  const [habitLogs, setHabitLogs] = useState([]); // Holds historical completion dates
  const [activeTab, setActiveTab] = useState('dashboard');

  // Helper to generate local YYYY-MM-DD string safely
  const getTodayString = () => new Date().toLocaleDateString('en-CA');

  // 1. Listen for Authentication Changes
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 2. Fetch Data from Cloud Database when User Logs In
  useEffect(() => {
    if (!user) {
      setHabits([]);
      setHabitLogs([]);
      return;
    }
    fetchHabitsAndLogs();
  }, [user]);

  const fetchHabitsAndLogs = async () => {
    const { data: habitsData, error: habitsError } = await supabase
      .from('habits')
      .select('*')
      .order('created_at', { ascending: true });
    
    if (habitsError) console.error('Error fetching habits:', habitsError.message);
    else setHabits(habitsData || []);

    const { data: logsData, error: logsError } = await supabase
      .from('habit_logs')
      .select('*');

    if (logsError) console.error('Error fetching logs:', logsError.message);
    else setHabitLogs(logsData || []);
  };

  // 3. Auth Form Handlers
  const handleSignUp = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) return alert("Passwords do not match!");
    setAuthLoading(true);
    const formattedUsername = username.trim().toLowerCase();
  
    const { error } = await supabase.auth.signUp({
      email: identifier.trim(),
      password: password,
      options: { data: { username: formattedUsername } }
    });
  
    setAuthLoading(false);
    if (error) alert(`Sign Up Error: ${error.message}`);
    else alert("Account created! Check your email for a verification link.");
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    let loginEmail = identifier.trim();
  
    if (!loginEmail.includes('@')) {
      const formattedUsername = loginEmail.toLowerCase();
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('email')
        .eq('username', formattedUsername)
        .single();
  
      if (profileError || !profile) {
        alert("No account found with that username.");
        setAuthLoading(false);
        return;
      }
      loginEmail = profile.email;
    }
  
    const { error } = await supabase.auth.signInWithPassword({ email: loginEmail, password: password });
    setAuthLoading(false);
    if (error) alert(`Login Error: ${error.message}`);
  };

  const handleLogout = () => supabase.auth.signOut();

  // 4. Database CRUD Handlers
  const handleAddHabit = async (e) => {
    e.preventDefault();
    const name = e.target.habitName.value.trim();
    const category = e.target.habitCategory.value;
    if (!name || !user) return;

    const { data, error } = await supabase
      .from('habits')
      .insert([{ name, category, user_id: user.id }])
      .select();

    if (error) alert(error.message);
    else {
      setHabits([...habits, data[0]]);
      e.target.reset();
    }
  };

  const toggleHabit = async (id, currentStatus, currentStreak) => {
    const nextState = !currentStatus;
    const nextStreak = nextState ? currentStreak + 1 : Math.max(0, currentStreak - 1);
    const todayStr = getTodayString();

    if (nextState) {
      const { error: logError } = await supabase
        .from('habit_logs')
        .insert([{ habit_id: id, user_id: user.id, logged_date: todayStr }]);

      if (logError && logError.code !== '23505') { 
        alert("Failed to log historical progress.");
        return;
      }
    } else {
      await supabase
        .from('habit_logs')
        .delete()
        .eq('habit_id', id)
        .eq('logged_date', todayStr);
    }

    const { error } = await supabase
      .from('habits')
      .update({ completed_today: nextState, streak: nextStreak })
      .eq('id', id);

    if (error) {
      alert(error.message);
    } else {
      setHabits(habits.map(h => h.id === id ? { ...h, completed_today: nextState, streak: nextStreak } : h));
      fetchHabitsAndLogs();
    }
  };

  const deleteHabit = async (id) => {
    const { error } = await supabase.from('habits').delete().eq('id', id);
    if (error) alert(error.message);
    else setHabits(habits.filter(h => h.id !== id));
  };

  // Helper array generator for calendar dates
  const getPastSevenDays = () => {
    const dates = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dates.push({
        rawString: d.toLocaleDateString('en-CA'),
        weekday: d.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNum: d.getDate()
      });
    }
    return dates;
  };
  const pastSevenDays = getPastSevenDays();

  // Derived Analytics Data
  const totalHabits = habits.length;
  const completedToday = habits.filter(h => h.completed_today).length;
  const completionRate = totalHabits > 0 ? Math.round((completedToday / totalHabits) * 100) : 0;
  const currentStreakMax = habits.length > 0 ? Math.max(...habits.map(h => h.streak || 0)) : 0;
  const longestStreakMax = habits.length > 0 ? Math.max(...habits.map(h => h.streak || 0)) : 0; 
  const displayName = user?.user_metadata?.username || user?.email?.split('@')[0] || 'User';

  // FIX 1: Real-Time Achievements System Engine
  const achievements = [
    {
      id: 'first_step',
      title: 'First Steps',
      desc: 'Create your very first habit routine.',
      icon: '🌱',
      isUnlocked: totalHabits > 0
    },
    {
      id: 'momentum',
      title: 'Building Momentum',
      desc: 'Achieve a 3-day streak on any habit.',
      icon: '🔥',
      isUnlocked: habits.some(h => h.streak >= 3)
    },
    {
      id: 'elite_streak',
      title: 'Consistency Elite',
      desc: 'Push a single habit streak up to 7 days.',
      icon: '🏆',
      isUnlocked: habits.some(h => h.streak >= 7)
    },
    {
      id: 'perfect_day',
      title: 'Flawless Victory',
      desc: 'Complete 100% of your tracked habits today.',
      icon: '⚡',
      isUnlocked: totalHabits > 0 && completedToday === totalHabits
    }
  ];
  const unlockedCount = achievements.filter(a => a.isUnlocked).length;

  // Gatekeeper View
  if (!user) {
    return (
      <div className="auth-container">
        <div className="auth-box">
          <h2>🎯 Habit Spark</h2>
          <p>{isSignUp ? 'Create your cloud account' : 'Log in to sync your habits'}</p>
          <form onSubmit={isSignUp ? handleSignUp : handleLogin}>
            {isSignUp && (
              <input type="text" placeholder="Choose Username" value={username} onChange={(e) => setUsername(e.target.value)} required />
            )}
            <input type="text" placeholder={isSignUp ? "Your Email" : "Your Email or Username"} value={identifier} onChange={(e) => setIdentifier(e.target.value)} required />
            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            {isSignUp && (
              <input type="password" placeholder="Confirm Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
            )}
            <button type="submit" className="submit-btn" disabled={authLoading}>
              {authLoading ? 'Processing...' : isSignUp ? 'Sign Up' : 'Log In'}
            </button>
          </form>
          <button className="auth-toggle-btn" onClick={() => { setIsSignUp(!isSignUp); setIdentifier(''); setPassword(''); }}>
            {isSignUp ? 'Already have an account? Log In' : "Don't have an account? Sign Up"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-layout">
      {/* Sidebar Layout */}
      <aside className="sidebar">
        <div>
          <h2>⚡ Habit Spark</h2>
          <nav className="sidebar-menu" style={{ marginTop: '2rem' }}>
            <div className={`menu-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>📊 Dashboard</div>
            <div className={`menu-item ${activeTab === 'habits' ? 'active' : ''}`} onClick={() => setActiveTab('habits')}>🔥 Habits</div>
            <div className={`menu-item ${activeTab === 'calendar' ? 'active' : ''}`} onClick={() => setActiveTab('calendar')}>📅 Calendar</div>
            <div className={`menu-item ${activeTab === 'achievements' ? 'active' : ''}`} onClick={() => setActiveTab('achievements')}>🏆 Achievements</div>
            <div className={`menu-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>⚙️ Settings</div>
          </nav>
        </div>
        <button className="logout-btn" onClick={handleLogout}>🚪 Log Out</button>
      </aside>

      {/* Main Workspace Workspace */}
      <main className="main-content">
        
        {/* Dashboard Tab Panel */}
        {activeTab === 'dashboard' && (
          <>
            <header style={{ marginBottom: '2rem' }}>
              <h1>Welcome back, {displayName}</h1>
              <p style={{ color: 'var(--text-muted)' }}>Here is your consistency overview for today.</p>
            </header>

            <section className="stats-grid">
              <div className="stat-card"><span className="stat-label">🔥 Current Streak</span><span className="stat-value">{currentStreakMax} Days</span></div>
              <div className="stat-card"><span className="stat-label">📈 Completion Rate</span><span className="stat-value">{completionRate}%</span></div>
              <div className="stat-card"><span className="stat-label">🏆 Longest Streak</span><span className="stat-value">{longestStreakMax} Days</span></div>
              <div className="stat-card"><span className="stat-label">✅ Habits Completed Today</span><span className="stat-value">{completedToday} / {totalHabits}</span></div>
            </section>

            <div className="progress-container">
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                <span style={{ fontWeight: '500' }}>Today's Target Progress</span>
                <span style={{ color: 'var(--text-muted)' }}>{completionRate}% Complete</span>
              </div>
              <div className="progress-bar-wrapper">
                <div className="progress-bar-fill" style={{ width: `${completionRate}%` }}></div>
              </div>
            </div>
          </>
        )}

        {/* Calendar Tab Panel */}
        {activeTab === 'calendar' && (
          <div>
            <header style={{ marginBottom: '2rem' }}>
              <h1>Consistency Ledger</h1>
              <p style={{ color: 'var(--text-muted)' }}>Review your historical completion matrix across the past week.</p>
            </header>

            <div className="calendar-card" style={{ background: 'var(--card-bg, #1e1e1e)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--border-color, #333)' }}>
              {habits.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No habits available to generate a timeline for. Go create one!</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', alignItems: 'center', borderBottom: '1px solid #333', paddingBottom: '0.5rem', fontWeight: 'bold' }}>
                    <span>Tracked Habit</span>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', gap: '8px' }}>
                      {pastSevenDays.map(day => (
                        <div key={day.rawString} style={{ fontSize: '0.85rem' }}>
                          <div style={{ color: 'var(--text-muted)' }}>{day.weekday}</div>
                          <div style={{ fontSize: '1rem', marginTop: '2px' }}>{day.dayNum}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {habits.map(habit => (
                    <div key={habit.id} style={{ display: 'grid', gridTemplateColumns: '200px 1fr', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid #222' }}>
                      <span style={{ fontWeight: '500', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: '10px' }}>
                        {habit.name}
                      </span>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', justifyItems: 'center', gap: '8px' }}>
                        {pastSevenDays.map(day => {
                          const isLogDone = habitLogs.some(log => log.habit_id === habit.id && log.logged_date === day.rawString);
                          return (
                            <div 
                              key={day.rawString} 
                              style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.9rem',
                                background: isLogDone ? '#4CAF50' : '#2a2a2a',
                                color: isLogDone ? '#fff' : '#666',
                                border: isLogDone ? 'none' : '1px dashed #444',
                                transition: 'all 0.2s ease'
                              }}
                              title={`${habit.name} - ${day.rawString} (${isLogDone ? 'Completed' : 'Missed'})`}
                            >
                              {isLogDone ? '✓' : '•'}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* FIX 2: Completed Achievements Tab Panel Layout */}
        {activeTab === 'achievements' && (
          <div>
            <header style={{ marginBottom: '2rem' }}>
              <h1>Hall of Trophies</h1>
              <p style={{ color: 'var(--text-muted)' }}>Unlocked milestones update live as you maintain your consistency. ({unlockedCount} / {achievements.length})</p>
            </header>

            {/* Reuses your original habit-grid CSS layout properties for continuous design language */}
            <div className="habits-grid">
              {achievements.map(ach => (
                <div 
                  key={ach.id} 
                  className={`enhanced-card ${ach.isUnlocked ? 'is-completed' : ''}`}
                  style={{ opacity: ach.isUnlocked ? 1 : 0.45, filter: ach.isUnlocked ? 'none' : 'grayscale(60%)', transition: 'all 0.3s ease' }}
                >
                  <div className="card-header" style={{ marginBottom: '0.75rem' }}>
                    <div className="card-title" style={{ fontSize: '1.2rem', gap: '12px' }}>
                      <span style={{ fontSize: '1.75rem' }}>{ach.icon}</span>
                      {ach.title}
                    </div>
                    <span className={`category-tag ${ach.isUnlocked ? 'cat-fitness' : 'cat-finance'}`}>
                      {ach.isUnlocked ? '🏆 Unlocked' : '🔒 Locked'}
                    </span>
                  </div>
                  
                  <div className="card-stats" style={{ marginTop: '0.5rem', border: 'none', paddingTop: 0 }}>
                    <p style={{ margin: 0, color: ach.isUnlocked ? 'inherit' : 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.4' }}>
                      {ach.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Habits Tab Panel */}
        {activeTab === 'habits' && (
          <div>
            <header style={{ marginBottom: '2rem' }}>
              <h1>My Tracking Space</h1>
              <p style={{ color: 'var(--text-muted)' }}>Create and manage your current daily routines.</p>
            </header>

            <div className="habit-form-box">
              <form onSubmit={handleAddHabit}>
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

            <div className="habits-grid">
              {habits.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>No habits tracked in this space yet. Add one above!</p>
              ) : (
                habits.map((habit) => {
                  const catClass = habit.category ? habit.category.toLowerCase().replace(' ', '-') : 'learning';
                  return (
                    <div key={habit.id} className={`enhanced-card ${habit.completed_today ? 'is-completed' : ''}`}>
                      <div className="card-header">
                        <div className="card-title">
                          <span>{habit.category === 'Fitness' ? '💪' : habit.category === 'Learning' ? '📚' : habit.category === 'Gaming' ? '🎮' : habit.category === 'Finance' ? '💰' : '🧠'}</span>
                          {habit.name}
                        </div>
                        <span className={`category-tag cat-${catClass}`}>{habit.category || 'General'}</span>
                      </div>

                      <div className="card-stats">
                        <span>🔥 Streak: <strong>{habit.streak} Days</strong></span>
                        <span>📅 Status: <strong>{habit.completed_today ? 'Completed Today' : 'Pending Action'}</strong></span>
                      </div>

                      <div className="card-actions">
                        <button className="action-btn complete-toggle" onClick={() => toggleHabit(habit.id, habit.completed_today, habit.streak)}>
                          {habit.completed_today ? '✓ Completed' : 'Mark Complete'}
                        </button>
                        <button className="action-btn delete-toggle" onClick={() => deleteHabit(habit.id)}>Delete</button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Fallback View Panel for remaining tabs */}
        {!['dashboard', 'habits', 'calendar', 'achievements'].includes(activeTab) && (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} space workspace view and modules coming soon!
          </div>
        )}
      </main>
    </div>
  );
}