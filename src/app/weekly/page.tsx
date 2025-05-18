"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { motion } from "framer-motion";
import { ArrowLeft, BookOpen, Compass, Edit3 } from "lucide-react";
import { format, parseISO } from "date-fns";
import Link from "next/link";

export type JournalEntry = {
  id: string;
  style: "selfAuthoring" | "stoic" | "weekly";
  type:
    | "past"
    | "present"
    | "future"
    | "stoic"
    | "weeklyReflection"
    | "weeklyPlan";
  question: string;
  content: string;
  date: string;
  userId?: string;
  obstacles?: string[];
  weekNumber?: number;
  weekYear?: number;
};

export type WeeklyEntryGroup = {
  weekNumber: number;
  year: number;
  reflection: JournalEntry | null;
  plan: JournalEntry | null;
};

const getISOWeekAndYear = (date: Date) => {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  );
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNumber = Math.ceil(
    ((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7
  );
  return { weekNumber, year: d.getUTCFullYear() };
};

export default function WeeklyPage() {
  const { isLoading, user, error } = db.useAuth();
  const router = useRouter();
  const setActiveTab = useState<string>("current")[1];

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
  });

  if (isLoading || dataLoading) return <div>Loading...</div>;
  if (error || dataError)
    return <div>Error: {(error || dataError)?.message}</div>;
  if (!user) {
    router.push("/");
    return null;
  }

  const entries = (data?.journalEntries || []) as JournalEntry[];

  const today = new Date();
  const { weekNumber: currentWeek, year: currentYear } =
    getISOWeekAndYear(today);

  const weeklyEntries = entries
    .filter(
      (entry) =>
        entry.type === "weeklyReflection" || entry.type === "weeklyPlan"
    )
    .reduce((acc, entry) => {
      const entryDate = parseISO(entry.date);
      const { weekNumber: week, year } =
        entry.weekNumber && entry.weekYear
          ? { weekNumber: entry.weekNumber, year: entry.weekYear }
          : getISOWeekAndYear(entryDate);

      const key = `${year}-${week}`;

      if (!acc[key]) {
        acc[key] = {
          weekNumber: week,
          year,
          reflection: null,
          plan: null,
        };
      }

      if (entry.type === "weeklyReflection") {
        acc[key].reflection = entry;
      } else if (entry.type === "weeklyPlan") {
        acc[key].plan = entry;
      }

      return acc;
    }, {} as Record<string, WeeklyEntryGroup>);

  const weeklyEntriesArray = Object.values(weeklyEntries).sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    return b.weekNumber - a.weekNumber;
  });

  const currentWeekEntry = weeklyEntriesArray.find(
    (week) => week.weekNumber === currentWeek && week.year === currentYear
  ) || {
    weekNumber: currentWeek,
    year: currentYear,
    reflection: null,
    plan: null,
  };

  const pastWeeks = weeklyEntriesArray.filter(
    (week) =>
      week.year < currentYear ||
      (week.year === currentYear && week.weekNumber < currentWeek)
  );

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          className="mr-4"
          onClick={() => router.push("/")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
        <motion.h1
          className="text-3xl font-bold"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Weekly Activities
        </motion.h1>
      </div>

      <Tabs defaultValue="current" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="current">Current Week</TabsTrigger>
          <TabsTrigger value="past">Past Weeks</TabsTrigger>
        </TabsList>

        <TabsContent value="current" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">
              Week {currentWeekEntry.weekNumber}, {currentWeekEntry.year}
            </h2>
            <div className="flex gap-2">
              {!currentWeekEntry.reflection && (
                <Button
                  variant="outline"
                  onClick={() =>
                    router.push("/add-new?style=weekly&type=weeklyReflection")
                  }
                  className="flex items-center"
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  Add Reflection
                </Button>
              )}
              {!currentWeekEntry.plan && (
                <Button
                  variant="outline"
                  onClick={() =>
                    router.push("/add-new?style=weekly&type=weeklyPlan")
                  }
                  className="flex items-center"
                >
                  <Compass className="h-4 w-4 mr-2" />
                  Add Plan
                </Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <WeeklyReflectionCard
              reflection={currentWeekEntry.reflection}
              isCurrentWeek={true}
              id={currentWeekEntry.reflection?.id}
            />
            <WeeklyPlanCard
              plan={currentWeekEntry.plan}
              isCurrentWeek={true}
              id={currentWeekEntry.plan?.id}
            />
          </div>
        </TabsContent>

        <TabsContent value="past" className="space-y-8">
          {pastWeeks.length > 0 ? (
            pastWeeks.map((week) => (
              <div
                key={`${week.year}-${week.weekNumber}`}
                className="space-y-4"
              >
                <h2 className="text-xl font-semibold">
                  Week {week.weekNumber}, {week.year}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <WeeklyReflectionCard
                    reflection={week.reflection}
                    isCurrentWeek={false}
                    id={week.reflection?.id}
                  />
                  <WeeklyPlanCard
                    plan={week.plan}
                    isCurrentWeek={false}
                    id={week.plan?.id}
                  />
                </div>
              </div>
            ))
          ) : (
            <div className="text-center p-8">
              <p className="text-muted-foreground">
                No past weekly entries found.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function WeeklyReflectionCard({
  reflection,
  isCurrentWeek,
  id,
}: {
  reflection: JournalEntry | null;
  isCurrentWeek?: boolean;
  id?: string;
}) {
  if (!reflection) {
    return (
      <Card className="bg-teal-50 dark:bg-teal-900/30 border border-teal-200 dark:border-teal-700 transition-all">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex justify-between items-center">
            <span>🧘‍♀️ Weekly Reflection</span>
          </CardTitle>
          <CardDescription>Not completed yet</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground italic">
            Take time to reflect on your week.
          </div>
        </CardContent>
      </Card>
    );
  }
  return (
    <Card className="border-t-4 border-teal-500 dark:border-teal-400 transition-all">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex justify-between items-center">
          <span>🧘‍♀️ Weekly Reflection</span>
          {isCurrentWeek && id && (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/add-new?editId=${id}&typeToEdit=weeklyReflection`}>
                <Edit3 className="h-4 w-4 mr-2" />
                Edit Reflection
              </Link>
            </Button>
          )}
        </CardTitle>
        <CardDescription>
          {format(parseISO(reflection.date), "MMMM d, yyyy")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {(() => {
          let accomplishmentText = "";
          let learnedText = "";
          let thoughtText = "";
          let currentContent = reflection.content;

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
                  <p className="text-sm whitespace-pre-line">{learnedText}</p>
                </div>
              )}
              {thoughtText && (
                <div>
                  <h3 className="text-sm font-semibold text-teal-700 dark:text-teal-400">
                    🤔 Interesting thought:
                  </h3>
                  <p className="text-sm whitespace-pre-line">{thoughtText}</p>
                </div>
              )}
              {reflection.obstacles && reflection.obstacles.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-teal-700 dark:text-teal-400">
                    🚧 Obstacles faced:
                  </h3>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {reflection.obstacles.map((obstacle: string) => (
                      <span
                        key={obstacle}
                        className="px-2 py-0.5 bg-secondary text-secondary-foreground rounded-full text-xs"
                      >
                        {obstacle
                          .replace(/([A-Z])/g, " $1")
                          .replace(/^./, (str: string) => str.toUpperCase())}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })()}
      </CardContent>
    </Card>
  );
}

function WeeklyPlanCard({
  plan,
  isCurrentWeek,
  id,
}: {
  plan: JournalEntry | null;
  isCurrentWeek?: boolean;
  id?: string;
}) {
  if (!plan) {
    return (
      <Card className="bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-700 transition-all">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex justify-between items-center">
            <span>🎯 Weekly Plan</span>
          </CardTitle>
          <CardDescription>Not created yet</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground italic">
            Plan your focus and potential obstacles for the upcoming week.
          </div>
        </CardContent>
      </Card>
    );
  }

  let primaryGoalText = "";
  let potentialObstaclesText = "";
  let strategiesText = "";
  let currentContent = plan.content;

  const strategiesMarker = "\\n\\nSTRATEGIES:";
  const obstaclesMarker = "\\n\\nPOTENTIAL OBSTACLES:";
  const goalMarker = "PRIMARY GOAL:";

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
  if (currentContent.startsWith(goalMarker)) {
    primaryGoalText = currentContent.substring(goalMarker.length).trim();
  } else {
    primaryGoalText = currentContent.trim();
  }

  return (
    <Card className="border-t-4 border-purple-500 dark:border-purple-400 transition-all">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex justify-between items-center">
          <span>🎯 Weekly Plan</span>
          {isCurrentWeek && id && (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/add-new?editId=${id}&typeToEdit=weeklyPlan`}>
                <Edit3 className="h-4 w-4 mr-2" />
                Edit Plan
              </Link>
            </Button>
          )}
        </CardTitle>
        <CardDescription>
          {format(parseISO(plan.date), "MMMM d, yyyy")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {primaryGoalText && (
          <div>
            <h3 className="text-sm font-semibold text-purple-700 dark:text-purple-400">
              🌟 Primary Goal for the Week:
            </h3>
            <p className="text-sm whitespace-pre-line">{primaryGoalText}</p>
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
            <p className="text-sm whitespace-pre-line">{strategiesText}</p>
          </div>
        )}
        {!primaryGoalText && !potentialObstaclesText && !strategiesText && (
          <p className="text-sm text-muted-foreground italic">
            No plan details entered.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
