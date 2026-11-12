"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2, AlertCircle } from "lucide-react";

type FormState = "idle" | "submitting" | "success" | "error";

export function ContactForm() {
  const [state, setState] = useState<FormState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("submitting");
    setErrorMessage(null);

    const form = event.currentTarget;
    const formData = new FormData(form);

    const payload = {
      name: formData.get("name"),
      email: formData.get("email"),
      subject: formData.get("subject"),
      message: formData.get("message"),
      website: formData.get("website"),
    };

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as { message?: string; error?: string };

      if (!response.ok) {
        setErrorMessage(data.error ?? "Something went wrong. Please try again.");
        setState("error");
        return;
      }

      setState("success");
      form.reset();
    } catch {
      setErrorMessage("We could not send your message. Please try again shortly.");
      setState("error");
    }
  }

  if (state === "success") {
    return (
      <Alert variant="success">
        <CheckCircle2 className="size-4" />
        <AlertTitle>Message sent</AlertTitle>
        <AlertDescription>
          Thank you for contacting us. We aim to respond within two working days.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {state === "error" && errorMessage ? (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertTitle>Unable to send message</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="contact-name">Your name</Label>
          <Input
            id="contact-name"
            name="name"
            required
            autoComplete="name"
            disabled={state === "submitting"}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contact-email">Email address</Label>
          <Input
            id="contact-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            disabled={state === "submitting"}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="contact-subject">Subject</Label>
        <Input
          id="contact-subject"
          name="subject"
          required
          disabled={state === "submitting"}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="contact-message">Message</Label>
        <Textarea
          id="contact-message"
          name="message"
          required
          rows={6}
          disabled={state === "submitting"}
        />
      </div>

      {/* Honeypot — hidden from users */}
      <div className="hidden" aria-hidden="true">
        <Label htmlFor="contact-website">Website</Label>
        <Input
          id="contact-website"
          name="website"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <p className="text-xs text-foreground-subtle">
        By submitting this form, you agree to our{" "}
        <Link href="/privacy" className="text-brand hover:underline">
          Privacy Policy
        </Link>
        . We use your details only to respond to your enquiry.
      </p>

      <Button type="submit" disabled={state === "submitting"}>
        {state === "submitting" ? "Sending…" : "Send message"}
      </Button>
    </form>
  );
}
