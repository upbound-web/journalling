"use client";

import { useEffect } from "react";
import { redirect } from "next/navigation";
import JournalDashboard from "@/components/dashboard";
import { db } from "@/lib/db";

export default function Home() {
  const { user, isLoading } = db.useAuth();

  useEffect(() => {
    if (!isLoading && !user) {
      redirect("/login");
    }
  }, [isLoading, user]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <JournalDashboard />
    </div>
  );
}
