import React from "react";
import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
} from "@react-pdf/renderer";

const BRAND = "#0F1621";
const ACCENT = "#2B71F0";
const MUTED  = "#64748B";
const BORDER = "#E2E8F0";
const LIGHT_BG = "#F8FAFC";
const SUCCESS = "#10B981";
const WARNING = "#F59E0B";
const DANGER  = "#EF4444";

const recColor = (r: string) =>
  r === "SHORTLIST" ? SUCCESS : r === "CONSIDER" ? WARNING : DANGER;

const s = StyleSheet.create({
  page: { 
    padding: 50, 
    fontSize: 10, 
    fontFamily: "Helvetica", 
    color: BRAND, 
    backgroundColor: "#FFFFFF" 
  },
  
  // Executive Header
  header: {
    marginBottom: 40,
    borderBottom: 1,
    borderBottomColor: BORDER,
    paddingBottom: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end"
  },
  logoSection: {
    flexDirection: "column",
    gap: 4
  },
  logoText: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    letterSpacing: -0.5
  },
  reportTag: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: ACCENT,
    textTransform: "uppercase",
    letterSpacing: 2
  },
  
  // Cover / Hero
  titleSection: {
    marginBottom: 40,
    gap: 8
  },
  docTitle: {
    fontSize: 28,
    fontFamily: "Helvetica-Bold",
    letterSpacing: -1,
    color: BRAND
  },
  docSub: {
    fontSize: 12,
    color: MUTED,
    lineHeight: 1.5,
    maxWidth: "80%"
  },
  
  // Meta Grid
  metaGrid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 50
  },
  metaItem: {
    flex: 1,
    backgroundColor: LIGHT_BG,
    padding: 12,
    borderRadius: 8,
    border: 1,
    borderColor: BORDER
  },
  metaLabel: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: MUTED,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4
  },
  metaValue: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: BRAND
  },

  // Candidate Record
  record: {
    marginBottom: 30,
    padding: 20,
    borderRadius: 12,
    border: 1,
    borderColor: BORDER,
    breakInside: "avoid"
  },
  recordHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
    borderBottom: 1,
    borderBottomColor: LIGHT_BG,
    paddingBottom: 15
  },
  rankBadge: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: MUTED,
    marginRight: 12
  },
  nameArea: {
    flex: 1
  },
  candName: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: BRAND,
    marginBottom: 2
  },
  candHeadline: {
    fontSize: 9,
    color: MUTED,
    fontFamily: "Helvetica-Oblique"
  },
  scoreArea: {
    alignItems: "flex-end"
  },
  scoreCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    border: 3,
    borderColor: ACCENT,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4
  },
  scoreNum: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: ACCENT
  },
  recText: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 1,
    padding: "2 6",
    borderRadius: 4
  },

  // Content Columns
  contentGrid: {
    flexDirection: "row",
    gap: 24
  },
  contentCol: {
    flex: 1
  },
  sectionTitle: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: BRAND,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: 10,
    borderLeft: 3,
    borderLeftColor: ACCENT,
    paddingLeft: 8
  },
  
  // Analysis Box
  analysisBox: {
    backgroundColor: LIGHT_BG,
    padding: 12,
    borderRadius: 8,
    marginBottom: 15
  },
  analysisText: {
    fontSize: 9,
    lineHeight: 1.6,
    color: "#334155",
    fontFamily: "Helvetica-Oblique"
  },

  // Attribute List
  attrList: {
    gap: 6
  },
  attrItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
    borderBottom: 1,
    borderBottomColor: LIGHT_BG
  },
  attrLabel: {
    fontSize: 8,
    color: MUTED
  },
  attrVal: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: BRAND
  },

  // Bullets
  bullet: {
    flexDirection: "row",
    marginBottom: 5,
    paddingLeft: 4
  },
  bulletDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: MUTED,
    marginTop: 4,
    marginRight: 8
  },
  bulletText: {
    fontSize: 8.5,
    lineHeight: 1.4,
    color: "#475569",
    flex: 1
  },

  // Footer
  footer: {
    position: "absolute",
    bottom: 30,
    left: 50,
    right: 50,
    borderTop: 1,
    borderTopColor: BORDER,
    paddingTop: 10,
    flexDirection: "row",
    justifyContent: "space-between"
  },
  footerText: {
    fontSize: 7,
    color: MUTED,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 1
  }
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

function CandidateRecord({ c }: { c: PDFCandidate }) {
  const rec = c.recommendation ?? "DECLINE";
  const bd = c.scoreBreakdown;

  return (
    <View style={s.record}>
      <View style={s.recordHeader}>
        <Text style={s.rankBadge}>#{c.rank}</Text>
        <View style={s.nameArea}>
          <Text style={s.candName}>{getDisplayName(c)}</Text>
          <Text style={s.candHeadline}>{c.candidateHeadline || "Visionary Talent"}</Text>
        </View>
        <View style={s.scoreArea}>
          <View style={s.scoreCircle}>
             <Text style={s.scoreNum}>{c.matchScore}%</Text>
          </View>
          <Text style={[s.recText, { backgroundColor: recColor(rec) + "15", color: recColor(rec) }]}>{rec}</Text>
        </View>
      </View>

      <View style={s.contentGrid}>
        <View style={s.contentCol}>
          <Text style={s.sectionTitle}>AI Synthesis</Text>
          <View style={s.analysisBox}>
            <Text style={s.analysisText}>"{c.reasoning}"</Text>
          </View>
          
          <Text style={s.sectionTitle}>Attribute Matrix</Text>
          <View style={s.attrList}>
            {bd && Object.entries(bd).map(([key, val]) => (
              <View key={key} style={s.attrItem}>
                <Text style={s.attrLabel}>{key.toUpperCase()}</Text>
                <Text style={s.attrVal}>{val}%</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={s.contentCol}>
          <Text style={s.sectionTitle}>Key Strengths</Text>
          <View style={{ marginBottom: 15 }}>
            {(c.strengths || []).slice(0, 4).map((str, i) => (
              <View key={i} style={s.bullet}>
                <View style={[s.bulletDot, { backgroundColor: SUCCESS }]} />
                <Text style={s.bulletText}>{str}</Text>
              </View>
            ))}
          </View>

          <Text style={s.sectionTitle}>Identified Gaps</Text>
          <View>
            {(c.gaps || []).slice(0, 3).map((g, i) => (
              <View key={i} style={s.bullet}>
                <View style={[s.bulletDot, { backgroundColor: WARNING }]} />
                <Text style={s.bulletText}>{g}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}

export function FullReportPDF({ jobTitle, runDate, status, totalTopN, candidates }: Props) {
  return (
    <Document title={`Executive Report — ${jobTitle}`} author="Umurava Intelligence Engine">
      <Page size="A4" style={s.page}>
        {/* Cover Page Header */}
        <View style={s.header}>
          <View style={s.logoSection}>
            <Text style={s.reportTag}>Intelligence Briefing</Text>
            <Text style={s.logoText}>Umurava.</Text>
          </View>
          <Text style={[s.footerText, { borderBottom: 2, borderBottomColor: ACCENT, paddingBottom: 2 }]}>Confidential</Text>
        </View>

        {/* Title Area */}
        <View style={s.titleSection}>
          <Text style={s.docTitle}>{jobTitle}</Text>
          <Text style={s.docSub}>
            Automated evaluation and ranking of candidates based on technical proficiency, career history, and strategic role alignment.
          </Text>
        </View>

        {/* Executive Meta */}
        <View style={s.metaGrid}>
          <View style={s.metaItem}>
            <Text style={s.metaLabel}>Date Generated</Text>
            <Text style={s.metaValue}>{runDate}</Text>
          </View>
          <View style={s.metaItem}>
            <Text style={s.metaLabel}>Shortlist Size</Text>
            <Text style={s.metaValue}>Top {totalTopN || 10}</Text>
          </View>
          <View style={s.metaItem}>
            <Text style={s.metaLabel}>Total Pool</Text>
            <Text style={s.metaValue}>{candidates.length} Profiles</Text>
          </View>
          <View style={s.metaItem}>
            <Text style={s.metaLabel}>Engine</Text>
            <Text style={s.metaValue}>Gemini 1.5</Text>
          </View>
        </View>

        {/* Records */}
        {candidates.map((c) => (
          <CandidateRecord key={c.applicantId} c={c} />
        ))}

        {/* Fixed Footer */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>Umurava Intelligence Engine</Text>
          <Text style={s.footerText} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}

export function SingleCandidateReportPDF({ candidate, jobTitle, runDate }: { candidate: PDFCandidate; jobTitle: string; runDate: string }) {
  return (
    <Document title={`Candidate Dossier — ${candidate.candidateName}`} author="Umurava Intelligence Engine">
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <View style={s.logoSection}>
            <Text style={s.reportTag}>Candidate Dossier</Text>
            <Text style={s.logoText}>Umurava.</Text>
          </View>
          <Text style={[s.footerText, { borderBottom: 2, borderBottomColor: ACCENT, paddingBottom: 2 }]}>Internal Use Only</Text>
        </View>

        <View style={s.titleSection}>
          <Text style={s.docTitle}>{getDisplayName(candidate)}</Text>
          <Text style={s.docSub}>Executive summary for the {jobTitle} campaign.</Text>
        </View>

        <CandidateRecord c={candidate} />

        <View style={s.footer} fixed>
          <Text style={s.footerText}>Generated {runDate}</Text>
          <Text style={s.footerText}>Umurava Platform</Text>
        </View>
      </Page>
    </Document>
  );
}
