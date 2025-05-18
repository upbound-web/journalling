"use client";

import { useState, useCallback, memo, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BookOpen, Compass, Clock, Sparkles, Calendar } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import HabitTracker from "@/components/HabitTracker";
import { db } from "@/lib/db";
import { id, tx } from "@instantdb/react";

type JournalType =
  | "past"
  | "present"
  | "future"
  | "stoic"
  | "weeklyReflection"
  | "weeklyPlan";
type JournalStyle = "selfAuthoring" | "stoic" | "weekly";

// Define a more specific type for the journal entry data used in the form/saving
// This can include all fields from the DB schema's journalEntries table
type JournalEntryData = {
  id?: string; // Optional because it's not present for new entries
  style: JournalStyle;
  type: JournalType | null; // Type can be null initially
  question: string;
  content: string;
  date?: string; // Optional, set for new entries, kept for edits
  userId: string;
  obstacles?: string[];
  weekNumber?: number;
  weekYear?: number;
  // Add serverCreatedAt or any other fields if needed for updates/creations
};

const journalQuestions: Record<JournalType, string[]> = {
  past: [
    "Describe a memorable event from your childhood and how it has shaped who you are today.",
    "Write about a significant obstacle you overcame and the lessons you learned from it.",
    "Reflect on an achievement you're proud of and the steps you took to accomplish it.",
    "What is a moment from your past when you felt genuinely proud of yourself? What contributed to this feeling?",
    "Write about a time when you made a mistake or regret a decision. What would you do differently now, and what did you learn from it?",
    "How have you changed over the years? What were the key moments that led to these changes?",
  ],
  present: [
    "What are your top three strengths, and how do they influence your daily life?",
    "Outline your typical day and identify activities that contribute to your well-being.",
    "How do you handle stress, and what coping mechanisms do you use?",
    "When do you feel most confident? What activities or situations bring out the best in you?",
    "What habits or behaviors are currently holding you back? How do they affect your life and relationships?",
  ],
  future: [
    "What are your top three goals for the next five years, and why are they important to you?",
    "Identify a skill you wish to develop and outline a plan to acquire it.",
    "Envision your ideal self in ten years. Describe your personal and professional life.",
  ],
  stoic: [],
  weeklyReflection: [
    "What is the biggest accomplishment this week?",
    "What did I learn this week?",
    "Interesting thought of the week",
  ],
  weeklyPlan: [
    "Focus priorities for the next week",
    "Things that might get in the way",
  ],
};

const stoicQuestions: string[] = [
  "What virtue can you practice today?",
  "What is within your control and what isn't in your current situation?",
  "How can you respond with reason to a challenge you're facing?",
  "What are you grateful for right now?",
  "How can you cultivate inner tranquility amid external chaos?",
  "What would your ideal Stoic self do in your current circumstances?",
];

// Memoized text input component to prevent re-renders
const MemoizedTextarea = memo(
  ({
    value,
    onChange,
    placeholder,
    className,
  }: {
    value: string;
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    placeholder: string;
    className: string;
  }) => {
    return (
      <Textarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={className}
      />
    );
  }
);
MemoizedTextarea.displayName = "MemoizedTextarea";

// Isolated weekly reflection form
const WeeklyReflectionForm = memo(
  ({
    accomplishment,
    setAccomplishment,
    learned,
    setLearned,
    thought,
    setThought,
    selectedObstacles,
    toggleObstacle,
    saveEntry,
  }: {
    accomplishment: string;
    setAccomplishment: (value: string) => void;
    learned: string;
    setLearned: (value: string) => void;
    thought: string;
    setThought: (value: string) => void;
    selectedObstacles: string[];
    toggleObstacle: (obstacle: string) => void;
    saveEntry: () => void;
  }) => {
    const handleAccomplishmentChange = useCallback(
      (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setAccomplishment(e.target.value);
      },
      [setAccomplishment]
    );

    const handleLearnedChange = useCallback(
      (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setLearned(e.target.value);
      },
      [setLearned]
    );

    const handleThoughtChange = useCallback(
      (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setThought(e.target.value);
      },
      [setThought]
    );

    return (
      <div className="space-y-4">
        <div>
          <h3 className="font-medium mb-2">
            What is the biggest accomplishment this week?
          </h3>
          <MemoizedTextarea
            placeholder="Reflect on your biggest win..."
            value={accomplishment}
            onChange={handleAccomplishmentChange}
            className="min-h-[100px]"
          />
        </div>

        <div>
          <h3 className="font-medium mb-2">What did you learn this week?</h3>
          <MemoizedTextarea
            placeholder="Share something you learned..."
            value={learned}
            onChange={handleLearnedChange}
            className="min-h-[100px]"
          />
        </div>

        <div>
          <h3 className="font-medium mb-2">Interesting thought of the week</h3>
          <MemoizedTextarea
            placeholder="Any interesting thoughts or ideas..."
            value={thought}
            onChange={handleThoughtChange}
            className="min-h-[100px]"
          />
        </div>

        <div>
          <h3 className="font-medium mb-2">
            Which of the following affected your progress towards goals?
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[
              "Lack of motivation",
              "Unrealistic schedule",
              "Lack of planning",
              "Lack of focus",
              "Unexpected events",
            ].map((obstacle) => (
              <Button
                key={obstacle}
                variant={
                  selectedObstacles.includes(
                    obstacle.toLowerCase().replace(/ /g, "")
                  )
                    ? "default"
                    : "outline"
                }
                className="justify-start"
                onClick={() =>
                  toggleObstacle(obstacle.toLowerCase().replace(/ /g, ""))
                }
              >
                {selectedObstacles.includes(
                  obstacle.toLowerCase().replace(/ /g, "")
                )
                  ? "✓ "
                  : ""}
                {obstacle}
              </Button>
            ))}
          </div>
        </div>

        <div className="pt-2">
          <Button onClick={saveEntry} className="w-full">
            Save Weekly Reflection
          </Button>
        </div>
      </div>
    );
  }
);
WeeklyReflectionForm.displayName = "WeeklyReflectionForm";

// Isolated weekly planning form
const WeeklyPlanningForm = memo(
  ({
    primaryGoal,
    setPrimaryGoal,
    potentialObstacles,
    setPotentialObstacles,
    obstacleStrategies,
    setObstacleStrategies,
    saveEntry,
    buttonText,
  }: {
    primaryGoal: string;
    setPrimaryGoal: (value: string) => void;
    potentialObstacles: string;
    setPotentialObstacles: (value: string) => void;
    obstacleStrategies: string;
    setObstacleStrategies: (value: string) => void;
    saveEntry: () => void;
    buttonText: string;
  }) => {
    const handlePrimaryGoalChange = useCallback(
      (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setPrimaryGoal(e.target.value);
      },
      [setPrimaryGoal]
    );

    const handlePotentialObstaclesChange = useCallback(
      (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setPotentialObstacles(e.target.value);
      },
      [setPotentialObstacles]
    );

    const handleObstacleStrategiesChange = useCallback(
      (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setObstacleStrategies(e.target.value);
      },
      [setObstacleStrategies]
    );

    return (
      <div className="space-y-4">
        <div>
          <h3 className="font-medium mb-2">Primary Goal for the Week</h3>
          <MemoizedTextarea
            placeholder="What is the one most important thing you want to achieve this week?"
            value={primaryGoal}
            onChange={handlePrimaryGoalChange}
            className="min-h-[80px]"
          />
        </div>

        <div>
          <h3 className="font-medium mb-2">
            What might make achieving this goal difficult? (Potential Obstacles)
          </h3>
          <MemoizedTextarea
            placeholder="List potential challenges, internal or external..."
            value={potentialObstacles}
            onChange={handlePotentialObstaclesChange}
            className="min-h-[100px]"
          />
        </div>

        <div>
          <h3 className="font-medium mb-2">
            How will I address these potential difficulties if they arise? (My
            Strategies)
          </h3>
          <MemoizedTextarea
            placeholder="Brainstorm solutions or preventative measures..."
            value={obstacleStrategies}
            onChange={handleObstacleStrategiesChange}
            className="min-h-[100px]"
          />
        </div>

        <div className="pt-2">
          <Button onClick={saveEntry} className="w-full">
            {buttonText}
          </Button>
        </div>
      </div>
    );
  }
);
WeeklyPlanningForm.displayName = "WeeklyPlanningForm";

// Memoized Step Components for each step in the journey
const Step1 = memo(
  ({
    handleStyleSelection,
  }: {
    handleStyleSelection: (style: JournalStyle) => void;
  }) => {
    const typeButtonVariants = {
      hover: { scale: 1.05, transition: { duration: 0.2 } },
      tap: { scale: 0.95, transition: { duration: 0.2 } },
    };

    const contentVariants = {
      hidden: { opacity: 0, y: 20 },
      visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
    };

    return (
      <motion.div
        key="step1"
        initial="hidden"
        animate="visible"
        exit="hidden"
        variants={contentVariants}
        className="space-y-4"
      >
        <h2 className="text-lg font-semibold">
          Step 1: Choose your journaling style
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(["selfAuthoring", "stoic", "weekly"] as const).map((style) => (
            <motion.div
              key={style}
              variants={typeButtonVariants}
              whileHover="hover"
              whileTap="tap"
            >
              <Button
                onClick={() => handleStyleSelection(style)}
                className="h-auto py-4 flex flex-col items-center w-full"
                variant="outline"
              >
                {style === "selfAuthoring" && <BookOpen className="mb-2" />}
                {style === "stoic" && <Compass className="mb-2" />}
                {style === "weekly" && <Calendar className="mb-2" />}
                <span>
                  {style === "selfAuthoring"
                    ? "Self Authoring"
                    : style === "stoic"
                    ? "Stoic Journaling"
                    : "Weekly Activities"}
                </span>
              </Button>
            </motion.div>
          ))}
        </div>
      </motion.div>
    );
  }
);
Step1.displayName = "Step1";

const Step2 = memo(
  ({
    handleTypeSelection,
  }: {
    handleTypeSelection: (type: JournalType) => void;
  }) => {
    const typeButtonVariants = {
      hover: { scale: 1.05, transition: { duration: 0.2 } },
      tap: { scale: 0.95, transition: { duration: 0.2 } },
    };

    const contentVariants = {
      hidden: { opacity: 0, y: 20 },
      visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
    };

    return (
      <motion.div
        key="step2"
        initial="hidden"
        animate="visible"
        exit="hidden"
        variants={contentVariants}
        className="space-y-4"
      >
        <h2 className="text-lg font-semibold">
          Step 2: Choose your Self Authoring focus
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(["past", "present", "future"] as const).map((type) => (
            <motion.div
              key={type}
              variants={typeButtonVariants}
              whileHover="hover"
              whileTap="tap"
            >
              <Button
                onClick={() => handleTypeSelection(type)}
                className="h-auto py-4 flex flex-col items-center w-full"
                variant="outline"
              >
                {type === "past" && <BookOpen className="mb-2" />}
                {type === "present" && <Clock className="mb-2" />}
                {type === "future" && <Compass className="mb-2" />}
                <span>
                  {type.charAt(0).toUpperCase() + type.slice(1)} Authoring
                </span>
              </Button>
            </motion.div>
          ))}
        </div>
      </motion.div>
    );
  }
);
Step2.displayName = "Step2";

const Step3 = memo(
  ({
    question,
    entry,
    setEntry,
  }: {
    question: string;
    entry: string;
    setEntry: (value: string) => void;
  }) => {
    const contentVariants = {
      hidden: { opacity: 0, y: 20 },
      visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
    };

    const handleEntryChange = useCallback(
      (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setEntry(e.target.value);
      },
      [setEntry]
    );

    return (
      <motion.div
        key="step3"
        initial="hidden"
        animate="visible"
        exit="hidden"
        variants={contentVariants}
        className="space-y-4"
      >
        <h2 className="text-lg font-semibold">Step 3: Reflect and Write</h2>
        <p className="text-sm text-muted-foreground">{question}</p>
        <MemoizedTextarea
          placeholder="Start writing your journal entry here..."
          value={entry}
          onChange={handleEntryChange}
          className="min-h-[200px]"
        />
      </motion.div>
    );
  }
);
Step3.displayName = "Step3";

const Step5 = memo(
  ({
    handleWeeklyTypeSelection,
  }: {
    handleWeeklyTypeSelection: (
      type: "weeklyReflection" | "weeklyPlan"
    ) => void;
  }) => {
    const typeButtonVariants = {
      hover: { scale: 1.05, transition: { duration: 0.2 } },
      tap: { scale: 0.95, transition: { duration: 0.2 } },
    };

    const contentVariants = {
      hidden: { opacity: 0, y: 20 },
      visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
    };

    return (
      <motion.div
        key="step5"
        initial="hidden"
        animate="visible"
        exit="hidden"
        variants={contentVariants}
        className="space-y-4"
      >
        <h2 className="text-lg font-semibold">Choose your weekly activity</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <motion.div
            variants={typeButtonVariants}
            whileHover="hover"
            whileTap="tap"
          >
            <Button
              onClick={() => handleWeeklyTypeSelection("weeklyReflection")}
              className="h-auto py-4 flex flex-col items-center w-full"
              variant="outline"
            >
              <BookOpen className="mb-2" />
              <span>Weekly Reflection</span>
              <span className="text-xs text-muted-foreground mt-1">
                Look back at your week
              </span>
            </Button>
          </motion.div>
          <motion.div
            variants={typeButtonVariants}
            whileHover="hover"
            whileTap="tap"
          >
            <Button
              onClick={() => handleWeeklyTypeSelection("weeklyPlan")}
              className="h-auto py-4 flex flex-col items-center w-full"
              variant="outline"
            >
              <Compass className="mb-2" />
              <span>Weekly Planning</span>
              <span className="text-xs text-muted-foreground mt-1">
                Plan your upcoming week
              </span>
            </Button>
          </motion.div>
        </div>
      </motion.div>
    );
  }
);
Step5.displayName = "Step5";

const Step6 = memo(
  ({
    accomplishment,
    setAccomplishment,
    learned,
    setLearned,
    thought,
    setThought,
    selectedObstacles,
    handleToggleObstacle,
    handleSaveEntry,
  }: {
    accomplishment: string;
    setAccomplishment: (value: string) => void;
    learned: string;
    setLearned: (value: string) => void;
    thought: string;
    setThought: (value: string) => void;
    selectedObstacles: string[];
    handleToggleObstacle: (obstacle: string) => void;
    handleSaveEntry: () => void;
  }) => {
    const contentVariants = {
      hidden: { opacity: 0, y: 20 },
      visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
    };

    return (
      <motion.div
        key="step6"
        initial="hidden"
        animate="visible"
        exit="hidden"
        variants={contentVariants}
        className="space-y-6"
      >
        <h2 className="text-lg font-semibold">Weekly Reflection</h2>
        <WeeklyReflectionForm
          accomplishment={accomplishment}
          setAccomplishment={setAccomplishment}
          learned={learned}
          setLearned={setLearned}
          thought={thought}
          setThought={setThought}
          selectedObstacles={selectedObstacles}
          toggleObstacle={handleToggleObstacle}
          saveEntry={handleSaveEntry}
        />
      </motion.div>
    );
  }
);
Step6.displayName = "Step6";

const Step7 = memo(
  ({
    primaryGoal,
    setPrimaryGoal,
    potentialObstacles,
    setPotentialObstacles,
    obstacleStrategies,
    setObstacleStrategies,
    handleSaveEntry,
    isEditMode,
  }: {
    primaryGoal: string;
    setPrimaryGoal: (value: string) => void;
    potentialObstacles: string;
    setPotentialObstacles: (value: string) => void;
    obstacleStrategies: string;
    setObstacleStrategies: (value: string) => void;
    handleSaveEntry: () => void;
    isEditMode: boolean;
  }) => {
    const contentVariants = {
      hidden: { opacity: 0, y: 20 },
      visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
    };
    const buttonText = isEditMode ? "Update Weekly Plan" : "Save Weekly Plan";

    return (
      <motion.div
        key="step7"
        initial="hidden"
        animate="visible"
        exit="hidden"
        variants={contentVariants}
        className="space-y-6"
      >
        <h2 className="text-lg font-semibold">Weekly Planning</h2>
        <WeeklyPlanningForm
          primaryGoal={primaryGoal}
          setPrimaryGoal={setPrimaryGoal}
          potentialObstacles={potentialObstacles}
          setPotentialObstacles={setPotentialObstacles}
          obstacleStrategies={obstacleStrategies}
          setObstacleStrategies={setObstacleStrategies}
          saveEntry={handleSaveEntry}
          buttonText={buttonText}
        />
      </motion.div>
    );
  }
);
Step7.displayName = "Step7";

function AddNewJournalInternal() {
  console.log("AddNewJournal component is rendering");

  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("editId");
  const typeToEdit = searchParams.get("typeToEdit") as JournalType | null;

  const [currentStep, setCurrentStep] = useState(1);
  const [journalStyle, setJournalStyle] = useState<JournalStyle | null>(null);
  const [journalType, setJournalType] = useState<JournalType | null>(null);
  const [question, setQuestion] = useState<string>("");
  const [entry, setEntry] = useState<string>("");

  const [accomplishment, setAccomplishment] = useState<string>("");
  const [learned, setLearned] = useState<string>("");
  const [thought, setThought] = useState<string>("");
  const [primaryGoal, setPrimaryGoal] = useState<string>("");
  const [potentialObstacles, setPotentialObstacles] = useState<string>("");
  const [obstacleStrategies, setObstacleStrategies] = useState<string>("");

  const [isSparkleVisible, setIsSparkleVisible] = useState(false);
  const [selectedObstacles, setSelectedObstacles] = useState<string[]>([]);

  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);

  const { user } = db.useAuth();

  // Component-level query to get all entries for the user
  const { data: allEntriesData } = db.useQuery({
    journalEntries: {
      $: {
        where: { userId: user?.id },
        order: { serverCreatedAt: "desc" },
      },
    },
  });

  // Effect to load entry for editing
  useEffect(() => {
    if (editId && user && allEntriesData?.journalEntries) {
      const entryToEdit = allEntriesData.journalEntries.find(
        (e) => e.id === editId
      );

      if (entryToEdit) {
        setEditingEntryId(entryToEdit.id);
        setIsEditMode(true);
        setJournalStyle(entryToEdit.style as JournalStyle);
        setJournalType(entryToEdit.type as JournalType);
        setQuestion(entryToEdit.question);

        // Pre-fill based on type
        if (entryToEdit.type === "weeklyReflection") {
          // Clear previous states
          setAccomplishment("");
          setLearned("");
          setThought("");
          setSelectedObstacles([]);

          let currentContent = entryToEdit.content;

          const thoughtMarker = "\\n\\nTHOUGHT:";
          const learnedMarker = "\\n\\nLEARNED:";

          if (currentContent.includes(thoughtMarker)) {
            const parts = currentContent.split(thoughtMarker);
            setThought(parts[1]?.trim() || "");
            currentContent = parts[0];
          }
          if (currentContent.includes(learnedMarker)) {
            const parts = currentContent.split(learnedMarker);
            setLearned(parts[1]?.trim() || "");
            currentContent = parts[0];
          }
          setAccomplishment(currentContent.trim());
          setSelectedObstacles(entryToEdit.obstacles || []);
          setCurrentStep(6);
        } else if (entryToEdit.type === "weeklyPlan") {
          // Clear previous states first
          setPrimaryGoal("");
          setPotentialObstacles("");
          setObstacleStrategies("");

          let currentContent = entryToEdit.content;
          const obstaclesMarker = "\\n\\nPOTENTIAL OBSTACLES:";
          const strategiesMarker = "\\n\\nSTRATEGIES:";

          if (currentContent.includes(strategiesMarker)) {
            const parts = currentContent.split(strategiesMarker);
            setObstacleStrategies(parts[1]?.trim() || "");
            currentContent = parts[0];
          }
          if (currentContent.includes(obstaclesMarker)) {
            const parts = currentContent.split(obstaclesMarker);
            setPotentialObstacles(parts[1]?.trim() || "");
            currentContent = parts[0];
          }
          // Assuming the rest is the primary goal, after removing other sections
          // And removing "PRIMARY GOAL:" prefix if it exists
          const goalPrefix = "PRIMARY GOAL:";
          if (currentContent.startsWith(goalPrefix)) {
            setPrimaryGoal(currentContent.substring(goalPrefix.length).trim());
          } else {
            setPrimaryGoal(currentContent.trim());
          }

          setCurrentStep(7);
        } else {
          setEntry(entryToEdit.content);
          setCurrentStep(3); // For other types like selfAuthoring, stoic
        }
      } else {
        // Entry not found or not owned by user, reset edit mode
        setIsEditMode(false);
        setEditingEntryId(null);
        router.push("/add-new"); // Redirect to clean add-new page
      }
    } else if (!editId) {
      // Reset if not in edit mode (e.g. navigating away from an edit URL or initial load without editId)
      setIsEditMode(false);
      setEditingEntryId(null);
      // Reset form fields for a new entry
      setCurrentStep(1);
      setJournalStyle(null);
      setJournalType(null);
      setQuestion("");
      setEntry("");
      setAccomplishment("");
      setLearned("");
      setThought("");
      setPrimaryGoal("");
      setPotentialObstacles("");
      setObstacleStrategies("");
      setSelectedObstacles([]);
    }
  }, [editId, user, allEntriesData, router]); // Added router

  const handleStyleSelection = useCallback((style: JournalStyle) => {
    setJournalStyle(style);
    if (style === "stoic") {
      const randomQuestion =
        stoicQuestions[Math.floor(Math.random() * stoicQuestions.length)];
      setQuestion(randomQuestion);
      setCurrentStep(3);
    } else if (style === "weekly") {
      setCurrentStep(5);
    } else {
      setCurrentStep(2);
    }
  }, []);

  const handleTypeSelection = useCallback((type: JournalType) => {
    setJournalType(type);
    const randomQuestion =
      journalQuestions[type][
        Math.floor(Math.random() * journalQuestions[type].length)
      ];
    setQuestion(randomQuestion);
    setCurrentStep(3);
  }, []);

  const handleWeeklyTypeSelection = useCallback(
    (type: "weeklyReflection" | "weeklyPlan") => {
      if (isEditMode && typeToEdit && type !== typeToEdit) {
        // If in edit mode and user tries to switch type, potentially reset edit mode
        // Or, prevent this switch. For now, we allow it but it means they are creating new.
        setIsEditMode(false);
        setEditingEntryId(null);
      }
      setJournalType(type);
      setAccomplishment("");
      setLearned("");
      setThought("");
      setPrimaryGoal("");
      setPotentialObstacles("");
      setObstacleStrategies("");
      setSelectedObstacles([]);
      if (type === "weeklyReflection") {
        setQuestion("Weekly Reflection");
        setCurrentStep(6);
      } else {
        setQuestion("Weekly Planning");
        setCurrentStep(7);
      }
    },
    [isEditMode, typeToEdit] // Added dependencies
  );

  const handleToggleObstacle = useCallback((obstacle: string) => {
    setSelectedObstacles((prev) =>
      prev.includes(obstacle)
        ? prev.filter((o) => o !== obstacle)
        : [...prev, obstacle]
    );
  }, []);

  const getWeekNumber = (date: Date) => {
    const d = new Date(
      Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
    );
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNumber = Math.ceil(
      ((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7
    );
    return { weekNumber, year: d.getUTCFullYear() };
  };

  const handleSaveEntry = useCallback(async () => {
    if (!user || !journalStyle || !question) return;

    const now = new Date();
    const currentWeekData = getWeekNumber(now);
    let contentToSave = ""; // Renamed from 'content' to avoid conflict
    let entryTypeToSave = journalType; // Renamed

    if (journalStyle === "weekly") {
      if (journalType === "weeklyReflection") {
        contentToSave = accomplishment.trim();
        if (learned.trim()) contentToSave += `\\n\\nLEARNED:${learned.trim()}`;
        if (thought.trim()) contentToSave += `\\n\\nTHOUGHT:${thought.trim()}`;
      } else if (journalType === "weeklyPlan") {
        // Construct content for the new weekly plan structure
        contentToSave = `PRIMARY GOAL:\n${primaryGoal.trim()}`;
        if (potentialObstacles.trim())
          contentToSave += `\\n\\nPOTENTIAL OBSTACLES:\n${potentialObstacles.trim()}`;
        if (obstacleStrategies.trim())
          contentToSave += `\\n\\nSTRATEGIES:\n${obstacleStrategies.trim()}`;
      } else {
        return;
      }
    } else if (journalStyle === "stoic") {
      contentToSave = entry.trim();
      entryTypeToSave = "stoic";
    } else {
      contentToSave = entry.trim();
    }

    if (!contentToSave) return; // Check trimmed content

    // Use the defined JournalEntryData type
    const entryDataForDb: Partial<JournalEntryData> = {
      style: journalStyle,
      type: entryTypeToSave,
      question: question,
      content: contentToSave,
      userId: user.id,
      // Include weekNumber and weekYear for weekly types
      ...((journalStyle === "weekly" ||
        (isEditMode &&
          (entryTypeToSave === "weeklyReflection" ||
            entryTypeToSave === "weeklyPlan"))) && {
        weekNumber: currentWeekData.weekNumber,
        weekYear: currentWeekData.year,
      }),
      ...(entryTypeToSave === "weeklyReflection" && {
        obstacles: selectedObstacles,
      }),
    };

    try {
      if (isEditMode && editingEntryId) {
        // For updates, we don't want to change the original 'date' or 'id' typically
        // 'id' is used for the update path, 'date' might be preserved
        // We also don't want to send userId usually as it's for filtering, not an updatable field.
        const {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          id: _id,
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          date: _originalDate,
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          userId: _userId,
          ...updateData
        } = entryDataForDb;
        db.transact([tx.journalEntries[editingEntryId].update(updateData)]);
      } else {
        // Create new entry
        const newEntryData = { ...entryDataForDb, date: now.toISOString() };
        db.transact([tx.journalEntries[id()].update(newEntryData)]);
      }

      // Reset fields
      setEntry("");
      setAccomplishment("");
      setLearned("");
      setThought("");
      setPrimaryGoal("");
      setPotentialObstacles("");
      setObstacleStrategies("");
      setSelectedObstacles([]);
      if (!isEditMode) {
        // Only reset style/type if not editing, to allow further edits on the same item if desired
        setJournalStyle(null);
        setJournalType(null);
      }
      setIsSparkleVisible(true);
      setTimeout(() => setIsSparkleVisible(false), 2000);

      if (isEditMode) {
        router.push("/weekly"); // Or back to where they came from
      } else {
        setCurrentStep(4); // Or router.push("/") as before
      }
      // Reset edit mode after save
      setIsEditMode(false);
      setEditingEntryId(null);
    } catch (error) {
      console.error("Error saving journal entry:", error);
    }
  }, [
    user,
    journalStyle,
    journalType,
    question,
    entry,
    accomplishment,
    learned,
    thought,
    primaryGoal,
    potentialObstacles,
    obstacleStrategies,
    selectedObstacles,
    isEditMode,
    editingEntryId,
    router, // Added router to dependencies
  ]);

  const finishJournaling = useCallback(() => {
    router.push("/");
  }, [router]);

  const renderCurrentStep = useMemo(() => {
    switch (currentStep) {
      case 1:
        return <Step1 handleStyleSelection={handleStyleSelection} />;
      case 2:
        return <Step2 handleTypeSelection={handleTypeSelection} />;
      case 3:
        return <Step3 question={question} entry={entry} setEntry={setEntry} />;
      case 4:
        return (
          <motion.div key="step4">
            <HabitTracker />
          </motion.div>
        );
      case 5:
        return <Step5 handleWeeklyTypeSelection={handleWeeklyTypeSelection} />;
      case 6:
        return (
          <Step6
            accomplishment={accomplishment}
            setAccomplishment={setAccomplishment}
            learned={learned}
            setLearned={setLearned}
            thought={thought}
            setThought={setThought}
            selectedObstacles={selectedObstacles}
            handleToggleObstacle={handleToggleObstacle}
            handleSaveEntry={handleSaveEntry}
          />
        );
      case 7:
        return (
          <Step7
            primaryGoal={primaryGoal}
            setPrimaryGoal={setPrimaryGoal}
            potentialObstacles={potentialObstacles}
            setPotentialObstacles={setPotentialObstacles}
            obstacleStrategies={obstacleStrategies}
            setObstacleStrategies={setObstacleStrategies}
            handleSaveEntry={handleSaveEntry}
            isEditMode={isEditMode}
          />
        );
      default:
        return null;
    }
  }, [
    currentStep,
    handleStyleSelection,
    handleTypeSelection,
    handleWeeklyTypeSelection,
    question,
    entry,
    accomplishment,
    learned,
    thought,
    selectedObstacles,
    handleToggleObstacle,
    handleSaveEntry,
    primaryGoal,
    potentialObstacles,
    obstacleStrategies,
    isEditMode,
  ]);

  return (
    <div className="container mx-auto max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>
            {isEditMode
              ? `Edit ${journalType
                  ?.replace(/([A-Z])/g, " $1")
                  .replace(/^./, (str) => str.toUpperCase())}`
              : "Reflective Journaling"}
          </CardTitle>
          <CardDescription>
            {isEditMode
              ? "Update your entry below."
              : "Choose your journaling style and reflect on your thoughts and experiences."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AnimatePresence mode="wait">{renderCurrentStep}</AnimatePresence>
        </CardContent>
        <CardFooter className="flex justify-between">
          {currentStep > 1 && !isEditMode && (
            <Button
              variant="outline"
              onClick={() => setCurrentStep((prev) => prev - 1)}
            >
              Back
            </Button>
          )}
          {currentStep !== 4 &&
            (currentStep < 7 ||
            (journalStyle !== "weekly" &&
              journalStyle !== "stoic" &&
              currentStep === 3) ? (
              <Button
                onClick={
                  (currentStep === 3 && journalStyle !== "weekly") ||
                  (currentStep === 6 && journalStyle === "weekly") ||
                  (currentStep === 7 && journalStyle === "weekly")
                    ? handleSaveEntry
                    : () => setCurrentStep((prev) => prev + 1)
                }
              >
                {isEditMode
                  ? "Update Entry"
                  : (currentStep === 3 && journalStyle !== "weekly") ||
                    currentStep === 6 ||
                    currentStep === 7
                  ? "Submit"
                  : "Next"}
              </Button>
            ) : (
              <Button onClick={finishJournaling}>Finish</Button>
            ))}
        </CardFooter>
      </Card>
      <AnimatePresence>
        {isSparkleVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="fixed bottom-4 right-4 bg-primary text-primary-foreground p-3 rounded-full shadow-lg"
          >
            <Sparkles className="h-6 w-6" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default memo(AddNewJournalInternal);
