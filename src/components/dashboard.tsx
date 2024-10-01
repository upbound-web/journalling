'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, Compass, Clock, PenTool, BarChart2, Calendar, Plus, Check, X } from 'lucide-react'
import { ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { Input } from "@/components/ui/input"
import { subDays, format, isSameDay, addDays, differenceInDays } from 'date-fns'

type JournalType = 'past' | 'present' | 'future' | 'stoic'
type JournalStyle = 'selfAuthoring' | 'stoic'
type JournalEntry = {
  id: string;
  type: JournalType;
  style: JournalStyle;
  question: string;
  content: string;
  date: string;
}

type Habit = {
  id: string;
  name: string;
  streak: number;
  lastCompleted: string | null;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042']

export default function JournalDashboard() {
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [stats, setStats] = useState({ past: 0, present: 0, future: 0, stoic: 0, total: 0, streak: 0 })
  const [filteredEntries, setFilteredEntries] = useState<JournalEntry[]>([])
  const [activeFilter, setActiveFilter] = useState<JournalType | 'all'>('all')
  const [habits, setHabits] = useState<Habit[]>([])
  const [newHabitName, setNewHabitName] = useState('')
  const [daysToShow, setDaysToShow] = useState(30)
  const router = useRouter()
  useEffect(() => {
    const savedEntries = localStorage.getItem('journalEntries')
    const savedHabits = localStorage.getItem('habits')
    let parsedEntries: JournalEntry[] = []
    let parsedHabits: Habit[] = []

    if (savedEntries) {
      parsedEntries = JSON.parse(savedEntries)
      setEntries(parsedEntries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()))
      setFilteredEntries(parsedEntries.slice(0, 3))
      calculateStats(parsedEntries)
    }

    if (savedHabits) {
      parsedHabits = JSON.parse(savedHabits)
      setHabits(parsedHabits)
    }
    
    // Determine how many days to show based on the oldest entry or habit
    const oldestDate = [...parsedEntries, ...parsedHabits].reduce((oldest, item) => {
      const itemDate = new Date(item.date || item.lastCompleted || new Date())
      return itemDate < oldest ? itemDate : oldest
    }, new Date())

    const daysSinceOldest = differenceInDays(new Date(), oldestDate)
    setDaysToShow(Math.min(Math.max(daysSinceOldest + 7, 30), 365))
  }, []) // Empty dependency array

  const calculateStats = (entries: JournalEntry[]) => {
    const typeCounts = entries.reduce((acc, entry) => {
      acc[entry.type]++
      return acc
    }, { past: 0, present: 0, future: 0, stoic: 0 })

    const total = entries.length
    const streak = calculateStreak(entries)

    setStats({ ...typeCounts, total, streak })
  }

  const calculateStreak = (entries: JournalEntry[]) => {
    const sortedDates = entries.map(e => new Date(e.date).toDateString()).sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
    let streak = 0
    let currentDate = new Date()

    for (let date of sortedDates) {
      if (new Date(date).toDateString() === currentDate.toDateString()) {
        streak++
        currentDate.setDate(currentDate.getDate() - 1)
      } else if (new Date(date).toDateString() !== currentDate.toDateString()) {
        break
      }
    }

    return streak
  }

  const handleFilterChange = (filter: JournalType | 'all') => {
    setActiveFilter(filter)
    if (filter === 'all') {
      setFilteredEntries(entries.slice(0, 3))
    } else {
      const filtered = entries.filter(entry => entry.type === filter).slice(0, 3)
      setFilteredEntries(filtered)
    }
  }

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
    const updatedHabits = habits.map(habit => {
      if (habit.id === id) {
        const today = new Date().toISOString().split('T')[0] // Format: 'YYYY-MM-DD'
        if (habit.lastCompleted === today) {
          return { ...habit, streak: 0, lastCompleted: null }
        } else {
          return { ...habit, streak: habit.streak + 1, lastCompleted: today }
        }
      }
      return habit
    })
    setHabits(updatedHabits)
    localStorage.setItem('habits', JSON.stringify(updatedHabits))
  }

  const generateCommitData = () => {
    const today = new Date()
    const startDate = subDays(today, daysToShow - 1)
    const commitData = []

    for (let date = startDate; date <= today; date = addDays(date, 1)) {
      const formattedDate = format(date, 'yyyy-MM-dd')
      const entriesOnDate = entries.filter(entry => 
        entry.date === formattedDate
      )
      const habitsCompletedOnDate = habits.filter(habit => 
        habit.lastCompleted === formattedDate
      )
      
      commitData.push({
        date: formattedDate,
        journalCount: entriesOnDate.length,
        habitCount: habitsCompletedOnDate.length
      })
    }

    return commitData
  }

  // Move this outside of useEffect
  const commitData = useMemo(() => generateCommitData(), [entries, habits, daysToShow])

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
        <div className="flex justify-between w-full">
      <motion.h1 
        className="text-3xl font-bold mb-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        Journal Dashboard
      </motion.h1>
      <Button onClick={() => router.push('/add-new')}>Add New Entry</Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <motion.div variants={cardVariants} initial="hidden" animate="visible">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Entries</CardTitle>
              <PenTool className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={cardVariants} initial="hidden" animate="visible" transition={{ delay: 0.1 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.streak} days</div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={cardVariants} initial="hidden" animate="visible" transition={{ delay: 0.2 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Entry Distribution</CardTitle>
              <BarChart2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="h-[100px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Past', value: stats.past },
                        { name: 'Present', value: stats.present },
                        { name: 'Future', value: stats.future },
                        { name: 'Stoic', value: stats.stoic },
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={30}
                      outerRadius={40}
                      fill="#8884d8"
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {[stats.past, stats.present, stats.future, stats.stoic].map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center space-x-4 text-sm mt-2">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-[#0088FE] mr-1"></div>
                  Past
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-[#00C49F] mr-1"></div>
                  Present
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-[#FFBB28] mr-1"></div>
                  Future
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-[#FF8042] mr-1"></div>
                  Stoic
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
      <motion.div 
        variants={cardVariants} 
        initial="hidden" 
        animate="visible" 
        transition={{ delay: 0.3 }}
        className="mt-6"
      >
        <Card>
          <CardHeader>
            <CardTitle>Journal and Habit Activity</CardTitle>
            <CardDescription>
              {daysToShow < 365 
                ? `Your journaling and habit consistency over the last ${daysToShow} days` 
                : 'Your journaling and habit consistency over the past year'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1">
              {commitData.map((day) => (
                <div
                  key={day.date}
                  className={`w-3 h-3 rounded-sm ${
                    day.journalCount === 0 && day.habitCount === 0 ? 'bg-gray-200' :
                    day.journalCount > 0 && day.habitCount > 0 ? 'bg-green-700' :
                    day.journalCount > 0 ? 'bg-green-500' :
                    'bg-green-300'
                  }`}
                  title={`${day.date}: ${day.journalCount} journal entries, ${day.habitCount} habits completed`}
                />
              ))}
            </div>
            {commitData.every(day => day.journalCount === 0 && day.habitCount === 0) && (
              <p className="text-sm text-muted-foreground mt-2">
                Start journaling and tracking habits to see your progress here!
              </p>
            )}
            <div className="flex justify-between mt-2 text-sm">
              <span>Less</span>
              <div className="flex gap-1">
                <div className="w-3 h-3 bg-gray-200"></div>
                <div className="w-3 h-3 bg-green-300"></div>
                <div className="w-3 h-3 bg-green-500"></div>
                <div className="w-3 h-3 bg-green-700"></div>
              </div>
              <span>More</span>
            </div>
            <div className="flex justify-between mt-1 text-xs text-muted-foreground">
              <span>No activity</span>
              <span>Habits</span>
              <span>Journal</span>
              <span>Both</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>
      <motion.div 
        variants={cardVariants} 
        initial="hidden" 
        animate="visible" 
        transition={{ delay: 0.4 }}
        className="mt-6"
      >
        <Card>
          <CardHeader>
            <CardTitle>Recent Entries</CardTitle>
            <CardDescription>Your latest journal reflections</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all" className="w-full" onValueChange={(value) => handleFilterChange(value as JournalType | 'all')}>
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="past" className="bg-blue-100">Past</TabsTrigger>
                <TabsTrigger value="present" className="bg-green-100">Present</TabsTrigger>
                <TabsTrigger value="future" className="bg-yellow-100">Future</TabsTrigger>
                <TabsTrigger value="stoic" className="bg-orange-100">Stoic</TabsTrigger>
              </TabsList>
              <TabsContent value="all">
                <RecentEntriesList entries={filteredEntries} />
              </TabsContent>
              <TabsContent value="past">
                <RecentEntriesList entries={filteredEntries} />
              </TabsContent>
              <TabsContent value="present">
                <RecentEntriesList entries={filteredEntries} />
              </TabsContent>
              <TabsContent value="future">
                <RecentEntriesList entries={filteredEntries} />
              </TabsContent>
              <TabsContent value="stoic">
                <RecentEntriesList entries={filteredEntries} />
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter>
            <Link href="/all-entries" passHref className='w-full'>
              <Button variant="outline" className="w-full">View All Entries</Button>
            </Link>
          </CardFooter>
        </Card>
      </motion.div>
      <motion.div 
        variants={cardVariants} 
        initial="hidden" 
        animate="visible" 
        transition={{ delay: 0.5 }}
        className="mt-6"
      >
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
              {habits.map(habit => (
                <li key={habit.id} className="flex items-center justify-between bg-muted p-2 rounded-md">
                  <span>{habit.name}</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-muted-foreground">Streak: {habit.streak}</span>
                    <Button
                      size="sm"
                      variant={habit.lastCompleted === new Date().toISOString().split('T')[0] ? "destructive" : "default"}
                      onClick={() => toggleHabit(habit.id)}
                    >
                      {habit.lastCompleted === new Date().toISOString().split('T')[0] ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

function RecentEntriesList({ entries }: { entries: JournalEntry[] }) {
  return (
    <AnimatePresence mode="wait">
      <motion.ul
        key={entries.map(e => e.id).join(',')}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-4"
      >
        {entries.map((entry, index) => (
          <motion.li 
            key={entry.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={cn("bg-muted p-4 rounded-md", entry.type === 'stoic' ? 'bg-orange-100' : '', entry.type === 'past' ? 'bg-blue-100' : '', entry.type === 'present' ? 'bg-green-100' : '', entry.type === 'future' ? 'bg-yellow-100' : '')}
          >
            <div className="flex items-center space-x-2">
              {entry.type === 'past' && <BookOpen className="h-4 w-4" />}
              {entry.type === 'present' && <Clock className="h-4 w-4" />}
              {entry.type === 'future' && <Compass className="h-4 w-4" />}
              {entry.type === 'stoic' && <Compass className="h-4 w-4" />}
              <span className="font-semibold">{entry.type.charAt(0).toUpperCase() + entry.type.slice(1)} {entry.type === 'stoic' ? 'Journaling' : 'Authoring'}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">{new Date(entry.date).toLocaleDateString()}</p>
            <p className="mt-2 text-sm">{entry.content.slice(0, 100)}...</p>
          </motion.li>
        ))}
      </motion.ul>
    </AnimatePresence>
  )
}