"use client";

import { useState, useEffect, useMemo } from "react";
import { db } from "@/lib/db";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BookOpen,
  Compass,
  Clock,
  PenTool,
  BarChart2,
  Calendar,
  Trash2,
  Edit3,
} from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import Link from "next/link";
import {
  parseISO,
  format,
  isSameDay,
  subDays,
  addDays,
  differenceInDays,
  isAfter,
  isBefore,
  startOfDay,
} from "date-fns";
import HabitTracker from "@/components/HabitTracker";
import { tx } from "@instantdb/react";

type JournalType =
  | "past"
  | "present"
  | "future"
  | "stoic"
  | "weeklyReflection"
  | "weeklyPlan";
type JournalStyle = "selfAuthoring" | "stoic" | "weekly";
type JournalEntry = {
  id: string;
  type: JournalType;
  style: JournalStyle;
  question: string;
  content: string;
  date: string; // ISO string
  obstacles?: string[];
  weekNumber?: number;
  weekYear?: number;
};

type Habit = {
  id: string;
  name: string;
  streak: number;
  lastCompleted: string | null; // ISO string or null
};

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

export default function JournalDashboard() {
  const { isLoading: authLoading, user, error: authError } = db.useAuth();
  const [filteredEntries, setFilteredEntries] = useState<JournalEntry[]>([]);
  const [daysToShow, setDaysToShow] = useState(30);
  const [stats, setStats] = useState({
    past: 0,
    present: 0,
    future: 0,
    stoic: 0,
    total: 0,
    streak: 0,
  });
  const router = useRouter();

  const [weeklyEntries, setWeeklyEntries] = useState<{
    reflection: JournalEntry | null;
    plan: JournalEntry | null;
  }>({
    reflection: null,
    plan: null,
  });

  const {
    data,
    isLoading: dataLoading,
    error: dataError,
  } = db.useQuery({
    journalEntries: {
      $: {
        where: { userId: user?.id },
        order: {
          serverCreatedAt: "desc",
        },
      },
    },
    habits: {
      $: {
        where: { userId: user?.id },
      },
    },
  });

  const entries = data?.journalEntries || [];
  const habits = data?.habits || [];

  useEffect(() => {
    if (entries.length > 0) {
      setFilteredEntries(entries.slice(0, 3));
      calculateStats(entries);

      // Find most recent weekly entries
      findMostRecentWeeklyEntries(entries);
    }

    // Determine how many days to show based on the oldest entry or habit
    const oldestDate = [...entries, ...habits].reduce((oldest, item) => {
      const itemDate = parseISO(
        (item as JournalEntry).date ||
          (item as Habit).lastCompleted ||
          new Date().toISOString()
      );
      return isBefore(itemDate, oldest) ? itemDate : oldest;
    }, new Date());

    const daysSinceOldest = differenceInDays(new Date(), oldestDate);
    setDaysToShow(Math.min(Math.max(daysSinceOldest + 7, 30), 365));
  }, [entries, habits]);

  const calculateStats = (entries: JournalEntry[]) => {
    const typeCounts = entries.reduce(
      (acc, entry) => {
        acc[entry.type]++;
        return acc;
      },
      {
        past: 0,
        present: 0,
        future: 0,
        stoic: 0,
        weeklyReflection: 0,
        weeklyPlan: 0,
      } as Record<JournalType, number>
    );

    const total = entries.length;
    const streak = calculateStreak(entries);

    setStats({ ...typeCounts, total, streak });
  };

  const calculateStreak = (entries: JournalEntry[]) => {
    const sortedDates = entries
      .map((e) => startOfDay(parseISO(e.date)))
      .sort((a, b) => (isAfter(b, a) ? 1 : -1));

    let streak = 0;
    let currentDate = startOfDay(new Date());

    for (const date of sortedDates) {
      if (isSameDay(date, currentDate)) {
        streak++;
        currentDate = subDays(currentDate, 1);
      } else if (!isSameDay(date, currentDate)) {
        break;
      }
    }

    return streak;
  };

  const handleFilterChange = (filter: JournalType | "all") => {
    if (filter === "all") {
      setFilteredEntries(entries.slice(0, 3));
    } else {
      const filtered = entries
        .filter((entry) => entry.type === filter)
        .slice(0, 3);
      setFilteredEntries(filtered);
    }
  };

  const generateCommitData = () => {
    const today = startOfDay(new Date());
    const startDate = subDays(today, daysToShow - 1);
    const commitData = [];

    for (let date = startDate; !isAfter(date, today); date = addDays(date, 1)) {
      const formattedDate = format(date, "yyyy-MM-dd");
      const entriesOnDate = entries.filter((entry) =>
        isSameDay(parseISO(entry.date), date)
      );
      const habitsCompletedOnDate = habits.filter(
        (habit) =>
          habit.completedDates &&
          habit.completedDates.some((completedDate) =>
            isSameDay(parseISO(completedDate), date)
          )
      );

      commitData.push({
        date: formattedDate,
        journalCount: entriesOnDate.length,
        habitCount: habitsCompletedOnDate.length,
      });
    }

    return commitData;
  };

  const commitData = useMemo(
    () => generateCommitData(),
    [entries, habits, daysToShow]
  );

  const findMostRecentWeeklyEntries = (entries: JournalEntry[]) => {
    // Get current week
    const now = new Date();
    const currentDate = new Date(
      Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
    );
    currentDate.setUTCDate(
      currentDate.getUTCDate() + 4 - (currentDate.getUTCDay() || 7)
    );
    const yearStart = new Date(Date.UTC(currentDate.getUTCFullYear(), 0, 1));
    const currentWeekNumber = Math.ceil(
      ((currentDate.getTime() - yearStart.getTime()) / 86400000 + 1) / 7
    );
    const currentYear = currentDate.getUTCFullYear();

    // Find most recent weekly reflection and plan
    const reflection =
      entries.find(
        (entry) =>
          entry.type === "weeklyReflection" &&
          entry.weekNumber === currentWeekNumber &&
          entry.weekYear === currentYear
      ) || null;

    const plan =
      entries.find(
        (entry) =>
          entry.type === "weeklyPlan" &&
          entry.weekNumber === currentWeekNumber &&
          entry.weekYear === currentYear
      ) || null;

    setWeeklyEntries({ reflection, plan });
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  const deleteEntry = (id: string) => {
    // Instead of updating local state, we'll delete the entry from the database
    db.transact([tx.journalEntries[id].delete()]);
  };

  if (authLoading || dataLoading) return <div>Loading...</div>;
  if (authError || dataError)
    return <div>Error: {(authError || dataError)?.message}</div>;

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
        <Button onClick={() => router.push("/add-new")}>Add New Entry</Button>
      </div>

      {/* Weekly Dashboard Section - show at the top */}
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <h2 className="text-xl font-semibold mb-4">This Week</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card
            className={cn(
              "transition-all",
              weeklyEntries.reflection
                ? "border-t-4 border-teal-500 dark:border-teal-400"
                : "bg-teal-50 dark:bg-teal-900/30 border border-teal-200 dark:border-teal-700"
            )}
          >
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">🧘‍♀️ Weekly Reflection</CardTitle>
                {weeklyEntries.reflection && weeklyEntries.reflection.id && (
                  <Link
                    href={`/add-new?editId=${weeklyEntries.reflection.id}&typeToEdit=weeklyReflection`}
                  >
                    <Button variant="outline" size="sm">
                      <Edit3 className="h-4 w-4 mr-2" />
                      Edit Reflection
                    </Button>
                  </Link>
                )}
                {!weeklyEntries.reflection && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      router.push(
                        "/add-new?style=weekly&type=weeklyReflection"
                      ); // Navigate to prefill weekly reflection
                    }}
                  >
                    Add
                  </Button>
                )}
              </div>
              <CardDescription>
                {weeklyEntries.reflection
                  ? format(
                      parseISO(weeklyEntries.reflection.date),
                      "MMMM d, yyyy"
                    )
                  : "Not completed yet"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {weeklyEntries.reflection ? (
                (() => {
                  let accomplishmentText = "";
                  let learnedText = "";
                  let thoughtText = "";
                  let currentContent = weeklyEntries.reflection!.content; // Assert non-null as we are in the 'if' block

                  const thoughtMarker = "\\n\\nTHOUGHT:";
                  const learnedMarker = "\\n\\nLEARNED:";

                  if (currentContent.includes(thoughtMarker)) {
                    const parts = currentContent.split(thoughtMarker);
                    thoughtText = parts[1]?.trim() || "";
                    currentContent = parts[0];
                  }
                  if (currentContent.includes(learnedMarker)) {
                    const parts = currentContent.split(learnedMarker);
                    learnedText = parts[1]?.trim() || "";
                    currentContent = parts[0];
                  }
                  accomplishmentText = currentContent.trim();

                  return (
                    <div className="space-y-2">
                      {accomplishmentText && (
                        <div>
                          <h3 className="text-sm font-semibold text-teal-700 dark:text-teal-400">
                            🎉 Biggest accomplishment:
                          </h3>
                          <p className="text-sm whitespace-pre-line">
                            {accomplishmentText}
                          </p>
                        </div>
                      )}

                      {learnedText && (
                        <div>
                          <h3 className="text-sm font-semibold text-teal-700 dark:text-teal-400">
                            🧠 What I learned:
                          </h3>
                          <p className="text-sm whitespace-pre-line">
                            {learnedText}
                          </p>
                        </div>
                      )}

                      {thoughtText && (
                        <div>
                          <h3 className="text-sm font-semibold text-teal-700 dark:text-teal-400">
                            🤔 Interesting thought:
                          </h3>
                          <p className="text-sm whitespace-pre-line">
                            {thoughtText}
                          </p>
                        </div>
                      )}

                      {weeklyEntries.reflection!.obstacles &&
                        weeklyEntries.reflection!.obstacles.length > 0 && (
                          <div>
                            <h3 className="text-sm font-semibold text-teal-700 dark:text-teal-400">
                              🚧 Obstacles faced:
                            </h3>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {weeklyEntries.reflection!.obstacles.map(
                                (obstacle) => (
                                  <span
                                    key={obstacle}
                                    className="px-2 py-0.5 bg-secondary text-secondary-foreground rounded-full text-xs"
                                  >
                                    {obstacle
                                      .replace(/([A-Z])/g, " $1")
                                      .replace(/^./, (str) =>
                                        str.toUpperCase()
                                      )}
                                  </span>
                                )
                              )}
                            </div>
                          </div>
                        )}
                    </div>
                  );
                })()
              ) : (
                <div className="text-sm text-muted-foreground italic">
                  Take time to reflect on your week.
                </div>
              )}
            </CardContent>
          </Card>

          <Card
            className={cn(
              "transition-all",
              weeklyEntries.plan
                ? "border-t-4 border-purple-500 dark:border-purple-400"
                : "bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-700"
            )}
          >
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">🎯 Weekly Plan</CardTitle>
                {weeklyEntries.plan && weeklyEntries.plan.id && (
                  <Link
                    href={`/add-new?editId=${weeklyEntries.plan.id}&typeToEdit=weeklyPlan`}
                  >
                    <Button variant="outline" size="sm">
                      <Edit3 className="h-4 w-4 mr-2" />
                      Edit Plan
                    </Button>
                  </Link>
                )}
                {!weeklyEntries.plan && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      router.push("/add-new?style=weekly&type=weeklyPlan");
                    }}
                  >
                    Add
                  </Button>
                )}
              </div>
              <CardDescription>
                {weeklyEntries.plan
                  ? format(parseISO(weeklyEntries.plan.date), "MMMM d, yyyy")
                  : "Not planned yet"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {weeklyEntries.plan ? (
                (() => {
                  let primaryGoalText = "";
                  let potentialObstaclesText = "";
                  let strategiesText = "";
                  let currentContent = weeklyEntries.plan!.content;

                  const strategiesMarker = "\\n\\nSTRATEGIES:";
                  const obstaclesMarker = "\\n\\nPOTENTIAL OBSTACLES:";
                  const goalMarker = "PRIMARY GOAL:"; // No \n\n needed if it's at the start

                  if (currentContent.includes(strategiesMarker)) {
                    const parts = currentContent.split(strategiesMarker);
                    strategiesText = parts[1]?.trim() || "";
                    currentContent = parts[0];
                  }
                  if (currentContent.includes(obstaclesMarker)) {
                    const parts = currentContent.split(obstaclesMarker);
                    potentialObstaclesText = parts[1]?.trim() || "";
                    currentContent = parts[0];
                  }
                  // The rest is the primary goal, remove prefix if present
                  if (currentContent.startsWith(goalMarker)) {
                    primaryGoalText = currentContent
                      .substring(goalMarker.length)
                      .trim();
                  } else {
                    primaryGoalText = currentContent.trim();
                  }

                  return (
                    <div className="space-y-3">
                      {primaryGoalText && (
                        <div>
                          <h3 className="text-sm font-semibold text-purple-700 dark:text-purple-400">
                            🌟 Primary Goal for the Week:
                          </h3>
                          <p className="text-sm whitespace-pre-line">
                            {primaryGoalText}
                          </p>
                        </div>
                      )}
                      {potentialObstaclesText && (
                        <div>
                          <h3 className="text-sm font-semibold text-purple-700 dark:text-purple-400">
                            🧐 Potential Obstacles:
                          </h3>
                          <p className="text-sm whitespace-pre-line">
                            {potentialObstaclesText}
                          </p>
                        </div>
                      )}
                      {strategiesText && (
                        <div>
                          <h3 className="text-sm font-semibold text-purple-700 dark:text-purple-400">
                            🛠️ My Strategies:
                          </h3>
                          <p className="text-sm whitespace-pre-line">
                            {strategiesText}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })()
              ) : (
                <div className="text-sm text-muted-foreground italic">
                  Plan your focus areas for the week ahead.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <motion.div variants={cardVariants} initial="hidden" animate="visible">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Entries
              </CardTitle>
              <PenTool className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Current Streak
              </CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.streak} days</div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Entry Distribution
              </CardTitle>
              <BarChart2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="h-[100px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Past", value: stats.past },
                        { name: "Present", value: stats.present },
                        { name: "Future", value: stats.future },
                        { name: "Stoic", value: stats.stoic },
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={30}
                      outerRadius={40}
                      fill="#8884d8"
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {[
                        stats.past,
                        stats.present,
                        stats.future,
                        stats.stoic,
                      ].map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
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
                : "Your journaling and habit consistency over the past year"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1">
              {commitData.map((day) => (
                <div
                  key={day.date}
                  className={`w-3 h-3 rounded-sm ${
                    day.journalCount === 0 && day.habitCount === 0
                      ? "bg-gray-200"
                      : day.journalCount > 0 && day.habitCount > 0
                      ? "bg-green-700"
                      : day.journalCount > 0
                      ? "bg-green-500"
                      : "bg-green-300"
                  }`}
                  title={`${day.date}: ${day.journalCount} journal entries, ${day.habitCount} habits completed`}
                />
              ))}
            </div>
            {commitData.every(
              (day) => day.journalCount === 0 && day.habitCount === 0
            ) && (
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
            <Tabs
              defaultValue="all"
              className="w-full"
              onValueChange={(value) =>
                handleFilterChange(value as JournalType | "all")
              }
            >
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="past" className="bg-blue-100">
                  Past
                </TabsTrigger>
                <TabsTrigger value="present" className="bg-green-100">
                  Present
                </TabsTrigger>
                <TabsTrigger value="future" className="bg-yellow-100">
                  Future
                </TabsTrigger>
                <TabsTrigger value="stoic" className="bg-orange-100">
                  Stoic
                </TabsTrigger>
              </TabsList>
              <TabsContent value="all">
                <RecentEntriesList
                  entries={filteredEntries}
                  deleteEntry={deleteEntry}
                />
              </TabsContent>
              <TabsContent value="past">
                <RecentEntriesList
                  entries={filteredEntries}
                  deleteEntry={deleteEntry}
                />
              </TabsContent>
              <TabsContent value="present">
                <RecentEntriesList
                  entries={filteredEntries}
                  deleteEntry={deleteEntry}
                />
              </TabsContent>
              <TabsContent value="future">
                <RecentEntriesList
                  entries={filteredEntries}
                  deleteEntry={deleteEntry}
                />
              </TabsContent>
              <TabsContent value="stoic">
                <RecentEntriesList
                  entries={filteredEntries}
                  deleteEntry={deleteEntry}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter>
            <Link href="/all-entries" passHref className="w-full">
              <Button variant="outline" className="w-full">
                View All Entries
              </Button>
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
  );
}

function RecentEntriesList({
  entries,
  deleteEntry,
}: {
  entries: JournalEntry[];
  deleteEntry: (id: string) => void;
}) {
  return (
    <AnimatePresence mode="wait">
      <motion.ul
        key={entries.map((e) => e.id).join(",")}
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
            className={cn(
              "bg-muted p-4 rounded-md",
              entry.type === "stoic" ? "bg-orange-100" : "",
              entry.type === "past" ? "bg-blue-100" : "",
              entry.type === "present" ? "bg-green-100" : "",
              entry.type === "future" ? "bg-yellow-100" : ""
            )}
          >
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center space-x-2">
                  {entry.type === "past" && <BookOpen className="h-4 w-4" />}
                  {entry.type === "present" && <Clock className="h-4 w-4" />}
                  {entry.type === "future" && <Compass className="h-4 w-4" />}
                  {entry.type === "stoic" && <Compass className="h-4 w-4" />}
                  <span className="font-semibold">
                    {entry.type.charAt(0).toUpperCase() + entry.type.slice(1)}{" "}
                    {entry.type === "stoic" ? "Journaling" : "Authoring"}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {format(parseISO(entry.date), "MMMM d, yyyy")}
                </p>
                <p className="mt-2 text-sm">{entry.content.slice(0, 100)}...</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => deleteEntry(entry.id)}
                className="text-red-500 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </motion.li>
        ))}
      </motion.ul>
    </AnimatePresence>
  );
}
