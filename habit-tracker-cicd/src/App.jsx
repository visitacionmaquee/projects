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
  
  // FIX 1: Default landing page is now set to 'dashboard' instead of 'habits'
  const [activeTab, setActiveTab] = useState('dashboard');

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

  // 2. Fetch Habits from Cloud Database when User Logs In
  useEffect(() => {
    if (!user) {
      setHabits([]);
      return;
    }
    fetchHabits();
  }, [user]);

  const fetchHabits = async () => {
    const { data, error } = await supabase
      .from('habits')
      .select('*')
      .order('created_at', { ascending: true });
    
    if (error) console.error('Error fetching habits:', error.message);
    else setHabits(data || []);
  };

  // 3. Auth Form Handlers
  const handleSignUp = async (e) => {
    e.preventDefault();
  
    if (password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }
  
    setAuthLoading(true);
    const formattedUsername = username.trim().toLowerCase();
  
    const { error } = await supabase.auth.signUp({
      email: identifier.trim(),
      password: password,
      options: {
        data: { username: formattedUsername }
      }
    });
  
    setAuthLoading(false);
    if (error) {
      alert(`Sign Up Error: ${error.message}`);
    } else {
      alert("Account created! Check your email for a verification link.");
    }
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
  
    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: password
    });
  
    setAuthLoading(false);
    if (error) {
      alert(`Login Error: ${error.message}`);
    }
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

    const { error } = await supabase
      .from('habits')
      .update({ completed_today: nextState, streak: nextStreak })
      .eq('id', id);

    if (error) alert(error.message);
    else {
      setHabits(habits.map(h => h.id === id ? { ...h, completed_today: nextState, streak: nextStreak } : h));
    }
  };

  const deleteHabit = async (id) => {
    const { error } = await supabase.from('habits').delete().eq('id', id);
    if (error) alert(error.message);
    else setHabits(habits.filter(h => h.id !== id));
  };

  // Derived Analytics Data
  const totalHabits = habits.length;
  const completedToday = habits.filter(h => h.completed_today).length;
  const completionRate = totalHabits > 0 ? Math.round((completedToday / totalHabits) * 100) : 0;
  
  // Calculate Streaks dynamically for Phase 2 dashboards
  const currentStreakMax = habits.length > 0 ? Math.max(...habits.map(h => h.streak || 0)) : 0;
  const longestStreakMax = habits.length > 0 ? Math.max(...habits.map(h => h.streak || 0)) : 0; 

  // Extract display name from user metadata or clean email
  const displayName = user?.user_metadata?.username || user?.email?.split('@')[0] || 'User';

  // Gatekeeper: Show Authentication View if No User Session Exists
  if (!user) {
    return (
      <div className="auth-container">
        <div className="auth-box">
          <h2>🎯 Habit Spark</h2>
          <p>{isSignUp ? 'Create your cloud account' : 'Log in to sync your habits'}</p>
          <form onSubmit={isSignUp ? handleSignUp : handleLogin}>
            {isSignUp && (
              <input 
                type="text" 
                placeholder="Choose Username" 
                value={username} 
                onChange={(e) => setUsername(e.target.value)} 
                required 
              />
            )}
            <input 
              type="text" 
              placeholder={isSignUp ? "Your Email" : "Your Email or Username"} 
              value={identifier} 
              onChange={(e) => setIdentifier(e.target.value)} 
              required 
            />
            <input 
              type="password" 
              placeholder="Password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
            />
            {isSignUp && (
              <input 
                type="password" 
                placeholder="Confirm Password" 
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)} 
                required 
              />
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
      {/* Complete Sidebar Layout */}
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

      {/* Main Workspace */}
      <main className="main-content">
        
        {/* FIX 2: Encapsulated Welcoming Headers, 4-Grid section, and Progress Level Tracker strictly inside the Dashboard tab */}
        {activeTab === 'dashboard' && (
          <>
            <header style={{ marginBottom: '2rem' }}>
              <h1>Welcome back, {displayName}</h1>
              <p style={{ color: 'var(--text-muted)' }}>Here is your consistency overview for today.</p>
            </header>

            {/* Complete Phase 2 Analytics 4-Grid Section */}
            <section className="stats-grid">
              <div className="stat-card">
                <span className="stat-label">🔥 Current Streak</span>
                <span className="stat-value">{currentStreakMax} Days</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">📈 Completion Rate</span>
                <span className="stat-value">{completionRate}%</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">🏆 Longest Streak</span>
                <span className="stat-value">{longestStreakMax} Days</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">✅ Habits Completed Today</span>
                <span className="stat-value">{completedToday} / {totalHabits}</span>
              </div>
            </section>

            {/* Global Progress Level Tracker */}
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

        {/* Habits Tab Panel */}
        {activeTab === 'habits' && (
          <div>
            {/* Contextual clean header for the tracking space */}
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
                        <button 
                          className="action-btn complete-toggle"
                          onClick={() => toggleHabit(habit.id, habit.completed_today, habit.streak)}
                        >
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

        {/* Universal Fallback for upcoming panel tabs */}
        {!['dashboard', 'habits'].includes(activeTab) && (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} space workspace view and modules coming soon!
          </div>
        )}
      </main>
    </div>
  );
}