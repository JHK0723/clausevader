'use client';

import * as React from 'react';
import Report from './Report';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function ReportWorkspace({ clausesData, documentTitle = "Contract", docId, userId }) {
  const [activeTab, setActiveTab] = React.useState('graph'); // 'graph' | 'redline' | 'email'
  const [selectedFilter, setSelectedFilter] = React.useState('all');

  // Interactive Counter-Offer Negotiation Parameters
  const [stipendAmount, setStipendAmount] = React.useState('₹25,000 / month');
  const [remotePolicy, setRemotePolicy] = React.useState('Hybrid (2 days remote / 3 days in office)');
  const [fteMilestone, setFteMilestone] = React.useState('Formal review at Week 4 with clear performance criteria');
  const [candidateName, setCandidateName] = React.useState('Harish Krishna J');
  
  // AWS Persistence State
  const [isSavingToAws, setIsSavingToAws] = React.useState(false);
  const [isExportingToS3, setIsExportingToS3] = React.useState(false);
  const [savedS3Key, setSavedS3Key] = React.useState(null);
  const [lastSavedTime, setLastSavedTime] = React.useState(null);

  const unfavourableCount = clausesData.filter(c => c.impact === 'unfavourable').length;
  const neutralCount = clausesData.filter(c => c.impact === 'neutral').length;
  const favourableCount = clausesData.filter(c => c.impact === 'favourable').length;

  const filteredClauses = clausesData.filter(c => {
    if (selectedFilter === 'all') return true;
    return c.impact === selectedFilter;
  });

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  // Build a realistic, authoritative counter-offer email tackling the actual risks
  const generatedEmail = React.useMemo(() => {
    return `Subject: Counter-Offer & Proposed Addendum: ${documentTitle} - ${candidateName}

Dear Hiring Team & Leadership,

Thank you for selecting me for the Intern-AI Products opportunity at Logesys Solutions India. I am enthusiastic about the company's AI initiatives and confident in my ability to deliver immediate value to your products.

Having thoroughly examined the terms of the offer letter, I would like to propose a few constructive adjustments to ensure the agreement is mutually beneficial, sustainable, and aligned with standard industry practices:

1. COMPENSATION & STIPEND
• Current Term: Uncompensated / Unpaid internship.
• Proposed Counter: A professional living stipend of ${stipendAmount} to offset living and commuting expenses in Bangalore. Given the specialized AI engineering contributions expected, a performance stipend ensures dedicated focus and professional equity.

2. CLEAR FULL-TIME CONVERSION PATHWAY (PPO)
• Current Term: Discretionary consideration with no defined evaluation metrics.
• Proposed Counter: ${fteMilestone}. Upon meeting mutually agreed deliverables, a formal Full-Time Employment (FTE) offer with pre-defined compensation ranges should be extended.

3. WORKPLACE FLEXIBILITY & LOCATION
• Current Term: Strictly on-premise at the Bangalore office with no flexibility.
• Proposed Counter: ${remotePolicy}. This allows optimal productivity while meeting in-person collaboration requirements.

4. CONFIDENTIALITY & IP CLARIFICATION
• Proposed Counter: Narrow confidentiality and IP assignment clauses to strictly cover proprietary employer assets created during working hours, explicitly preserving rights to pre-existing academic research and personal developer portfolios.

5. EXECUTION TIMELINE
• To allow both sides to formalize these amendments, I respectfully request extending the acceptance deadline by 5 business days.

I am eager to finalize these terms so we can commence our work seamlessly. Could we arrange a brief call this week to finalize this addendum?

Sincerely,
${candidateName}`;
  }, [documentTitle, candidateName, stipendAmount, remotePolicy, fteMilestone]);

  // Persist to AWS Aurora PostgreSQL & AWS S3
  const handleSaveToAws = async (exportS3 = false) => {
    if (!docId) {
      toast.error("Document ID missing");
      return;
    }

    if (exportS3) setIsExportingToS3(true);
    else setIsSavingToAws(true);

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
      const res = await fetch(`${backendUrl}/api/documents/${docId}/negotiation-draft`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId || 1,
          subject: `Counter-Offer & Proposed Addendum: ${documentTitle}`,
          email_body: generatedEmail,
          stipend_amount: stipendAmount,
          key_points: {
            stipend: stipendAmount,
            remotePolicy,
            fteMilestone,
            candidate: candidateName
          },
          export_to_s3: exportS3
        }),
      });

      if (!res.ok) throw new Error("Failed to save to AWS");

      const data = await res.json();
      setLastSavedTime(new Date().toLocaleTimeString());
      if (data.s3_key) {
        setSavedS3Key(data.s3_key);
        toast.success(`Exported to AWS S3: ${data.s3_key}`);
      } else {
        toast.success("Saved counter-offer to AWS Aurora PostgreSQL!");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to save to AWS resources.");
    } finally {
      setIsSavingToAws(false);
      setIsExportingToS3(false);
    }
  };

  return (
    <div className="flex flex-col h-full w-full">
      {/* Workspace Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-zinc-800 bg-zinc-950/70">
        <div className="flex items-center gap-1.5 bg-zinc-900/90 p-1 rounded-xl border border-zinc-800">
          <button
            type="button"
            onClick={() => setActiveTab('graph')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition flex items-center gap-1.5 ${
              activeTab === 'graph'
                ? 'bg-red-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <span>📊</span> Risk Graph
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('redline')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition flex items-center gap-1.5 ${
              activeTab === 'redline'
                ? 'bg-red-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <span>⚔️</span> Redline Matrix ({clausesData.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('email')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition flex items-center gap-1.5 ${
              activeTab === 'email'
                ? 'bg-red-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <span>📝</span> Negotiation Counter-Offer Playbook
          </button>
        </div>

        {/* Risk Breakdown Badges */}
        <div className="flex items-center gap-2 text-xs">
          <span className="px-2.5 py-1 rounded-lg bg-red-950/60 border border-red-800/50 text-red-400 font-medium">
            🚨 {unfavourableCount} High Risk
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-amber-950/60 border border-amber-800/50 text-amber-400 font-medium">
            ⚠️ {neutralCount} Caution
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-emerald-950/60 border border-emerald-800/50 text-emerald-400 font-medium">
            ✅ {favourableCount} Safe
          </span>
        </div>
      </div>

      {/* Main Workspace Body */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* TAB 1: SCATTERPLOT RISK GRAPH */}
        {activeTab === 'graph' && (
          <Report clausesData={clausesData} />
        )}

        {/* TAB 2: REDLINE & CLAUSE DEFENSE MATRIX */}
        {activeTab === 'redline' && (
          <div className="space-y-4 max-w-5xl mx-auto">
            <div className="flex items-center gap-2 pb-2">
              <span className="text-xs text-zinc-400 font-medium">Filter by Risk:</span>
              {[
                { id: 'all', label: `All (${clausesData.length})` },
                { id: 'unfavourable', label: `High Risk (${unfavourableCount})` },
                { id: 'neutral', label: `Caution (${neutralCount})` },
                { id: 'favourable', label: `Safe (${favourableCount})` },
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setSelectedFilter(f.id)}
                  className={`text-xs px-2.5 py-1 rounded-lg border transition ${
                    selectedFilter === f.id
                      ? 'bg-zinc-800 text-white border-zinc-600 font-semibold'
                      : 'bg-zinc-950 text-zinc-400 border-zinc-850 hover:border-zinc-700'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="space-y-4">
              {filteredClauses.map((clause, idx) => (
                <Card key={clause.id || idx} className="bg-zinc-950/90 border border-zinc-800 shadow-xl overflow-hidden">
                  <CardHeader className="py-3 px-4 border-b border-zinc-800/80 bg-zinc-900/40 flex flex-row items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-zinc-400">#{idx + 1}</span>
                      <CardTitle className="text-sm font-semibold text-zinc-100">{clause.summary}</CardTitle>
                    </div>
                    <span className={`text-[11px] font-mono uppercase px-2 py-0.5 rounded border ${
                      clause.impact === 'unfavourable'
                        ? 'bg-red-950/60 border-red-800/60 text-red-400'
                        : clause.impact === 'favourable'
                        ? 'bg-emerald-950/60 border-emerald-800/60 text-emerald-400'
                        : 'bg-amber-950/60 border-amber-800/60 text-amber-400'
                    }`}>
                      {clause.impact} ({clause.favorability_score}%)
                    </span>
                  </CardHeader>

                  <CardContent className="p-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-lg">
                        <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-red-400" /> Original Contract Clause
                        </div>
                        <p className="text-xs text-zinc-300 leading-relaxed">{clause.clause_text}</p>
                      </div>

                      <div className="p-3 bg-cyan-950/20 border border-cyan-900/40 rounded-lg flex flex-col justify-between">
                        <div>
                          <div className="text-[11px] font-semibold text-cyan-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-cyan-400" /> Proposed Balanced Rewrite
                          </div>
                          <p className="text-xs text-zinc-200 leading-relaxed font-medium">
                            {clause.suggested_rewrite || "Clause terms appear standard; no direct rewrite recommended."}
                          </p>
                        </div>
                        {clause.suggested_rewrite && (
                          <div className="mt-3 flex justify-end">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => copyToClipboard(clause.suggested_rewrite, "Suggested rewrite")}
                              className="text-[11px] h-7 px-2.5 bg-cyan-950/40 border-cyan-800/60 hover:bg-cyan-900 text-cyan-200"
                            >
                              📋 Copy Rewrite
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-zinc-800/60 text-xs">
                      {clause.sith_view && (
                        <div className="flex-1 text-zinc-300 italic bg-red-950/20 p-2.5 rounded-lg border border-red-900/30">
                          <strong className="text-red-400 not-italic block mb-0.5">⚔️ Sith Master View:</strong>
                          "{clause.sith_view}"
                        </div>
                      )}
                      {clause.cons?.length > 0 && (
                        <div className="flex-1 bg-zinc-900/40 p-2.5 rounded-lg border border-zinc-800">
                          <strong className="text-red-400 block mb-0.5">Perils & Exposures:</strong>
                          <ul className="list-disc list-inside text-zinc-300 space-y-0.5">
                            {clause.cons.map((con, i) => (
                              <li key={i}>{con}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: COUNTER-OFFER NEGOTIATION PLAYBOOK WITH AWS PERSISTENCE */}
        {activeTab === 'email' && (
          <div className="max-w-4xl mx-auto space-y-5">
            {/* Strategy Configuration Cards */}
            <Card className="bg-zinc-950 border border-zinc-800 shadow-xl">
              <CardHeader className="py-3.5 px-4 border-b border-zinc-800 bg-zinc-900/50">
                <CardTitle className="text-sm font-semibold text-zinc-100 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span>⚙️</span> Customize Counter-Offer Leverage Points
                  </span>
                  <span className="text-[11px] text-zinc-400 font-normal">
                    Directly counters unpaid status & restrictive clauses
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="text-zinc-300 font-medium block mb-1">Requested Monthly Stipend:</label>
                  <Input
                    className="h-8 text-xs bg-zinc-900 border-zinc-700 text-zinc-100"
                    value={stipendAmount}
                    onChange={(e) => setStipendAmount(e.target.value)}
                    placeholder="e.g. ₹25,000 / month"
                  />
                </div>
                <div>
                  <label className="text-zinc-300 font-medium block mb-1">Workplace Arrangement:</label>
                  <Input
                    className="h-8 text-xs bg-zinc-900 border-zinc-700 text-zinc-100"
                    value={remotePolicy}
                    onChange={(e) => setRemotePolicy(e.target.value)}
                    placeholder="e.g. 2 days remote"
                  />
                </div>
                <div>
                  <label className="text-zinc-300 font-medium block mb-1">Your Name / Title:</label>
                  <Input
                    className="h-8 text-xs bg-zinc-900 border-zinc-700 text-zinc-100"
                    value={candidateName}
                    onChange={(e) => setCandidateName(e.target.value)}
                    placeholder="Candidate Name"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Generated Counter-Offer Letter Card */}
            <Card className="bg-zinc-950 border border-zinc-800 shadow-2xl">
              <CardHeader className="border-b border-zinc-800 py-3.5 px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                    <span>📝</span> Active Counter-Offer Package
                  </CardTitle>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Tackles unpaid terms, performance PPO criteria, and IP rights.
                  </p>
                </div>

                {/* AWS Action Buttons */}
                <div className="flex items-center gap-2 flex-wrap">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isSavingToAws}
                    onClick={() => handleSaveToAws(false)}
                    className="text-xs h-8 bg-zinc-900 border-zinc-700 hover:bg-zinc-800 text-zinc-200"
                  >
                    {isSavingToAws ? "Saving..." : "💾 Save to Aurora DB"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isExportingToS3}
                    onClick={() => handleSaveToAws(true)}
                    className="text-xs h-8 bg-zinc-900 border-zinc-700 hover:bg-zinc-800 text-amber-300 border-amber-900/50"
                  >
                    {isExportingToS3 ? "Exporting..." : "☁️ Export to S3"}
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => copyToClipboard(generatedEmail, "Counter-offer email")}
                    className="text-xs h-8 bg-red-600 hover:bg-red-700 text-white font-medium"
                  >
                    📋 Copy Draft
                  </Button>
                </div>
              </CardHeader>

              {/* Status Bar for AWS mutations */}
              {(lastSavedTime || savedS3Key) && (
                <div className="px-4 py-2 bg-zinc-900/60 border-b border-zinc-800 flex items-center justify-between text-[11px] text-zinc-400">
                  <span>
                    {lastSavedTime && `Last saved to Aurora PostgreSQL at ${lastSavedTime}`}
                  </span>
                  {savedS3Key && (
                    <span className="text-amber-400 font-mono">
                      S3 Key: {savedS3Key}
                    </span>
                  )}
                </div>
              )}

              <CardContent className="p-4">
                <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-4 font-mono text-xs text-zinc-200 whitespace-pre-wrap leading-relaxed shadow-inner">
                  {generatedEmail}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
