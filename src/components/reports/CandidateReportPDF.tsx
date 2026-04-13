import React from "react";
import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
} from "@react-pdf/renderer";

const BRAND = "#1a1a2e";
const MUTED  = "#6b7280";
const BORDER = "#e5e7eb";
const GREEN  = "#059669";
const AMBER  = "#d97706";
const RED    = "#dc2626";
const LIGHT  = "#f9fafb";

const recColor = (r: string) =>
  r === "SHORTLIST" ? GREEN : r === "CONSIDER" ? AMBER : RED;

const s = StyleSheet.create({
  page:         { padding: 40, fontSize: 9, fontFamily: "Helvetica", color: BRAND, backgroundColor: "#ffffff" },
  // cover
  coverRule:    { borderBottomWidth: 2, borderBottomColor: BRAND, paddingBottom: 16, marginBottom: 20 },
  coverLabel:   { fontSize: 7, color: MUTED, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 6 },
  coverTitle:   { fontSize: 22, fontFamily: "Helvetica-Bold", color: BRAND, marginBottom: 4 },
  coverSub:     { fontSize: 8, color: MUTED, marginBottom: 12 },
  coverMeta:    { flexDirection: "row", gap: 6, flexWrap: "wrap" },
  metaBox:      { padding: "6 10", backgroundColor: LIGHT, borderWidth: 1, borderColor: BORDER, borderRadius: 4 },
  metaKey:      { fontSize: 6.5, color: MUTED, textTransform: "uppercase", letterSpacing: 1, marginBottom: 1 },
  metaVal:      { fontSize: 10, fontFamily: "Helvetica-Bold", color: BRAND },
  // section
  section:      { marginBottom: 14, breakInside: "avoid" },
  cardOuter:    { borderWidth: 1, borderColor: BORDER, borderRadius: 6, marginBottom: 12, overflow: "hidden" },
  cardHeader:   { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: "8 12", backgroundColor: LIGHT, borderBottomWidth: 1, borderBottomColor: BORDER },
  rankCircle:   { width: 20, height: 20, borderRadius: 10, backgroundColor: BRAND, justifyContent: "center", alignItems: "center", marginRight: 8 },
  rankText:     { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#ffffff" },
  nameBlock:    { flex: 1 },
  candidateName:{ fontSize: 11, fontFamily: "Helvetica-Bold", color: BRAND },
  candidateSub: { fontSize: 7.5, color: MUTED, marginTop: 1 },
  recBadge:     { fontSize: 7, fontFamily: "Helvetica-Bold", textTransform: "uppercase", letterSpacing: 0.8, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 3 },
  matchScore:   { fontSize: 18, fontFamily: "Helvetica-Bold", color: BRAND, textAlign: "right" },
  matchLabel:   { fontSize: 6, color: MUTED, textTransform: "uppercase", letterSpacing: 1, textAlign: "right" },
  // card body
  cardBody:     { padding: "8 12", flexDirection: "row", gap: 14 },
  colLeft:      { flex: 1 },
  colRight:     { flex: 1.2 },
  sectionLabel: { fontSize: 6.5, color: MUTED, textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 5, fontFamily: "Helvetica-Bold" },
  // score grid
  scoreGrid:    { flexDirection: "row", flexWrap: "wrap", gap: 4, marginBottom: 8 },
  scoreBox:     { width: "47%", padding: "4 6", backgroundColor: LIGHT, borderWidth: 1, borderColor: BORDER, borderRadius: 3 },
  scoreDim:     { fontSize: 6, color: MUTED, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 1 },
  scoreNum:     { fontSize: 13, fontFamily: "Helvetica-Bold" },
  confRow:      { flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: BORDER, paddingTop: 4, marginTop: 2 },
  confLabel:    { fontSize: 6.5, color: MUTED },
  confVal:      { fontSize: 6.5, fontFamily: "Helvetica-Bold" },
  // bullet list
  bulletItem:   { flexDirection: "row", alignItems: "flex-start", marginBottom: 3 },
  bulletDot:    { width: 4, height: 4, borderRadius: 2, marginTop: 2.5, marginRight: 5, flexShrink: 0 },
  bulletText:   { fontSize: 8, color: BRAND, flex: 1, lineHeight: 1.4 },
  // reasoning
  reasonBox:    { backgroundColor: LIGHT, borderWidth: 1, borderColor: BORDER, borderRadius: 3, padding: "6 8", marginTop: 4 },
  reasonText:   { fontSize: 7.5, color: "#374151", lineHeight: 1.5 },
  // footer
  footer:       { position: "absolute", bottom: 24, left: 40, right: 40, flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: BORDER, paddingTop: 6 },
  footerText:   { fontSize: 6.5, color: MUTED },
});

export type PDFCandidate = {
  applicantId: string;
  rank: number;
  candidateName?: string;
  candidateHeadline?: string;
  matchScore: number;
  recommendation: string;
  scoreBreakdown?: { skills: number; experience: number; education: number; relevance: number };
  strengths?: string[];
  gaps?: string[];
  reasoning?: string;
  confidence?: number;
};

type Props = {
  jobTitle: string;
  jobId?: string;
  runDate: string;
  status?: string;
  totalTopN?: number;
  candidates: PDFCandidate[];
};

function CandidateCard({ c, jobTitle, runDate }: { c: PDFCandidate; jobTitle: string; runDate: string }) {
  const rec = c.recommendation ?? "DECLINE";
  const conf = typeof c.confidence === "number" ? Math.round(c.confidence * 100) : null;
  const bd = c.scoreBreakdown;

  return (
    <View style={s.cardOuter}>
      {/* Header */}
      <View style={s.cardHeader}>
        <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
          <View style={s.rankCircle}>
            <Text style={s.rankText}>{c.rank}</Text>
          </View>
          <View style={s.nameBlock}>
            <Text style={s.candidateName}>{c.candidateName ?? `Candidate #${c.rank}`}</Text>
            {c.candidateHeadline ? <Text style={s.candidateSub}>{c.candidateHeadline}</Text> : null}
          </View>
        </View>
        <View style={{ alignItems: "flex-end", gap: 3 }}>
          <Text style={[s.recBadge, { color: recColor(rec), backgroundColor: "#fff", borderWidth: 1, borderColor: recColor(rec) }]}>
            {rec}
          </Text>
          <Text style={s.matchScore}>{c.matchScore}<Text style={{ fontSize: 9, fontFamily: "Helvetica", color: MUTED }}>%</Text></Text>
          <Text style={s.matchLabel}>match score</Text>
        </View>
      </View>

      {/* Body */}
      <View style={s.cardBody}>
        {/* Left: scores + strengths */}
        <View style={s.colLeft}>
          {bd && (
            <>
              <Text style={s.sectionLabel}>Score Breakdown</Text>
              <View style={s.scoreGrid}>
                {(["skills", "experience", "education", "relevance"] as const).map((key) => (
                  <View key={key} style={s.scoreBox}>
                    <Text style={s.scoreDim}>{key}</Text>
                    <Text style={[s.scoreNum, { color: bd[key] >= 70 ? GREEN : bd[key] >= 45 ? AMBER : RED }]}>{bd[key]}</Text>
                  </View>
                ))}
              </View>
              {conf !== null && (
                <View style={s.confRow}>
                  <Text style={s.confLabel}>AI confidence</Text>
                  <Text style={[s.confVal, { color: conf >= 70 ? GREEN : conf >= 50 ? AMBER : MUTED }]}>{conf}%</Text>
                </View>
              )}
            </>
          )}

          {(c.strengths ?? []).length > 0 && (
            <View style={{ marginTop: 8 }}>
              <Text style={s.sectionLabel}>Strengths</Text>
              {(c.strengths ?? []).map((str, i) => (
                <View key={i} style={s.bulletItem}>
                  <View style={[s.bulletDot, { backgroundColor: GREEN }]} />
                  <Text style={s.bulletText}>{str}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Right: gaps + reasoning */}
        <View style={s.colRight}>
          {(c.gaps ?? []).length > 0 && (
            <View style={{ marginBottom: 8 }}>
              <Text style={s.sectionLabel}>Key Gaps</Text>
              {(c.gaps ?? []).map((g, i) => (
                <View key={i} style={s.bulletItem}>
                  <View style={[s.bulletDot, { backgroundColor: AMBER }]} />
                  <Text style={s.bulletText}>{g}</Text>
                </View>
              ))}
            </View>
          )}

          {c.reasoning && (
            <>
              <Text style={s.sectionLabel}>AI Reasoning</Text>
              <View style={s.reasonBox}>
                <Text style={s.reasonText}>{c.reasoning}</Text>
              </View>
            </>
          )}
        </View>
      </View>
    </View>
  );
}

/** Full report — all candidates on sequential pages */
export function FullReportPDF({ jobTitle, jobId, runDate, status, totalTopN, candidates }: Props) {
  const shortlisted = candidates.filter((c) => c.recommendation === "SHORTLIST").length;
  const forReview   = candidates.filter((c) => c.recommendation === "CONSIDER").length;

  return (
    <Document title={`Screening Report — ${jobTitle}`} author="Umurava AI Platform">
      <Page size="A4" style={s.page}>
        {/* Cover */}
        <View style={s.coverRule}>
          <Text style={s.coverLabel}>Umurava · AI Screening Report</Text>
          <Text style={s.coverTitle}>{jobTitle}</Text>
          <Text style={s.coverSub}>AI-generated candidate ranking — recruiter review required before final decision.</Text>

          <View style={s.coverMeta}>
            {[
              { k: "Generated",     v: runDate },
              { k: "Run status",    v: status ?? "—" },
              { k: "Top shortlist", v: `Top ${totalTopN ?? "?"}` },
              { k: "Shortlisted",   v: String(shortlisted) },
              { k: "For review",    v: String(forReview) },
            ].map((m) => (
              <View key={m.k} style={s.metaBox}>
                <Text style={s.metaKey}>{m.k}</Text>
                <Text style={s.metaVal}>{m.v}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Candidate cards */}
        {candidates.map((c) => (
          <CandidateCard key={c.applicantId} c={c} jobTitle={jobTitle} runDate={runDate} />
        ))}

        {/* Footer */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>Umurava AI Screening Platform</Text>
          <Text style={s.footerText} render={({ pageNumber, totalPages }) => `Page ${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}

/** Single candidate report */
export function SingleCandidateReportPDF({ candidate, jobTitle, runDate }: { candidate: PDFCandidate; jobTitle: string; runDate: string }) {
  return (
    <Document title={`${candidate.candidateName ?? "Candidate"} — ${jobTitle}`} author="Umurava AI Platform">
      <Page size="A4" style={s.page}>
        <View style={s.coverRule}>
          <Text style={s.coverLabel}>Umurava · Candidate Report</Text>
          <Text style={s.coverTitle}>{candidate.candidateName ?? `Candidate #${candidate.rank}`}</Text>
          {candidate.candidateHeadline && <Text style={s.coverSub}>{candidate.candidateHeadline}</Text>}
          <View style={s.coverMeta}>
            <View style={s.metaBox}><Text style={s.metaKey}>Position</Text><Text style={s.metaVal}>{jobTitle}</Text></View>
            <View style={s.metaBox}><Text style={s.metaKey}>Generated</Text><Text style={s.metaVal}>{runDate}</Text></View>
            <View style={s.metaBox}><Text style={s.metaKey}>Rank</Text><Text style={s.metaVal}>#{candidate.rank}</Text></View>
            <View style={s.metaBox}><Text style={s.metaKey}>Match</Text><Text style={s.metaVal}>{candidate.matchScore}%</Text></View>
          </View>
        </View>
        <CandidateCard c={candidate} jobTitle={jobTitle} runDate={runDate} />
        <View style={s.footer} fixed>
          <Text style={s.footerText}>Umurava AI Screening Platform</Text>
          <Text style={s.footerText}>{runDate}</Text>
        </View>
      </Page>
    </Document>
  );
}
