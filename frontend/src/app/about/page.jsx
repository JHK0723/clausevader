'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Image from 'next/image'

export default function AboutPage() {
  return (
    <main className="max-w-5xl mx-auto px-6 py-12 space-y-10">
      <section className="flex flex-col items-center text-center space-y-4">
        <h1 className="text-4xl font-bold">⚖️ About LegalLens</h1>
        <Image alt="LegalLens" src="/clausevader.jpeg" height={600} width={300} />
        <p className="text-lg text-muted-foreground">
          LegalLens is your AI-powered Sith Lord legal assistant – combining cutting-edge contract analysis with a touch of dark side flair.
        </p>
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">🧩 What is LegalLens?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-muted-foreground">
          <p>
            LegalLens is a contract analyzer built using GPT-4 that helps users demystify legal jargon. Whether you’re reviewing a lease or a partnership agreement, LegalLens breaks it down into clear clauses, evaluates each one for fairness and risk, and gives you the power to question it – Sith-style.
          </p>
          <blockquote className="border-l-4 pl-4 italic">
            “You may upload the agreement… but it does not favor you.” – LegalLens
          </blockquote>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">🚀 Features</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-6 text-muted-foreground">
          <ul className="list-disc pl-5 space-y-2">
            <li>📄 Upload `.pdf` or `.docx` contracts</li>
            <li>🧠 AI-powered clause extraction and simplification</li>
            <li>⚖️ Visual clause mapping (fairness vs. risk)</li>
            <li>💬 Chat with a Sith Lord legal assistant (GPT-4)</li>
            <li>🔐 Persistent user-based document storage</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">🛠 Tech Stack</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-6 text-muted-foreground">
          <div>
            <h3 className="font-semibold">Frontend</h3>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Next.js (deployed on Vercel)</li>
              <li>Tailwind CSS</li>
              <li>HTML / CSS / JS</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold">Backend</h3>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>FastAPI (deployed on Railway)</li>
              <li>PostgreSQL (via NeonDB)</li>
              <li>SQLAlchemy + Uvicorn</li>
              <li>GPT-4 (OpenAI API)</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <div className="text-center text-sm text-muted-foreground">
        Explore it in action: <a href="https://clausevader.vercel.app" className="underline">clausevader.vercel.app</a>
      </div>
    </main>
  )
}
