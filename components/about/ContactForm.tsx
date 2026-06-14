"use client";

import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/Input";
import { MESSAGE_TOPICS, STAFF } from "@/lib/mock/about";
import { useState, type FormEvent } from "react";

export function ContactForm() {
    const [name, setName] = useState("");
    const [sendTo, setSendTo] = useState(STAFF[0].id);
    const [topic, setTopic] = useState<string>(MESSAGE_TOPICS[0]);
    const [message, setMessage] = useState("");
    const [sent, setSent] = useState(false);

    function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setSent(true);
    }

    if (sent) {
        return (
            <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-5 text-center">
                <p className="font-display text-h3 font-semibold text-green-800">
                    Message sent!
                </p>
                <p className="mt-1 font-sans text-body text-green-700">
                    We&apos;ll get back to you soon.
                </p>
                <button
                    type="button"
                    onClick={() => {
                        setSent(false);
                        setName("");
                        setMessage("");
                    }}
                    className="mt-3 font-sans text-caption font-medium text-green-700 underline underline-offset-2"
                >
                    Send another message
                </button>
            </div>
        );
    }

    const selectClass =
        "w-full rounded-lg border border-neutral-line bg-neutral-bg px-3 py-2.5 font-sans text-body text-neutral-ink focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200";

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            <h2 className="font-display text-h3 font-semibold text-neutral-ink">
                Send us a message
            </h2>
            <TextField
                label="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. สิรินทร์ แก้ว"
                required
                autoComplete="name"
            />
            <div className="flex flex-col gap-1">
                <label className="font-sans text-body font-medium text-neutral-ink">
                    Send to
                </label>
                <select
                    value={sendTo}
                    onChange={(e) => setSendTo(e.target.value)}
                    className={selectClass}
                >
                    {STAFF.map((s) => (
                        <option key={s.id} value={s.id}>
                            {s.name} — {s.role}
                        </option>
                    ))}
                </select>
            </div>
            <div className="flex flex-col gap-1">
                <label className="font-sans text-body font-medium text-neutral-ink">
                    Topic
                </label>
                <select
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className={selectClass}
                >
                    {MESSAGE_TOPICS.map((t) => (
                        <option key={t} value={t}>
                            {t}
                        </option>
                    ))}
                </select>
            </div>
            <div className="flex flex-col gap-1">
                <label className="font-sans text-body font-medium text-neutral-ink">
                    Your message
                </label>
                <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={4}
                    placeholder="Type your message here..."
                    required
                    className="w-full resize-none rounded-lg border border-neutral-line bg-neutral-bg px-3 py-2.5 font-sans text-body text-neutral-ink focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                />
            </div>
            <Button type="submit" fullWidth>
                Send message
            </Button>
        </form>
    );
}
