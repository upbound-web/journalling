"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";

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
    <header className="bg-gray-100 py-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-xl font-bold">
          Journal App
        </Link>
        <div>
          {user ? (
            <div className="flex items-center space-x-4">
              <span>{user.email}</span>
              <Button onClick={handleLogout}>Logout</Button>
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
