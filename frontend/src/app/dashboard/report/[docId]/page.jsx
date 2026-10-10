import { fetch, fetchOne } from "@/lib/server/db";
import Report from "./Report";
import ChatWidget from "./ChatWidget";
import Score from "./Score";
import Link from "next/link";
import { getCurrentSession } from "@/lib/server/session";

export default async function Page({ params }) {
	const { docId } = await params;
	const { user } = await getCurrentSession();

	const document = await fetchOne(
		`SELECT * FROM documents WHERE id = $1`,
		[docId]
	);

	if (!document) {
		return (
			<div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
				<h2 className="text-xl font-bold text-red-500 mb-2">Document Not Found</h2>
				<p className="text-zinc-400 mb-4">The requested contract analysis could not be located.</p>
				<Link href="/dashboard" className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm">
					Return to Dashboard
				</Link>
			</div>
		);
	}

	const chatHistory = await fetch(
		`
		SELECT user_message, ai_response 
		FROM chats 
		WHERE document_id = $1 AND user_id = $2
		ORDER BY created_at ASC
		`,
		[docId, user.id]
	);

	const historyMessages = chatHistory.flatMap(chat => [
		{ from: 'user', text: chat.user_message },
		{ from: 'ai', text: chat.ai_response }
	]);

	const clausesData = await fetch(
		`SELECT * FROM clauses WHERE document_id = $1`,
		[docId]
	);

	return (
		<div className="flex flex-col min-h-screen bg-black text-zinc-100">
			{/* Top Bar: Contract Info + AWS Resources Showcase */}
			<div className="border-b border-zinc-800/80 bg-zinc-950/90 px-6 py-3 flex flex-wrap items-center justify-between gap-3">
				<div className="flex items-center gap-3">
					<Link href="/dashboard" className="text-xs text-zinc-400 hover:text-white transition flex items-center gap-1">
						← Dashboard
					</Link>
					<span className="text-zinc-700">|</span>
					<div className="flex items-center gap-2">
						<span className="text-sm font-semibold text-zinc-100">{document.filename}</span>
						<span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800/50 uppercase font-mono">
							Analyzed ({clausesData.length} clauses)
						</span>
					</div>
				</div>

				{/* AWS Resources Showcase */}
				<div className="flex items-center gap-2 flex-wrap text-[11px] text-zinc-400">
					<span className="text-zinc-500 font-medium mr-1 hidden sm:inline">⚡ AWS Infrastructure:</span>
					<span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-amber-400/90 font-mono flex items-center gap-1">
						<span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> Aurora PostgreSQL
					</span>
					<span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-orange-400/90 font-mono flex items-center gap-1">
						<span className="w-1.5 h-1.5 rounded-full bg-orange-400" /> Lambda Serverless
					</span>
					<span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-emerald-400/90 font-mono flex items-center gap-1">
						<span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> S3 Encrypted
					</span>
				</div>
			</div>

			{/* Main Content Layout */}
			<div className="flex flex-col lg:flex-row flex-1 w-full overflow-hidden">
				{/* Left section: Interactive Graph & Clause Inspector */}
				<div className="flex-1 overflow-y-auto p-2 lg:p-4">
					<Report clausesData={clausesData} />
				</div>

				{/* Right section: Score Gauge & Full-Height Chat Assistant */}
				<div className="w-full lg:w-[480px] xl:w-[540px] border-t lg:border-t-0 lg:border-l border-zinc-800/80 bg-zinc-950/60 flex flex-col h-[750px] lg:h-[calc(100vh-53px)]">
					{/* Compact Score Gauge */}
					<div className="p-4 border-b border-zinc-800/80 bg-zinc-950/40 shrink-0">
						<Score favourability_score={document.favourability_score} />
					</div>

					{/* Chat Assistant (Fills remaining height) */}
					<div className="flex-1 p-4 min-h-0 overflow-hidden">
						<ChatWidget
							documentId={docId}
							userId={user.id}
							user={user}
							history={historyMessages}
						/>
					</div>
				</div>
			</div>
		</div>
	);
}
