"use client";

import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BookOpen,
  Compass,
  Clock,
  ArrowLeft,
  Search,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { db } from "@/lib/db";
import { tx } from "@instantdb/react";
import { parseISO, format } from "date-fns";

type JournalType = "past" | "present" | "future" | "stoic";
type JournalStyle = "selfAuthoring" | "stoic";
type JournalEntry = {
  id: string;
  type: JournalType;
  style: JournalStyle;
  question: string;
  content: string;
  date: string;
};

type FilterCriteria = {
  activeFilter: JournalType | "all";
  searchTerm: string;
};

const getFilteredEntries = (
  entries: JournalEntry[],
  criteria: FilterCriteria
) => {
  const { activeFilter, searchTerm } = criteria;
  if (entries.length === 0) return [];

  const lowerCaseSearch = searchTerm.toLowerCase();

  return entries.filter((entry) => {
    const matchesFilter = activeFilter === "all" || entry.type === activeFilter;
    const matchesSearch =
      entry.content.toLowerCase().includes(lowerCaseSearch) ||
      entry.question.toLowerCase().includes(lowerCaseSearch);
    return matchesFilter && matchesSearch;
  });
};

export default function AllEntries() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<JournalType | "all">("all");
  const router = useRouter();

  const { isLoading: authLoading, user, error: authError } = db.useAuth();
  const {
    data,
    isLoading: dataLoading,
    error: dataError,
  } = db.useQuery({
    journalEntries: {
      $: {
        where: { userId: user?.id },
        order: {
          serverCreatedAt: "desc",
        },
      },
    },
  });

  const entries = data?.journalEntries || [];

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.target.value;
  };

  const filteredEntries = useMemo(
    () => getFilteredEntries(entries, { activeFilter, searchTerm }),
    [entries, activeFilter, searchTerm]
  );

  const handleFilterChange = (filter: JournalType | "all") => {
    setActiveFilter(filter);
  };

  const deleteEntry = (id: string) => {
    db.transact([tx.journalEntries[id].delete()]);
  };

  if (authLoading || dataLoading) return <div>Loading...</div>;
  if (authError || dataError)
    return <div>Error: {(authError || dataError)?.message}</div>;

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <Button variant="outline" onClick={() => router.push("/")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
        </Button>
        <motion.h1
          className="text-3xl font-bold"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          All Entries
        </motion.h1>
      </div>
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            type="text"
            placeholder="Search entries..."
            onChange={handleSearchChange}
            className="pl-10"
          />
        </div>
      </div>
      <Tabs
        defaultValue="all"
        className="w-full mb-6"
        onValueChange={(value) =>
          handleFilterChange(value as JournalType | "all")
        }
      >
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="past" className="bg-blue-100">
            Past
          </TabsTrigger>
          <TabsTrigger value="present" className="bg-green-100">
            Present
          </TabsTrigger>
          <TabsTrigger value="future" className="bg-yellow-100">
            Future
          </TabsTrigger>
          <TabsTrigger value="stoic" className="bg-orange-100">
            Stoic
          </TabsTrigger>
        </TabsList>
      </Tabs>
      <div className="space-y-4">
        {filteredEntries.map((entry, index) => (
          <motion.div
            key={entry.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <Card
              className={cn(
                entry.type === "stoic" ? "bg-orange-100" : "",
                entry.type === "past" ? "bg-blue-100" : "",
                entry.type === "present" ? "bg-green-100" : "",
                entry.type === "future" ? "bg-yellow-100" : ""
              )}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  <div className="flex items-center space-x-2">
                    {entry.type === "past" && <BookOpen className="h-4 w-4" />}
                    {entry.type === "present" && <Clock className="h-4 w-4" />}
                    {(entry.type === "future" || entry.type === "stoic") && (
                      <Compass className="h-4 w-4" />
                    )}
                    <span>
                      {entry.type.charAt(0).toUpperCase() + entry.type.slice(1)}{" "}
                      {entry.type === "stoic" ? "Journaling" : "Authoring"}
                    </span>
                  </div>
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">
                    {format(parseISO(entry.date), "MMMM d, yyyy")}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteEntry(entry.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="font-semibold mb-2">{entry.question}</p>
                <p className="p-4 rounded-md bg-white bg-opacity-50">
                  {entry.content}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
