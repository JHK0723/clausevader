'use client';

import * as React from 'react';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export default function ChatWidget({ documentId, userId, user, history = [] }) {
	const [messages, setMessages] = React.useState(() => history || []);
	const [input, setInput] = React.useState('');
	const [isLoading, setIsLoading] = React.useState(false);
	const messagesEndRef = React.useRef(null);

	React.useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
	}, [messages]);

    React.useEffect(() => {
        if (messages.length === 0) {
            setMessages([{from: 'ai', text: "Greetings, mortal! What assistance do you seek with the dark side of the law?"}])
        }
    }, [messages]);
    
	const sendMessage = async () => {
		if (!input.trim()) return;
		const userMessage = input.trim();
		setInput('');
		setIsLoading(true);
		setMessages(prev => [...prev, { from: 'user', text: userMessage }]);

		let fullReply = '';
		const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
		const evtSource = new EventSource(`${backendUrl}/api/chat/stream?document_id=${documentId}&message=${encodeURIComponent(userMessage)}&user_id=${userId}`);

		evtSource.onmessage = (event) => {
			if (event.data.startsWith('[Error]')) {
				setMessages(prev => [...prev, { from: 'ai', text: event.data }]);
				evtSource.close();
				setIsLoading(false);
				return;
			}
			fullReply += event.data;
			setMessages(prev => {
				const last = prev[prev.length - 1];
				if (last && last.from === 'ai_streaming') {
					return [...prev.slice(0, -1), { from: 'ai_streaming', text: fullReply }];
				} else {
					return [...prev, { from: 'ai_streaming', text: fullReply }];
				}
			});
		};

		evtSource.onerror = () => {
			evtSource.close();
			setIsLoading(false);
		};

		evtSource.addEventListener("end", () => {
			setMessages(prev =>
				prev.map(m =>
					m.from === 'ai_streaming' ? { from: 'ai', text: m.text } : m
				)
			);
			setIsLoading(false);
		});
	};

	return (
            <div className="h-[80%] max-w-md bg-background border rounded-lg shadow-lg flex flex-col">
                <div className="p-3 border-b flex justify-between items-center">
                    <h2 className="text-lg font-semibold">Speak with the Shadows about your document</h2>
                </div>

                <ScrollArea className="flex-1 p-3 space-y-6 overflow-y-auto text-sm">
                    {messages.map((msg, idx) => {
                        const isUser = msg.from === 'user';
                        return (
                            <div
                                key={idx}
                                className={cn(
                                    "flex items-start gap-2 my-4",
                                    isUser ? "justify-end" : "justify-start"
                                )}
                            >
                                {!isUser && (
                                    <Avatar className="w-12 h-12">
                                        <AvatarImage src="/assistant.png" />
                                        <AvatarFallback>AI</AvatarFallback>
                                    </Avatar>
                                )}
                                <div
                                    className={cn(
                                        "px-3 py-2 rounded-md max-w-[75%] whitespace-pre-wrap",
                                        isUser
                                            ? "bg-primary text-primary-foreground"
                                            : "bg-muted text-muted-foreground"
                                    )}
                                >
                                    {msg.text}
                                </div>
                                {isUser && (
                                    <Avatar className="w-12 h-12">
                                        <AvatarImage src={user.picture} />
                                        <AvatarFallback>U</AvatarFallback>
                                    </Avatar>
                                )}
                            </div>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </ScrollArea>

                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        sendMessage();
                    }}
                    className="flex items-center gap-2 p-3 border-t"
                >
                    <Input
                        className="flex-1"
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask a question..."
                        disabled={isLoading}
                    />
                    <Button type="submit" disabled={isLoading}>
                        Send
                    </Button>
                </form>
            </div>

	);
}
