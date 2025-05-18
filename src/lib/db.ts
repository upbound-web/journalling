import { init } from "@instantdb/react";

type Schema = {
  journalEntries: {
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
    userId: string;
    // For weekly reflection multiple choice answers
    obstacles?: (
      | "lackOfMotivation"
      | "unrealisticSchedule"
      | "lackOfPlanning"
      | "lackOfFocus"
      | "unexpectedEvents"
    )[];
    weekNumber?: number;
    weekYear?: number;
  };
  habits: {
    id: string;
    name: string;
    streak: number;
    lastCompleted: string | null;
    completedDates: string[];
    userId: string;
  };
};

export const db = init<Schema>({
  appId: process.env.NEXT_PUBLIC_INSTANT_DB_APP_ID || "",
});
