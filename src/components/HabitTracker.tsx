import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Check, X } from 'lucide-react'
import { parseISO, isSameDay } from 'date-fns'

type Habit = {
  id: string;
  name: string;
  streak: number;
  lastCompleted: string | null;
}

type HabitTrackerProps = {
  habits: Habit[];
  setHabits: React.Dispatch<React.SetStateAction<Habit[]>>;
}

export default function HabitTracker({ habits, setHabits }: HabitTrackerProps) {
  const [newHabitName, setNewHabitName] = useState('')

  const addHabit = () => {
    if (newHabitName.trim()) {
      const newHabit: Habit = {
        id: Date.now().toString(),
        name: newHabitName.trim(),
        streak: 0,
        lastCompleted: null
      }
      const updatedHabits = [...habits, newHabit]
      setHabits(updatedHabits)
      localStorage.setItem('habits', JSON.stringify(updatedHabits))
      setNewHabitName('')
    }
  }

  const toggleHabit = (id: string) => {
    const today = new Date()
    const updatedHabits = habits.map(habit => {
      if (habit.id === id) {
        if (habit.lastCompleted && isSameDay(parseISO(habit.lastCompleted), today)) {
          // If already completed today, uncomplete it
          return { ...habit, streak: Math.max(0, habit.streak - 1), lastCompleted: null }
        } else {
          // If not completed today, complete it
          return { ...habit, streak: habit.streak + 1, lastCompleted: today.toISOString() }
        }
      }
      return habit
    })
    setHabits(updatedHabits)
    localStorage.setItem('habits', JSON.stringify(updatedHabits))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Habit Tracker</CardTitle>
        <CardDescription>Track your daily habits</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex mb-4">
          <Input
            type="text"
            placeholder="Add a new habit"
            value={newHabitName}
            onChange={(e) => setNewHabitName(e.target.value)}
            className="mr-2"
          />
          <Button onClick={addHabit}><Plus className="h-4 w-4" /></Button>
        </div>
        <ul className="space-y-2">
          {habits.map(habit => {
            const isCompletedToday = habit.lastCompleted && isSameDay(parseISO(habit.lastCompleted), new Date())
            return (
              <motion.li 
                key={habit.id} 
                className="flex items-center justify-between bg-muted p-2 rounded-md"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <span>{habit.name}</span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">Streak: {habit.streak}</span>
                  <Button
                    size="sm"
                    variant={isCompletedToday ? "destructive" : "default"}
                    onClick={() => toggleHabit(habit.id)}
                  >
                    {isCompletedToday ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                  </Button>
                </div>
              </motion.li>
            )
          })}
        </ul>
      </CardContent>
    </Card>
  )
}