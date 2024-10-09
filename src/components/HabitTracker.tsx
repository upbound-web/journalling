import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Plus, Check, X } from "lucide-react";
import { parseISO, isSameDay, format } from "date-fns";
import { db } from "@/lib/db";
import { id, tx } from "@instantdb/react";

type Habit = {
  id: string;
  name: string;
  streak: number;
  lastCompleted: string | null;
  completedDates: string[];
  userId: string;
};

type QueryResult = {
  habits: Habit[];
};

export default function HabitTracker() {
  const [newHabitName, setNewHabitName] = useState("");

  const { user } = db.useAuth();

  const { data, isLoading, error } = db.useQuery({
    habits: {
      $: {
        where: { userId: user?.id },
      },
      // Remove the 'where' clause for now
    },
  });

  const habits = data?.habits;

  // Manually filter habits based on userId
  // const habits =
  //   data?.habits?.filter((habit) => habit.userId === user?.id) ?? [];

  const addHabit = () => {
    if (newHabitName.trim() && user) {
      const newHabit: Habit = {
        id: id(),
        name: newHabitName.trim(),
        streak: 0,
        lastCompleted: null,
        completedDates: [],
        userId: user.id,
      };
      db.transact([tx.habits[newHabit.id].update(newHabit)]);
      setNewHabitName("");
    }
  };

  const toggleHabit = (habit: Habit) => {
    const today = new Date();
    const todayString = format(today, "yyyy-MM-dd");

    let updatedHabit: Partial<Habit>;

    if (
      habit.lastCompleted &&
      isSameDay(parseISO(habit.lastCompleted), today)
    ) {
      // If already completed today, uncomplete it
      updatedHabit = {
        streak: Math.max(0, habit.streak - 1),
        lastCompleted: null,
        completedDates: habit.completedDates.filter(
          (date) => date !== todayString
        ),
      };
    } else {
      // If not completed today, complete it
      updatedHabit = {
        streak: habit.streak + 1,
        lastCompleted: today.toISOString(),
        completedDates: [...habit.completedDates, todayString],
      };
    }

    db.transact([tx.habits[habit.id].update(updatedHabit)]);
  };

  if (isLoading) return <div>Loading habits...</div>;
  if (error) return <div>Error loading habits: {error.message}</div>;

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
          <Button onClick={addHabit}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <ul className="space-y-2">
          {habits ? (
            habits.map((habit) => {
              const isCompletedToday =
                habit.lastCompleted &&
                isSameDay(parseISO(habit.lastCompleted), new Date());
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
                    <span className="text-sm text-muted-foreground">
                      Streak: {habit.streak}
                    </span>
                    <Button
                      size="sm"
                      variant={isCompletedToday ? "destructive" : "default"}
                      onClick={() => toggleHabit(habit)}
                    >
                      {isCompletedToday ? (
                        <X className="h-4 w-4" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </motion.li>
              );
            })
          ) : (
            <div>No Habbits</div>
          )}
        </ul>
      </CardContent>
    </Card>
  );
}
