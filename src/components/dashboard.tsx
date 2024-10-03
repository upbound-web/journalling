'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, Compass, Clock, PenTool, BarChart2, Calendar, Trash2 } from 'lucide-react'
import { ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { parseISO, format, isSameDay, subDays, addDays, differenceInDays, isAfter, isBefore, startOfDay } from 'date-fns'
import HabitTracker from '@/components/HabitTracker'
import { useObservable } from '@legendapp/state/react'
import { journalStore$, deleteJournalEntry, JournalType, JournalEntry } from '@/lib/dataLayer'
import { enableReactComponents } from "@legendapp/state/config/enableReactComponents"

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042']
enableReactComponents()

export default function JournalDashboard() {
  const entries = journalStore$.entries.get()
  const habits = journalStore$.habits.get()

  const [stats, setStats] = useState({ past: 0, present: 0, future: 0, stoic: 0, total: 0, streak: 0 })
  const [filteredEntries, setFilteredEntries] = useState<JournalEntry[]>([])
  const [activeFilter, setActiveFilter] = useState<JournalType | 'all'>('all')
  const [daysToShow, setDaysToShow] = useState(30)
  const router = useRouter()

  useEffect(() => {
    const entriesArray = entries
    setFilteredEntries(entriesArray.slice(0, 3))
    calculateStats(entriesArray)

    // Determine how many days to show based on the oldest entry or habit
    const oldestDate = [...entriesArray, ...habits].reduce((oldest, item) => {
      const itemDate = parseISO(getDateValue(item, 'date') || getDateValue(item, 'lastCompleted') || new Date().toISOString());
      return isBefore(itemDate, oldest) ? itemDate : oldest;
    }, new Date());

    const daysSinceOldest = differenceInDays(new Date(), oldestDate)
    setDaysToShow(Math.min(Math.max(daysSinceOldest + 7, 30), 365))
  }, [entries, habits])

  const getDateValue = (item: any, key: string): string | undefined => {
    if (typeof item[key] === 'function') {
      return item[key]()
    } else if (item[key] && typeof item[key].get === 'function') {
      return item[key].get()
    }
    return item[key]
  }

  const calculateStats = (entries: any[]) => {
    const typeCounts = entries.reduce((acc, entry) => {
      const type = getDateValue(entry, 'type') as JournalType
      acc[type]++
      return acc
    }, { past: 0, present: 0, future: 0, stoic: 0 })

    const total = entries.length
    const streak = calculateStreak(entries)

    setStats({ ...typeCounts, total, streak })
  }

  const calculateStreak = (entries: any[]) => {
    const sortedDates = entries
      .map(e => startOfDay(parseISO(getDateValue(e, 'date') || '')))
      .sort((a, b) => isAfter(b, a) ? 1 : -1)
    
    let streak = 0
    let currentDate = startOfDay(new Date())

    for (let date of sortedDates) {
      if (isSameDay(date, currentDate)) {
        streak++
        currentDate = subDays(currentDate, 1)
      } else if (!isSameDay(date, currentDate)) {
        break
      }
    }

    return streak
  }

  const handleFilterChange = (filter: JournalType | 'all') => {
    setActiveFilter(filter);
    if (filter === 'all') {
      setFilteredEntries(entries.slice(0, 3));
    } else {
      const filtered = entries
        .filter(entry => getEntryType(entry) === filter)
        .slice(0, 3);
      setFilteredEntries(filtered);
    }
  }

  const handleDeleteEntry = (id: string) => {
    deleteJournalEntry(id)
  }

  const generateCommitData = () => {
    const today = new Date()
    const startDate = subDays(today, daysToShow - 1)
    const commitData = []

    for (let date = startDate; isBefore(date, addDays(today, 1)); date = addDays(date, 1)) {
      const formattedDate = format(date, 'yyyy-MM-dd')
      const entriesOnDate = entries.filter(entry => 
        isSameDay(parseISO(getDateValue(entry, 'date') || ''), date)
      )
      const habitsCompletedOnDate = habits.filter(habit => {
        const lastCompleted = getDateValue(habit, 'lastCompleted')
        return lastCompleted && isSameDay(parseISO(lastCompleted), date)
      })
      
      commitData.push({
        date: formattedDate,
        journalCount: entriesOnDate.length,
        habitCount: habitsCompletedOnDate.length
      })
    }

    return commitData
  }

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
                <RecentEntriesList entries={filteredEntries} deleteEntry={handleDeleteEntry} />
              </TabsContent>
              <TabsContent value="past">
                <RecentEntriesList entries={filteredEntries} deleteEntry={handleDeleteEntry} />
              </TabsContent>
              <TabsContent value="present">
                <RecentEntriesList entries={filteredEntries} deleteEntry={handleDeleteEntry} />
              </TabsContent>
              <TabsContent value="future">
                <RecentEntriesList entries={filteredEntries} deleteEntry={handleDeleteEntry} />
              </TabsContent>
              <TabsContent value="stoic">
                <RecentEntriesList entries={filteredEntries} deleteEntry={handleDeleteEntry} />
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
        <HabitTracker />
      </motion.div>
    </div>
  )
}

function RecentEntriesList({ entries, deleteEntry }: { entries: JournalEntry[], deleteEntry: (id: string) => void }) {
  const getObservableValue = (value: any) => {
    return typeof value === 'function' ? value() : value?.get?.() ?? value;
  };

  return (
    <AnimatePresence mode="wait">
      <motion.ul
        key={entries.map(e => getObservableValue(e.id)).join(',')}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-4"
      >
        {entries.map((entry, index) => {
          const type = getObservableValue(entry.type);
          const id = getObservableValue(entry.id);
          const date = getObservableValue(entry.date);
          const content = getObservableValue(entry.content);

          return (
            <motion.li 
              key={id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={cn("bg-muted p-4 rounded-md", 
                type === 'stoic' ? 'bg-orange-100' : '',
                type === 'past' ? 'bg-blue-100' : '',
                type === 'present' ? 'bg-green-100' : '',
                type === 'future' ? 'bg-yellow-100' : ''
              )}
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center space-x-2">
                    {type === 'past' && <BookOpen className="h-4 w-4" />}
                    {type === 'present' && <Clock className="h-4 w-4" />}
                    {type === 'future' && <Compass className="h-4 w-4" />}
                    {type === 'stoic' && <Compass className="h-4 w-4" />}
                    <span className="font-semibold">
                      {type.charAt(0).toUpperCase() + type.slice(1)} {type === 'stoic' ? 'Journaling' : 'Authoring'}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {format(parseISO(date), 'MMMM d, yyyy')}
                  </p>
                  <p className="mt-2 text-sm">{content.slice(0, 100)}...</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteEntry(id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </motion.li>
          );
        })}
      </motion.ul>
    </AnimatePresence>
  );
}