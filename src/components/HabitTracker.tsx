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
import { Plus, Check, X, MoreHorizontal } from "lucide-react"; // Updated icon
import { parseISO, isSameDay, format } from "date-fns";
import { db } from "@/lib/db";
import { id, tx } from "@instantdb/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"; // Importing shadcn DropdownMenu components
import { useToast } from "@/hooks/use-toast";

type Habit = {
  id: string;
  name: string;
  streak: number;
  lastCompleted: string | null;
  completedDates: string[];
  userId: string;
};

export default function HabitTracker() {
  const [newHabitName, setNewHabitName] = useState("");
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [editHabitName, setEditHabitName] = useState("");
  const { user } = db.useAuth();
  const { toast } = useToast();

  const { data, isLoading, error } = db.useQuery({
    habits: {
      $: {
        where: { userId: user?.id },
      },
    },
  });

  const habits = data?.habits;

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
      toast({
        title: "Habit Added",
        description: `Added "${newHabit.name}" to your habits.`,
      });
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

  // Function to delete a habit
  const deleteHabit = (habitId: string) => {
    if (confirm("Are you sure you want to delete this habit?")) {
      db.transact([tx.habits[habitId].delete()]);
      toast({
        title: "Habit Deleted",
        description: "The habit has been successfully deleted.",
      });
    }
  };

  // Function to initiate editing a habit
  const initiateEditHabit = (habit: Habit) => {
    setEditingHabit(habit);
    setEditHabitName(habit.name);
  };

  // Function to save the edited habit
  const saveEditedHabit = () => {
    if (editingHabit && editHabitName.trim()) {
      db.transact([
        tx.habits[editingHabit.id].update({ name: editHabitName.trim() }),
      ]);
      toast({
        title: "Habit Updated",
        description: `Updated habit to "${editHabitName.trim()}".`,
      });
      setEditingHabit(null);
      setEditHabitName("");
    }
  };

  // Function to cancel editing
  const cancelEdit = () => {
    setEditingHabit(null);
    setEditHabitName("");
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
                    {/* Dropdown Menu */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Options</DropdownMenuLabel>
                        <DropdownMenuItem
                          onClick={() => initiateEditHabit(habit)}
                        >
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => deleteHabit(habit.id)}>
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </motion.li>
              );
            })
          ) : (
            <div>No Habits</div>
          )}
        </ul>
      </CardContent>

      {/* Edit Habit Modal */}
      {editingHabit && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-md shadow-lg">
            <h2 className="text-lg font-semibold mb-4">Edit Habit</h2>
            <Input
              type="text"
              value={editHabitName}
              onChange={(e) => setEditHabitName(e.target.value)}
              className="mb-4"
            />
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={cancelEdit}>
                Cancel
              </Button>
              <Button onClick={saveEditedHabit}>Save</Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
