'use client'

import { useState, useEffect } from 'react'

export default function HabitTracker() {
  const [habits, setHabits] = useState([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [newHabit, setNewHabit] = useState({ name: '', reminderTime: '' })
  const [today] = useState(() => new Date().toISOString().split('T')[0])

  useEffect(() => {
    const stored = localStorage.getItem('habits')
    if (stored) {
      setHabits(JSON.parse(stored))
    }
    requestNotificationPermission()
    checkReminders()
  }, [])

  useEffect(() => {
    if (habits.length > 0) {
      localStorage.setItem('habits', JSON.stringify(habits))
    }
  }, [habits])

  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission()
    }
  }

  const checkReminders = () => {
    setInterval(() => {
      const stored = localStorage.getItem('habits')
      if (!stored) return

      const habits = JSON.parse(stored)
      const now = new Date()
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
      const today = now.toISOString().split('T')[0]

      habits.forEach(habit => {
        if (habit.reminderTime === currentTime && !habit.completedDates?.includes(today)) {
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Habit Reminder', {
              body: `Time to complete: ${habit.name}`,
              icon: '⭐',
              badge: '⭐'
            })
          }
        }
      })
    }, 60000) // Check every minute
  }

  const addHabit = () => {
    if (!newHabit.name.trim()) return

    const habit = {
      id: Date.now(),
      name: newHabit.name,
      reminderTime: newHabit.reminderTime,
      completedDates: [],
      createdAt: new Date().toISOString().split('T')[0]
    }

    setHabits([...habits, habit])
    setNewHabit({ name: '', reminderTime: '' })
    setShowAddForm(false)
  }

  const toggleHabit = (id) => {
    setHabits(habits.map(habit => {
      if (habit.id === id) {
        const completedDates = habit.completedDates || []
        const isCompleted = completedDates.includes(today)

        return {
          ...habit,
          completedDates: isCompleted
            ? completedDates.filter(d => d !== today)
            : [...completedDates, today]
        }
      }
      return habit
    }))
  }

  const deleteHabit = (id) => {
    setHabits(habits.filter(h => h.id !== id))
  }

  const calculateStreak = (habit) => {
    if (!habit.completedDates || habit.completedDates.length === 0) return 0

    const sortedDates = [...habit.completedDates].sort().reverse()
    let streak = 0
    let currentDate = new Date()

    for (let i = 0; i < sortedDates.length; i++) {
      const checkDate = new Date(currentDate)
      checkDate.setDate(checkDate.getDate() - i)
      const checkDateStr = checkDate.toISOString().split('T')[0]

      if (sortedDates.includes(checkDateStr)) {
        streak++
      } else {
        break
      }
    }

    return streak
  }

  const isCompletedToday = (habit) => {
    return habit.completedDates?.includes(today) || false
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>🎯 Habit Tracker</h1>
        <p style={styles.subtitle}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
      </div>

      <div style={styles.content}>
        {habits.length === 0 && !showAddForm && (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>📝</div>
            <p style={styles.emptyText}>No habits yet</p>
            <p style={styles.emptySubtext}>Start building better habits today!</p>
          </div>
        )}

        {habits.map(habit => {
          const streak = calculateStreak(habit)
          const completed = isCompletedToday(habit)

          return (
            <div key={habit.id} style={{
              ...styles.habitCard,
              ...(completed ? styles.habitCardCompleted : {})
            }}>
              <div style={styles.habitLeft}>
                <button
                  onClick={() => toggleHabit(habit.id)}
                  style={{
                    ...styles.checkbox,
                    ...(completed ? styles.checkboxCompleted : {})
                  }}
                >
                  {completed && '✓'}
                </button>

                <div style={styles.habitInfo}>
                  <div style={{
                    ...styles.habitName,
                    ...(completed ? styles.habitNameCompleted : {})
                  }}>
                    {habit.name}
                  </div>

                  <div style={styles.habitMeta}>
                    {streak > 0 && (
                      <span style={styles.streak}>
                        🔥 {streak} day{streak !== 1 ? 's' : ''}
                      </span>
                    )}
                    {habit.reminderTime && (
                      <span style={styles.reminder}>
                        ⏰ {habit.reminderTime}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={() => deleteHabit(habit.id)}
                style={styles.deleteBtn}
              >
                🗑️
              </button>
            </div>
          )
        })}

        {showAddForm && (
          <div style={styles.addForm}>
            <input
              type="text"
              placeholder="Habit name (e.g., Morning run)"
              value={newHabit.name}
              onChange={(e) => setNewHabit({ ...newHabit, name: e.target.value })}
              style={styles.input}
              autoFocus
            />

            <input
              type="time"
              placeholder="Reminder time (optional)"
              value={newHabit.reminderTime}
              onChange={(e) => setNewHabit({ ...newHabit, reminderTime: e.target.value })}
              style={styles.input}
            />

            <div style={styles.formButtons}>
              <button onClick={addHabit} style={styles.saveBtn}>
                Add Habit
              </button>
              <button onClick={() => {
                setShowAddForm(false)
                setNewHabit({ name: '', reminderTime: '' })
              }} style={styles.cancelBtn}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {!showAddForm && (
        <button
          onClick={() => setShowAddForm(true)}
          style={styles.fab}
        >
          +
        </button>
      )}
    </div>
  )
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f8f9fa',
    paddingBottom: '80px'
  },
  header: {
    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    color: 'white',
    padding: '24px 20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  },
  title: {
    margin: '0 0 8px 0',
    fontSize: '28px',
    fontWeight: '700'
  },
  subtitle: {
    margin: 0,
    fontSize: '14px',
    opacity: 0.9
  },
  content: {
    padding: '20px'
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px 20px',
    color: '#6c757d'
  },
  emptyIcon: {
    fontSize: '64px',
    marginBottom: '16px'
  },
  emptyText: {
    fontSize: '20px',
    fontWeight: '600',
    margin: '0 0 8px 0',
    color: '#495057'
  },
  emptySubtext: {
    fontSize: '14px',
    margin: 0
  },
  habitCard: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    transition: 'all 0.2s'
  },
  habitCardCompleted: {
    backgroundColor: '#f0fdf4',
    borderLeft: '4px solid #22c55e'
  },
  habitLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flex: 1
  },
  checkbox: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    border: '2px solid #d1d5db',
    backgroundColor: 'white',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px',
    flexShrink: 0,
    transition: 'all 0.2s'
  },
  checkboxCompleted: {
    backgroundColor: '#22c55e',
    borderColor: '#22c55e',
    color: 'white'
  },
  habitInfo: {
    flex: 1,
    minWidth: 0
  },
  habitName: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '4px'
  },
  habitNameCompleted: {
    textDecoration: 'line-through',
    opacity: 0.7
  },
  habitMeta: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
    fontSize: '13px'
  },
  streak: {
    color: '#f59e0b',
    fontWeight: '600'
  },
  reminder: {
    color: '#6366f1',
    fontWeight: '500'
  },
  deleteBtn: {
    background: 'none',
    border: 'none',
    fontSize: '20px',
    cursor: 'pointer',
    opacity: 0.5,
    padding: '4px',
    transition: 'opacity 0.2s'
  },
  addForm: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  },
  input: {
    width: '100%',
    padding: '12px',
    fontSize: '16px',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    marginBottom: '12px',
    boxSizing: 'border-box',
    outline: 'none'
  },
  formButtons: {
    display: 'flex',
    gap: '8px'
  },
  saveBtn: {
    flex: 1,
    padding: '12px',
    fontSize: '16px',
    fontWeight: '600',
    color: 'white',
    backgroundColor: '#6366f1',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer'
  },
  cancelBtn: {
    flex: 1,
    padding: '12px',
    fontSize: '16px',
    fontWeight: '600',
    color: '#6c757d',
    backgroundColor: '#e9ecef',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer'
  },
  fab: {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    backgroundColor: '#6366f1',
    color: 'white',
    border: 'none',
    fontSize: '32px',
    fontWeight: '300',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(99, 102, 241, 0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  }
}
