import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Check, X, Trash2 } from 'lucide-react'
import { parseISO, isSameDay } from 'date-fns'
import { useObservable } from '@legendapp/state/react'
import { journalStore$, addHabit, updateHabit, deleteHabit, Habit } from '@/lib/dataLayer'

export default function HabitTracker() {
  const [newHabitName, setNewHabitName] = useState('')
  const habits = useObservable(journalStore$.habits)

  const handleAddHabit = () => {
    if (newHabitName.trim()) {
      const newHabit: Habit = {
        id: Date.now().toString(),
        name: newHabitName.trim(),
        streak: 0,
        lastCompleted: null
      }
      addHabit(newHabit)
      setNewHabitName('')
    }
  }

  const toggleHabit = (id: string) => {
    const habit = habits.get().find(h => h.id === id)
    if (habit) {
      const today = new Date()
      const lastCompleted = habit.lastCompleted.get()
      if (lastCompleted && isSameDay(parseLastCompleted(lastCompleted), today)) {
        updateHabit(id, { streak: Math.max(0, habit.streak.get() - 1), lastCompleted: null })
      } else {
        updateHabit(id, { streak: habit.streak.get() + 1, lastCompleted: today.toISOString() })
      }
    }
  }

  const handleDeleteHabit = (id: string) => {
    deleteHabit(id)
  }

  const parseLastCompleted = (lastCompleted: string | Date | null): Date | null => {
    if (!lastCompleted) return null;
    if (lastCompleted instanceof Date) return lastCompleted;
    if (typeof lastCompleted === 'string') return parseISO(lastCompleted);
    return null;
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
          <Button onClick={handleAddHabit}><Plus className="h-4 w-4" /></Button>
        </div>
        <ul className="space-y-2">
          {habits.get().map(habit => {
            const lastCompleted = habit.lastCompleted.get()
            const parsedLastCompleted = parseLastCompleted(lastCompleted)
            const isCompletedToday = parsedLastCompleted ? isSameDay(parsedLastCompleted, new Date()) : false
            return (
              <motion.li 
                key={habit.id.get()} 
                className="flex items-center justify-between bg-muted p-2 rounded-md"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <span>{habit.name.get()}</span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">Streak: {habit.streak.get()}</span>
                  <Button
                    size="sm"
                    variant={isCompletedToday ? "destructive" : "default"}
                    onClick={() => toggleHabit(habit.id.get())}
                  >
                    {isCompletedToday ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteHabit(habit.id.get())}
                  >
                    <Trash2 className="h-4 w-4" />
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