'use client';

import * as React from 'react';
import Report from './Report';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

// Intelligently classify document type based on title and clause content
function detectDocumentCategory(title, clauses) {
  const combined = (title + ' ' + clauses.map(c => c.summary + ' ' + (c.clause_text || '')).join(' ')).toLowerCase();
  if (/rent|lease|tenant|landlord|premises|flat|apartment|security deposit/.test(combined)) {
    return 'rental';
  }
  if (/intern|employment|salary|stipend|employee|hiring|job offer|probation/.test(combined)) {
    return 'employment';
  }
  if (/freelance|consultant|contractor|vendor|deliverables|milestone/.test(combined)) {
    return 'contractor';
  }
  if (/nda|non-disclosure|confidentiality|trade secret/.test(combined)) {
    return 'nda';
  }
  return 'general';
}

export default function ReportWorkspace({ clausesData, documentTitle = "Contract", docId, userId }) {
  const [activeTab, setActiveTab] = React.useState('graph'); // 'graph' | 'redline' | 'email'
  const [selectedFilter, setSelectedFilter] = React.useState('all');

  const docCategory = React.useMemo(() => {
    return detectDocumentCategory(documentTitle, clausesData);
  }, [documentTitle, clausesData]);

  // Universal Negotiation Parameters
  const [recipientTitle, setRecipientTitle] = React.useState(() => {
    switch (docCategory) {
      case 'rental': return 'Property Owner / Landlord';
      case 'employment': return 'Hiring Team & HR Leadership';
      case 'contractor': return 'Client / Project Stakeholder';
      default: return 'Counterparty & Legal Representative';
    }
  });

  const [senderName, setSenderName] = React.useState('Harish Krishna J');

  const [customDemand, setCustomDemand] = React.useState(() => {
    switch (docCategory) {
      case 'rental':
        return 'Ensure security deposit refund within 15 days of departure, cap annual rent escalation at 5%, and specify 30 days notice for inspections.';
      case 'employment':
        return 'Provide a competitive monthly living stipend to cover local expenses, establish transparent criteria for full-time conversion, and permit hybrid work flexibility.';
      case 'contractor':
        return 'Net-15 payment milestones, limit revisions to 2 cycles per deliverable, and retain pre-existing background IP.';
      default:
        return 'Establish mutual notice periods, cap unilateral indemnities, and balance confidentiality duration to 2 years.';
    }
  });

  // Saving / Downloading state
  const [isSaving, setIsSaving] = React.useState(false);
  const [isDownloading, setIsDownloading] = React.useState(false);
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

  // Generate a dynamic, tailored amendment / counter-response
  const generatedResponse = React.useMemo(() => {
    // Collect the concrete risky clauses and formulate tailored counter-terms
    const actionableClauses = clausesData
      .filter(c => c.impact === 'unfavourable' || (c.cons && c.cons.length > 0))
      .slice(0, 5);

    const clauseCounterPoints = actionableClauses.map((c, i) => {
      let counterTerm = c.suggested_rewrite;
      const combinedText = (c.summary + ' ' + (c.clause_text || '')).toLowerCase();

      if (/unpaid|uncompensated|no stipend|without pay/.test(combinedText)) {
        counterTerm = "Inclusion of a standard monthly living stipend/allowance to offset ongoing living and commuting expenses during the term.";
      } else if (/solely|exclusively|office|premises/.test(combinedText) && /location|bangalore|address/.test(combinedText)) {
        counterTerm = "Permit flexible hybrid working arrangements (e.g., partial remote days) where deliverables allow.";
      } else if (/discretion|not guaranteed|may be offered/.test(combinedText)) {
        counterTerm = "Establish structured performance milestones with pre-defined criteria and timelines for full-time transition/renewal.";
      } else if (/confidentiality|proprietary/.test(combinedText)) {
        counterTerm = "Narrow scope to genuine employer proprietary information, explicitly preserving ownership of personal prior knowledge and academic portfolios.";
      } else if (/deposit|refund|deduction/.test(combinedText)) {
        counterTerm = "Explicit refund timeline of 15 days upon exit, with deduction limited to documented damages excluding normal wear and tear.";
      } else if (!counterTerm) {
        counterTerm = "Mutual amendment ensuring balanced terms and bilateral notice protection.";
      }

      return `${i + 1}. REGARDING: "${c.summary}"\n• Concern: ${c.cons?.[0] || 'Unilateral risk exposure'}\n• Proposed Adjustment: ${counterTerm}`;
    }).join('\n\n');

    const categoryHeading =
      docCategory === 'rental'
        ? 'Tenancy Agreement Amendment & Review'
        : docCategory === 'employment'
        ? 'Offer Letter Counter-Proposal & Addendum'
        : docCategory === 'contractor'
        ? 'Service Agreement Terms Adjustment'
        : 'Contract Terms Review & Proposed Amendments';

    return `Subject: Inquiries & Proposed Amendments: ${documentTitle} - ${senderName}

Dear ${recipientTitle},

Thank you for providing the agreement for review. I have carefully examined the terms of ${documentTitle}. While I look forward to finalizing our arrangement, there are several key clauses that require clarification and balanced adjustment prior to signature.

KEY CLAUSES REQUIRING AMENDMENT:

${clauseCounterPoints || '1. Terms require mutual balance and clear review milestones.'}

ADDITIONAL CONSTRUCTIVE REQUESTS:
• ${customDemand}

TIMELINE FOR EXECUTION:
To ensure both parties have adequate time to review these adjustments and execute the amended agreement, I request an extension of 5 business days on the acceptance timeline.

I am confident that these adjustments provide mutual clarity, protection, and a sound foundation for our collaboration. Please let me know your availability for a brief call to finalize these terms.

Sincerely,
${senderName}`;
  }, [documentTitle, docCategory, recipientTitle, senderName, customDemand, clausesData]);

  // Save to database quietly
  const handleSaveDraft = async () => {
    if (!docId) {
      toast.error("Document ID not found.");
      return;
    }
    setIsSaving(true);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
      const res = await fetch(`${backendUrl}/api/documents/${docId}/negotiation-draft`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId || 1,
          subject: `Proposed Amendments: ${documentTitle}`,
          email_body: generatedResponse,
          stipend_amount: customDemand,
          key_points: {
            category: docCategory,
            recipient: recipientTitle,
            sender: senderName,
            customDemand
          },
          export_to_s3: true
        }),
      });

      if (!res.ok) throw new Error("Save failed");
      setLastSavedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      toast.success("Draft saved successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Could not save draft.");
    } finally {
      setIsSaving(false);
    }
  };

  // Download directly to user's device as a file
  const handleDownloadFile = () => {
    setIsDownloading(true);
    try {
      const cleanFilename = documentTitle.replace(/\.[^/.]+$/, "") + "_Proposed_Amendments.txt";
      const blob = new Blob([generatedResponse], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = cleanFilename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Also trigger a background cloud save
      handleSaveDraft();
      toast.success("Downloaded proposed amendments!");
    } catch (err) {
      console.error(err);
      toast.error("Download failed.");
    } finally {
      setIsDownloading(false);
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
            <span>📝</span> Proposed Amendments & Counter
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

        {/* TAB 3: UNIVERSAL AMENDMENT & COUNTER DRAFTER */}
        {activeTab === 'email' && (
          <div className="max-w-4xl mx-auto space-y-5">
            {/* Customization Inputs */}
            <Card className="bg-zinc-950 border border-zinc-800 shadow-xl">
              <CardHeader className="py-3.5 px-4 border-b border-zinc-800 bg-zinc-900/50">
                <CardTitle className="text-sm font-semibold text-zinc-100 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span>⚙️</span> Tailor Negotiation & Counter Terms
                  </span>
                  <span className="text-[11px] text-zinc-400 font-normal capitalize">
                    {docCategory} agreement mode
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3 text-xs">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-zinc-300 font-medium block mb-1">Recipient / Counterparty Title:</label>
                    <Input
                      className="h-8 text-xs bg-zinc-900 border-zinc-700 text-zinc-100"
                      value={recipientTitle}
                      onChange={(e) => setRecipientTitle(e.target.value)}
                      placeholder="e.g. Landlord, Hiring Team, Client"
                    />
                  </div>
                  <div>
                    <label className="text-zinc-300 font-medium block mb-1">Your Name / Sign-off:</label>
                    <Input
                      className="h-8 text-xs bg-zinc-900 border-zinc-700 text-zinc-100"
                      value={senderName}
                      onChange={(e) => setSenderName(e.target.value)}
                      placeholder="Your Name"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-zinc-300 font-medium block mb-1">
                    Specific Requests / Demands for this Agreement:
                  </label>
                  <textarea
                    rows={2}
                    className="w-full text-xs p-2.5 rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-100 focus:outline-none focus:ring-1 focus:ring-red-600 resize-none"
                    value={customDemand}
                    onChange={(e) => setCustomDemand(e.target.value)}
                    placeholder="Enter any specific requests (e.g. rent reduction, stipend amount, flexible remote days, refund timeline)"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Generated Counter-Letter Card */}
            <Card className="bg-zinc-950 border border-zinc-800 shadow-2xl">
              <CardHeader className="border-b border-zinc-800 py-3.5 px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                    <span>📄</span> Formal Counter-Offer & Proposed Addendum
                  </CardTitle>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Addresses all identified high-risk clauses and unbalanced provisions.
                  </p>
                </div>

                {/* Clean User-Facing Action Buttons */}
                <div className="flex items-center gap-2 flex-wrap">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isSaving}
                    onClick={handleSaveDraft}
                    className="text-xs h-8 bg-zinc-900 border-zinc-700 hover:bg-zinc-800 text-zinc-200"
                  >
                    {isSaving ? "Saving..." : "💾 Save Draft"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isDownloading}
                    onClick={handleDownloadFile}
                    className="text-xs h-8 bg-zinc-900 border-zinc-700 hover:bg-zinc-800 text-zinc-200"
                  >
                    📥 Download
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => copyToClipboard(generatedResponse, "Response letter")}
                    className="text-xs h-8 bg-red-600 hover:bg-red-700 text-white font-medium"
                  >
                    📋 Copy Letter
                  </Button>
                </div>
              </CardHeader>

              {/* Status Indicator */}
              {lastSavedTime && (
                <div className="px-4 py-1.5 bg-zinc-900/50 border-b border-zinc-800 text-[11px] text-zinc-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>Draft saved at {lastSavedTime}</span>
                </div>
              )}

              <CardContent className="p-4">
                <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-4 font-mono text-xs text-zinc-200 whitespace-pre-wrap leading-relaxed shadow-inner">
                  {generatedResponse}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
