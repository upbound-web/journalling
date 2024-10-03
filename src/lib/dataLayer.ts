import { observable } from '@legendapp/state'
import { persistObservable } from '@legendapp/state/persist'
import { ObservablePersistLocalStorage } from '@legendapp/state/persist-plugins/local-storage'

export type JournalType = 'past' | 'present' | 'future' | 'stoic'
export type JournalStyle = 'selfAuthoring' | 'stoic'

export type JournalEntry = {
  id: string;
  style: JournalStyle;
  type: JournalType;
  question: string;
  content: string;
  date: string;
}

export type Habit = {
  id: string;
  name: string;
  streak: number;
  lastCompleted: string | null;
}

export const journalStore$ =observable({
  entries: [] as JournalEntry[],
  habits: [] as Habit[],
})

persistObservable(journalStore$, {
  local: 'journal-store',
  pluginLocal: ObservablePersistLocalStorage
})

export const addJournalEntry = (entry: JournalEntry) => {
  journalStore$.entries.push(entry)
}

export const deleteJournalEntry = (id: string) => {
  journalStore$.entries.set(
    journalStore$.entries.get().filter(entry => entry.id !== id)
  )
}

export const addHabit = (habit: Habit) => {
  journalStore$.habits.push(habit)
}

export const updateHabit = (id: string, updates: Partial<Habit>) => {
    const index = journalStore$.habits.get().findIndex(h => h.id === id)
  if (index !== -1) {
    journalStore$.habits[index].set(prev => ({ ...prev, ...updates }))
  }
}

export const deleteHabit = (id: string) => {
  journalStore$.habits.set(
    journalStore$.habits.get().filter(habit => habit.id !== id)
  )
}

export const getHabits = () => {
  return journalStore$.habits.get()
}


export const getEntries = () => {
  return journalStore$.entries.get()
}

