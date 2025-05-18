"use client";

import { useRouter } from "next/navigation";
import { db } from "@/lib/db";
import JournalDashboard from "@/components/dashboard";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";

export default function Home() {
  const { isLoading, user, error, signIn, signOut } = db.useAuth();
  const router = useRouter();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="mb-4 text-3xl font-bold">
            Welcome to Reflective Journal
          </h1>
          <p className="mb-8 text-muted-foreground">
            Sign in to start journaling and track your personal growth.
          </p>
          <Button onClick={() => signIn()}>Sign In</Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <JournalDashboard />
    </div>
  );
}
