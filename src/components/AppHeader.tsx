"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Calendar, PenTool } from "lucide-react";

export default function AppHeader() {
  const router = useRouter();

  const { user } = db.useAuth();

  const handleLogout = async () => {
    try {
      await db.auth.signOut();
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <header className="bg-gray-100 dark:bg-gray-800 py-4 shadow-md sticky top-0 z-50">
      <div className="container mx-auto flex justify-between items-center">
        <Link
          href="/"
          className="text-xl font-bold text-gray-800 dark:text-white"
        >
          Journal App
        </Link>
        <div>
          {user ? (
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/add-new")}
                className="flex items-center"
              >
                <PenTool className="h-4 w-4 mr-1 md:mr-1" />
                <span className="hidden md:inline">New Entry</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/weekly")}
                className="flex items-center"
              >
                <Calendar className="h-4 w-4 mr-1 md:mr-1" />
                <span className="hidden md:inline">Weekly</span>
              </Button>
              <span className="hidden md:inline">{user.email}</span>
              <Button onClick={handleLogout} size="sm">
                Logout
              </Button>
            </div>
          ) : (
            <Link href="/login">
              <Button>Login</Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
