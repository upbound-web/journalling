import { init } from '@instantdb/react';

type Schema = {
  journalEntries: {
    id: string;
    style: 'selfAuthoring' | 'stoic';
    type: 'past' | 'present' | 'future' | 'stoic';
    question: string;
    content: string;
    date: string;
    userId: string;
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

export const db = init<Schema>({ appId: process.env.NEXT_PUBLIC_INSTANT_DB_APP_ID || '' });