"use client";

import JournalDashboard from "@/components/dashboard";
import { db } from "@/lib/db";
export default function Home() {
  const { user, isLoading } = db.useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return null;
  }

  return (
    <div>
      <JournalDashboard />
    </div>
  );
}
