"use client";

import { db } from "@/lib/db";
import JournalDashboard from "@/components/dashboard";
import { Button } from "@/components/ui/button";
import React, { useState, useRef } from "react";
import { Input } from "@/components/ui/input";

// Helper components for Magic Code Auth based on InstantDB docs
function EmailStep({ onSendEmail }: { onSendEmail: (email: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const email = inputRef.current?.value;
    if (!email) {
      setError("Email is required.");
      return;
    }
    setIsSending(true);
    setError(null);
    try {
      await db.auth.sendMagicCode({ email });
      onSendEmail(email);
    } catch (err) {
      const error = err as { body?: { message?: string } };
      setError(
        error.body?.message || "Failed to send magic code. Please try again."
      );
      onSendEmail(""); // Reset sentEmail if sending failed
    } finally {
      setIsSending(false);
    }
  };

  return (
    <form
      key="email"
      onSubmit={handleSubmit}
      className="flex flex-col space-y-4"
    >
      <h2 className="text-xl font-bold">Let&apos;s log you in</h2>
      <p className="text-muted-foreground">
        Enter your email, and we&apos;ll send you a verification code.
      </p>
      <Input
        ref={inputRef}
        type="email"
        placeholder="Enter your email"
        required
        autoFocus
        disabled={isSending}
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
      <Button type="submit" disabled={isSending} className="w-full">
        {isSending ? "Sending Code..." : "Send Code"}
      </Button>
    </form>
  );
}

function CodeStep({
  sentEmail,
  onResendCode,
  onBack,
}: {
  sentEmail: string;
  onResendCode: () => void;
  onBack: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const code = inputRef.current?.value;
    if (!code) {
      setError("Verification code is required.");
      return;
    }
    setIsVerifying(true);
    setError(null);
    try {
      await db.auth.signInWithMagicCode({ email: sentEmail, code });
      // Successful sign-in will trigger a re-render by useAuth
    } catch (err) {
      const error = err as { body?: { message?: string } };
      if (inputRef.current) inputRef.current.value = "";
      setError(error.body?.message || "Invalid code. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <form
      key="code"
      onSubmit={handleSubmit}
      className="flex flex-col space-y-4"
    >
      <h2 className="text-xl font-bold">Enter your code</h2>
      <p className="text-muted-foreground">
        We sent an email to <strong>{sentEmail}</strong>. Check your email and
        paste the code.
      </p>
      <Input
        ref={inputRef}
        type="text"
        placeholder="123456..."
        required
        autoFocus
        disabled={isVerifying}
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
      <Button type="submit" disabled={isVerifying} className="w-full">
        {isVerifying ? "Verifying..." : "Verify Code"}
      </Button>
      <Button
        type="button"
        variant="link"
        onClick={onResendCode}
        disabled={isVerifying}
      >
        Resend Code
      </Button>
      <Button
        type="button"
        variant="outline"
        onClick={onBack}
        disabled={isVerifying}
      >
        Back to email
      </Button>
    </form>
  );
}

export default function Home() {
  const { isLoading, user, error: authError } = db.useAuth();
  const [sentEmail, setSentEmail] = useState("");

  const handleResendCode = () => {
    if (sentEmail) {
      db.auth.sendMagicCode({ email: sentEmail }).catch((err) => {
        const error = err as { body?: { message?: string } };
        // Optionally show an error to the user if resend fails
        console.error("Failed to resend code:", error);
        alert(
          "Failed to resend code: " +
            (error.body?.message || "Please try again later.")
        );
      });
    }
  };

  const handleBackToEmail = () => {
    setSentEmail("");
  };

  if (isLoading)
    return (
      <div className="flex min-h-screen items-center justify-center">
        Loading...
      </div>
    );
  if (authError)
    return (
      <div className="flex min-h-screen items-center justify-center">
        Error: {authError.message}
      </div>
    );

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="w-full max-w-sm rounded-lg border bg-card p-8 shadow-lg text-card-foreground">
          {!sentEmail ? (
            <EmailStep onSendEmail={setSentEmail} />
          ) : (
            <CodeStep
              sentEmail={sentEmail}
              onResendCode={handleResendCode}
              onBack={handleBackToEmail}
            />
          )}
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
