"use client";

import AddNewJournal from "@/components/add-new-journal";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { db } from "@/lib/db";

export default function AddNew() {
  const router = useRouter();
  const { user, isLoading: loading } = db.useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <div>Please log in to access this page.</div>;
  }

  return (
    <div className="flex flex-col min-h-screen max-w-4xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <Button variant="outline" onClick={() => router.push("/")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
        </Button>
        <motion.h1
          className="text-xl md:text-3xl font-bold"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Add New Entry
        </motion.h1>
      </div>
      <div className="flex-grow justify-center items-center">
        <p>AddNewJournal component should appear below:</p>
        <AddNewJournal />
      </div>
    </div>
  );
}
