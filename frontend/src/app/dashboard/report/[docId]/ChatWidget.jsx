'use client';

import * as React from 'react';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// Clean only specific roleplay emote tags like *leans back*, *eyes glow* without touching markdown bold (**bold**) or bullet points
function sanitizeStageDirections(raw) {
  if (!raw) return '';
  return raw
    .replace(/\*(?:leans|eyes|glares|smiles|laughs|sighs|extends|stands|whispers|steps)[^*]*\*/gi, '')
    .trim();
}

function parseInline(text) {
  if (!text) return null;
  const parts = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
    if (!boldMatch) {
      parts.push(remaining);
      break;
    }

    const index = boldMatch.index;
    if (index > 0) {
      parts.push(remaining.slice(0, index));
    }
    parts.push(
      <strong key={key++} className="font-semibold text-white">
        {boldMatch[1]}
      </strong>
    );
    remaining = remaining.slice(index + boldMatch[0].length);
  }

  return parts;
}

function FormattedMessage({ text }) {
  if (!text) return null;
  const lines = text.split('\n');

  return (
    <div className="space-y-2 leading-relaxed text-[15px]">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={idx} className="h-1" />;

        // Headers
        if (trimmed.startsWith('# ')) {
          return (
            <h3 key={idx} className="text-lg font-bold text-red-400 mt-2 mb-1">
              {parseInline(trimmed.slice(2))}
            </h3>
          );
        }
        if (trimmed.startsWith('## ') || trimmed.startsWith('### ')) {
          return (
            <h4 key={idx} className="text-base font-bold text-amber-300 mt-2 mb-1">
              {parseInline(trimmed.replace(/^#+\s*/, ''))}
            </h4>
          );
        }

        // Bullet point
        if (/^[-*•]\s+/.test(trimmed)) {
          return (
            <div key={idx} className="flex items-start gap-2 pl-2 text-zinc-200">
              <span className="text-red-500 font-bold shrink-0 mt-0.5">•</span>
              <span className="flex-1">{parseInline(trimmed.replace(/^[-*•]\s+/, ''))}</span>
            </div>
          );
        }

        // Numbered list
        const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
        if (numMatch) {
          return (
            <div key={idx} className="flex items-start gap-2 pl-2 text-zinc-200">
              <span className="text-red-400 font-mono font-bold shrink-0">{numMatch[1]}.</span>
              <span className="flex-1">{parseInline(numMatch[2])}</span>
            </div>
          );
        }

        // Table separator or row
        if (trimmed.startsWith('|')) {
          return (
            <div key={idx} className="font-mono text-xs bg-zinc-950/60 p-1.5 rounded border border-zinc-800 text-zinc-300 overflow-x-auto">
              {trimmed}
            </div>
          );
        }

        // Regular text
        return <p key={idx} className="text-zinc-200">{parseInline(line)}</p>;
      })}
    </div>
  );
}

export default function ChatWidget({ documentId, userId, user, history = [] }) {
  const [messages, setMessages] = React.useState(() => {
    if (history && history.length > 0) {
      return history.map(m => ({
        ...m,
        text: sanitizeStageDirections(m.text)
      }));
    }
    return [{
      from: 'ai',
      text: "Speak, mortal. I have parsed your contract. Ask your question and I shall reveal the legal traps and negotiation leverage within."
    }];
  });

  const [input, setInput] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [streamingText, setStreamingText] = React.useState('');
  const messagesEndRef = React.useRef(null);

  // Streaming typewriter state
  const targetReplyRef = React.useRef('');
  const revealedLengthRef = React.useRef(0);
  const streamTimerRef = React.useRef(null);
  const isStreamActiveRef = React.useRef(false);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingText]);

  React.useEffect(() => {
    return () => {
      if (streamTimerRef.current) clearInterval(streamTimerRef.current);
    };
  }, []);

  const startTypewriter = (onFinish) => {
    if (streamTimerRef.current) clearInterval(streamTimerRef.current);
    revealedLengthRef.current = 0;
    setStreamingText('');

    streamTimerRef.current = setInterval(() => {
      const target = targetReplyRef.current;
      const currentLen = revealedLengthRef.current;

      if (currentLen < target.length) {
        // Fast-forward backlog smoothly (up to 4 chars per tick)
        const step = Math.min(6, Math.max(1, Math.floor((target.length - currentLen) / 15) + 1));
        const nextLen = Math.min(target.length, currentLen + step);
        revealedLengthRef.current = nextLen;
        setStreamingText(target.slice(0, nextLen));
      } else if (!isStreamActiveRef.current && currentLen >= target.length) {
        clearInterval(streamTimerRef.current);
        streamTimerRef.current = null;
        if (onFinish) onFinish(target);
      }
    }, 14);
  };

  const sendMessage = async (presetText) => {
    const textToSend = presetText || input;
    if (!textToSend.trim() || isLoading) return;

    const userMessage = textToSend.trim();
    if (!presetText) setInput('');
    setIsLoading(true);

    setMessages(prev => [...prev, { from: 'user', text: userMessage }]);

    targetReplyRef.current = '';
    isStreamActiveRef.current = true;

    startTypewriter((finalText) => {
      const sanitized = sanitizeStageDirections(finalText);
      setMessages(prev => [...prev, { from: 'ai', text: sanitized }]);
      setStreamingText('');
      setIsLoading(false);
    });

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
    const evtSource = new EventSource(
      `${backendUrl}/api/chat/stream?document_id=${documentId}&message=${encodeURIComponent(userMessage)}&user_id=${userId}`
    );

    evtSource.onmessage = (event) => {
      if (event.data.startsWith('[Error]')) {
        targetReplyRef.current += `\n[Error: ${event.data.replace('[Error]', '').trim()}]`;
        evtSource.close();
        isStreamActiveRef.current = false;
        return;
      }
      targetReplyRef.current += event.data;
    };

    evtSource.onerror = () => {
      evtSource.close();
      isStreamActiveRef.current = false;
    };

    evtSource.addEventListener("end", () => {
      evtSource.close();
      isStreamActiveRef.current = false;
    });
  };

  return (
    <div className="h-full w-full bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-3.5 border-b border-zinc-800 bg-zinc-900/60 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_#ef4444]" />
          <div>
            <h2 className="text-sm font-semibold text-zinc-100 flex items-center gap-1.5">
              <span>ClauseVader AI Counsel</span>
            </h2>
            <p className="text-[11px] text-zinc-400">Direct Contract Analysis & Strategy</p>
          </div>
        </div>
        <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
          Dark Counsel
        </span>
      </div>

      {/* Messages Scroll Area */}
      <ScrollArea className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-4">
          {messages.map((msg, idx) => {
            const isUser = msg.from === 'user';
            return (
              <div
                key={idx}
                className={cn(
                  "flex items-start gap-3",
                  isUser ? "justify-end" : "justify-start"
                )}
              >
                {!isUser && (
                  <Avatar className="w-9 h-9 border border-red-900/60 shadow-md mt-0.5 shrink-0">
                    <AvatarImage src="/assistant.png" />
                    <AvatarFallback className="bg-red-950 text-red-200 text-xs font-bold">CV</AvatarFallback>
                  </Avatar>
                )}

                <div
                  className={cn(
                    "px-4 py-3 rounded-2xl max-w-[85%] leading-relaxed text-[15px]",
                    isUser
                      ? "bg-red-600 text-white font-medium rounded-tr-sm shadow-md"
                      : "bg-zinc-900/90 border border-zinc-800/90 text-zinc-100 rounded-tl-sm shadow-lg shadow-black/40"
                  )}
                >
                  <FormattedMessage text={msg.text} />
                </div>

                {isUser && (
                  <Avatar className="w-9 h-9 border border-zinc-700 mt-0.5 shrink-0">
                    <AvatarImage src={user?.picture} />
                    <AvatarFallback className="bg-zinc-800 text-zinc-200 text-xs">U</AvatarFallback>
                  </Avatar>
                )}
              </div>
            );
          })}

          {/* Streaming message */}
          {isLoading && (
            <div className="flex items-start gap-3 justify-start">
              <Avatar className="w-9 h-9 border border-red-900/60 shadow-md mt-0.5 shrink-0">
                <AvatarImage src="/assistant.png" />
                <AvatarFallback className="bg-red-950 text-red-200 text-xs font-bold">CV</AvatarFallback>
              </Avatar>
              <div className="px-4 py-3 rounded-2xl rounded-tl-sm max-w-[85%] leading-relaxed text-[15px] bg-zinc-900/90 border border-red-900/40 text-zinc-100 shadow-lg shadow-black/40">
                {streamingText ? (
                  <div>
                    <FormattedMessage text={streamingText} />
                    <span className="inline-block w-1.5 h-4 ml-1 bg-red-500 animate-pulse align-middle" />
                  </div>
                ) : (
                  <span className="flex items-center gap-2 text-zinc-400 text-sm">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                    ClauseVader is formulating your strategic counsel...
                  </span>
                )}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Suggested Quick Prompts */}
      <div className="px-3 pt-2 pb-1 border-t border-zinc-800/80 bg-zinc-950 flex flex-wrap gap-1.5">
        {[
          "How can I negotiate this?",
          "What are the main risks?",
          "Explain confidentiality duties",
        ].map((prompt, i) => (
          <button
            key={i}
            type="button"
            disabled={isLoading}
            onClick={() => sendMessage(prompt)}
            className="text-[11px] px-2.5 py-1 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition disabled:opacity-50"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input Box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage();
        }}
        className="flex items-center gap-2 p-3 bg-zinc-950 border-t border-zinc-800"
      >
        <Input
          className="flex-1 bg-zinc-900/80 border-zinc-800 text-zinc-100 text-[14px] placeholder:text-zinc-500 focus-visible:ring-red-600"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask ClauseVader about any clause..."
          disabled={isLoading}
        />
        <Button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="bg-red-600 hover:bg-red-700 text-white px-4 font-semibold shadow-md transition"
        >
          Send
        </Button>
      </form>
    </div>
  );
}
