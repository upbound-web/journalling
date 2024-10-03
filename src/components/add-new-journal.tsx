'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, Compass, Clock, Sparkles } from 'lucide-react'
import { useRouter } from 'next/navigation'
import HabitTracker from '@/components/HabitTracker'
import { useObservable } from '@legendapp/state/react'
import { journalStore$, addJournalEntry, JournalType, JournalStyle } from '@/lib/dataLayer'

type JournalType = 'past' | 'present' | 'future' | 'stoic'
type JournalStyle = 'selfAuthoring' | 'stoic'

type JournalEntry = {
  id: string;
  style: JournalStyle;
  type: JournalType;
  question: string;
  content: string;
  date: string;
}

type Habit = {
  id: string;
  name: string;
  streak: number;
  lastCompleted: string | null;
}

const journalQuestions: Record<JournalType, string[]> = {
  past: [
    "Describe a memorable event from your childhood and how it has shaped who you are today.",
    "Write about a significant obstacle you overcame and the lessons you learned from it.",
    "Reflect on an achievement you're proud of and the steps you took to accomplish it.",
    "What is a moment from your past when you felt genuinely proud of yourself? What contributed to this feeling?",
    "Write about a time when you made a mistake or regret a decision. What would you do differently now, and what did you learn from it?",
    "How have you changed over the years? What were the key moments that led to these changes?"

  ],
  present: [
    "What are your top three strengths, and how do they influence your daily life?",
    "Outline your typical day and identify activities that contribute to your well-being.",
    "How do you handle stress, and what coping mechanisms do you use?",
    "When do you feel most confident? What activities or situations bring out the best in you?",
    "What habits or behaviors are currently holding you back? How do they affect your life and relationships?"
  ],
  future: [
    "What are your top three goals for the next five years, and why are they important to you?",
    "Identify a skill you wish to develop and outline a plan to acquire it.",
    "Envision your ideal self in ten years. Describe your personal and professional life."
  ],
  stoic: []
}

const stoicQuestions: string[] = [
  "What virtue can you practice today?",
  "What is within your control and what isn't in your current situation?",
  "How can you respond with reason to a challenge you're facing?",
  "What are you grateful for right now?",
  "How can you cultivate inner tranquility amid external chaos?",
  "What would your ideal Stoic self do in your current circumstances?",
]

export default function AddNewJournal() {
  const [currentStep, setCurrentStep] = useState(1)
  const [journalStyle, setJournalStyle] = useState<JournalStyle | null>(null)
  const [journalType, setJournalType] = useState<JournalType | null>(null)
  const [question, setQuestion] = useState<string>('')
  const [entry, setEntry] = useState<string>('')
  const [isSparkleVisible, setIsSparkleVisible] = useState(false)
  const router = useRouter()

  const habits = useObservable(journalStore$.habits)

  const handleStyleSelection = (style: JournalStyle) => {
    setJournalStyle(style)
    if (style === 'stoic') {
      const randomQuestion = stoicQuestions[Math.floor(Math.random() * stoicQuestions.length)]
      setQuestion(randomQuestion)
      setCurrentStep(2)
    } else {
      setCurrentStep(1.5) // New intermediate step for Self Authoring type selection
    }
  }

  const handleTypeSelection = (type: JournalType) => {
    setJournalType(type)
    const randomQuestion = journalQuestions[type][Math.floor(Math.random() * journalQuestions[type].length)]
    setQuestion(randomQuestion)
    setCurrentStep(2)
  }

  const saveEntry = () => {
    if (journalStyle && question && entry.trim()) {
      const newEntry = {
        id: Date.now().toString(),
        style: journalStyle,
        type: journalStyle === 'stoic' ? 'stoic' : (journalType as JournalType),
        question: question,
        content: entry,
        date: new Date().toISOString()
      }
      addJournalEntry(newEntry)
      setEntry('')
      setIsSparkleVisible(true)
      setTimeout(() => setIsSparkleVisible(false), 2000)
      setCurrentStep(3)
    }
  }

  const resetJournal = () => {
    setCurrentStep(1)
    setJournalStyle(null)
    setJournalType(null)
    setQuestion('')
    setEntry('')
  }

  const finishJournaling = () => {
    router.push('/')
  }

  const typeButtonVariants = {
    hover: { scale: 1.05, transition: { duration: 0.2 } },
    tap: { scale: 0.95, transition: { duration: 0.2 } },
  }

  const contentVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  }

  return (
    <div className="container mx-auto max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Reflective Journaling</CardTitle>
          <CardDescription>Choose your journaling style and reflect on your thoughts and experiences.</CardDescription>
        </CardHeader>
        <CardContent>
          <AnimatePresence mode="wait">
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial="hidden"
                animate="visible"
                exit="hidden"
                variants={contentVariants}
                className="space-y-4"
              >
                <h2 className="text-lg font-semibold">Step 1: Choose your journaling style</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(['selfAuthoring', 'stoic'] as const).map((style) => (
                    <motion.div key={style} variants={typeButtonVariants} whileHover="hover" whileTap="tap">
                      <Button
                        onClick={() => handleStyleSelection(style)}
                        className="h-auto py-4 flex flex-col items-center w-full"
                        variant="outline"
                      >
                        {style === 'selfAuthoring' && <BookOpen className="mb-2" />}
                        {style === 'stoic' && <Compass className="mb-2" />}
                        <span>{style === 'selfAuthoring' ? 'Self Authoring' : 'Stoic Journaling'}</span>
                      </Button>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
            {currentStep === 1.5 && (
              <motion.div
                key="step1.5"
                initial="hidden"
                animate="visible"
                exit="hidden"
                variants={contentVariants}
                className="space-y-4"
              >
                <h2 className="text-lg font-semibold">Step 2: Choose your Self Authoring focus</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {(['past', 'present', 'future'] as const).map((type) => (
                    <motion.div key={type} variants={typeButtonVariants} whileHover="hover" whileTap="tap">
                      <Button
                        onClick={() => handleTypeSelection(type)}
                        className="h-auto py-4 flex flex-col items-center w-full"
                        variant="outline"
                      >
                        {type === 'past' && <BookOpen className="mb-2" />}
                        {type === 'present' && <Clock className="mb-2" />}
                        {type === 'future' && <Compass className="mb-2" />}
                        <span>{type.charAt(0).toUpperCase() + type.slice(1)} Authoring</span>
                      </Button>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial="hidden"
                animate="visible"
                exit="hidden"
                variants={contentVariants}
                className="space-y-4"
              >
                <h2 className="text-lg font-semibold">Step 2: Reflect and Write</h2>
                <p className="text-sm text-muted-foreground">{question}</p>
                <Textarea 
                  placeholder="Start writing your journal entry here..."
                  value={entry}
                  onChange={(e) => setEntry(e.target.value)}
                  className="min-h-[200px]"
                />
              </motion.div>
            )}
            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial="hidden"
                animate="visible"
                exit="hidden"
                variants={contentVariants}
              >
                <HabitTracker />
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
        <CardFooter className="flex justify-between">
          {currentStep > 1 && (
            <Button variant="outline" onClick={() => setCurrentStep(prev => prev === 1.5 ? 1 : prev - 1)}>
              Back
            </Button>
          )}
          {currentStep < 3 ? (
            <Button onClick={currentStep === 1 ? () => {} : currentStep === 1.5 ? () => setCurrentStep(2) : saveEntry}>
              {currentStep === 1 ? 'Next' : 'Submit'}
            </Button>
          ) : (
            <Button onClick={finishJournaling}>
              Finish
            </Button>
          )}
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
  )
}