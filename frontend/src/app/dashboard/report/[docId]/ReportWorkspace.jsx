'use client';

import * as React from 'react';
import Report from './Report';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function ReportWorkspace({ clausesData, documentTitle = "Contract" }) {
  const [activeTab, setActiveTab] = React.useState('graph'); // 'graph' | 'redline' | 'email'
  const [selectedFilter, setSelectedFilter] = React.useState('all'); // 'all' | 'unfavourable' | 'neutral' | 'favourable'

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

  // Generate a ready-to-send counter-offer negotiation email
  const negotiationEmailText = React.useMemo(() => {
    const concerns = clausesData
      .filter(c => c.impact === 'unfavourable' || (c.cons && c.cons.length > 0))
      .slice(0, 3)
      .map(c => `• ${c.summary}: Proposed adjustment -> "${c.suggested_rewrite || 'Standard mutual language'}"`)
      .join('\n');

    return `Subject: Inquiries & Suggested Revisions regarding ${documentTitle}

Dear Hiring Team / Counterparty,

Thank you for extending this offer. I am genuinely excited about the opportunity to contribute to your team and work with your products.

After reviewing the agreement, I noticed a few specific clauses that I would like to clarify and align on prior to final execution:

${concerns || "• Compensation / Stipend: Re-evaluation of baseline terms\n• Working arrangements: Mutual flexibility in deliverables"}

I believe these adjustments provide mutual protection and ensure we start our collaboration on clear, balanced terms.

Could we schedule a brief call this week to finalize these points?

Best regards,
Candidate`;
  }, [clausesData, documentTitle]);

  return (
    <div className="flex flex-col h-full w-full">
      {/* Workspace Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-zinc-800 bg-zinc-950/70">
        {/* Navigation Tabs */}
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
            <span>⚔️</span> Clause Redline Matrix ({clausesData.length})
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
            <span>📝</span> Negotiation Counter-Offer Draft
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
            {/* Filter Pills */}
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

            {/* List of Clauses with Side-by-Side Redline */}
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
                    {/* Side-by-Side Comparison */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* Original Clause */}
                      <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-lg">
                        <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-red-400" /> Original Contract Clause
                        </div>
                        <p className="text-xs text-zinc-300 leading-relaxed">{clause.clause_text}</p>
                      </div>

                      {/* Suggested Rewrite */}
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

                    {/* Sith Interpretation & Risk Bullets */}
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

        {/* TAB 3: COUNTER-OFFER NEGOTIATION EMAIL DRAFTER */}
        {activeTab === 'email' && (
          <div className="max-w-3xl mx-auto space-y-4">
            <Card className="bg-zinc-950 border border-zinc-800 shadow-2xl">
              <CardHeader className="border-b border-zinc-800 pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base text-zinc-100 flex items-center gap-2">
                      <span>📝</span> AI-Generated Negotiation Email Draft
                    </CardTitle>
                    <p className="text-xs text-zinc-400 mt-1">
                      Ready-to-send counter-offer letter addressing this contract's high-risk clauses.
                    </p>
                  </div>
                  <Button
                    onClick={() => copyToClipboard(negotiationEmailText, "Negotiation email")}
                    className="bg-red-600 hover:bg-red-700 text-white font-medium text-xs px-4"
                  >
                    📋 Copy Email Draft
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-4 font-mono text-xs text-zinc-200 whitespace-pre-wrap leading-relaxed shadow-inner">
                  {negotiationEmailText}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
