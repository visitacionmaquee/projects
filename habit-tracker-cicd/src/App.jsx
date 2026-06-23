import { useState, useEffect } from 'react';
import './App.css';

export default function App() {
  // Load habits from localStorage on startup
  const [habits, setHabits] = useState(() => {
    const saved = localStorage.getItem('maquee-habits');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [newHabitName, setNewHabitName] = useState('');

  // Save habits to localStorage whenever the state changes
  useEffect(() => {
    localStorage.setItem('maquee-habits', JSON.stringify(habits));
  }, [habits]);

  // Add a new habit
  const handleAddHabit = (e) => {
    e.preventDefault();
    if (!newHabitName.trim()) return;

    const newHabit = {
      id: crypto.randomUUID(),
      name: newHabitName.trim(),
      completedToday: false,
      streak: 0,
    };

    setHabits([...habits, newHabit]);
    setNewHabitName('');
  };

  // Toggle complete/incomplete & update streak
  const toggleHabit = (id) => {
    setHabits(habits.map(habit => {
      if (habit.id === id) {
        const nextState = !habit.completedToday;
        return {
          ...habit,
          completedToday: nextState,
          streak: nextState ? habit.streak + 1 : Math.max(0, habit.streak - 1)
        };
      }
      return habit;
    }));
  };

  // Delete a habit
  const deleteHabit = (id) => {
    setHabits(habits.filter(habit => habit.id !== id));
  };

  return (
    <div className="container">
      <header>
        <h1>🎯 Habit Spark</h1>
        <p>Build consistency. Automate everything.</p>
      </header>

      <form onSubmit={handleAddHabit} className="habit-form">
        <input
          type="text"
          placeholder="Enter a new habit (e.g., Code 1 hour)..."
          value={newHabitName}
          onChange={(e) => setNewHabitName(e.target.value)}
          maxLength={50}
        />
        <button type="submit">Add Habit</button>
      </form>

      <div className="habit-list">
        {habits.length === 0 ? (
          <p className="empty-state">No habits added yet. Start small!</p>
        ) : (
          habits.map((habit) => (
            <div key={habit.id} className={`habit-item ${habit.completedToday ? 'completed' : ''}`}>
              <div className="habit-info" onClick={() => toggleHabit(habit.id)}>
                <span className="checkbox">
                  {habit.completedToday ? '✅' : '⬜'}
                </span>
                <span className="habit-name">{habit.name}</span>
              </div>
              
              <div className="habit-actions">
                <span className="streak-badge">🔥 {habit.streak} days</span>
                <button className="delete-btn" onClick={() => deleteHabit(habit.id)}>🗑️</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}