"use client";

import React, { useState } from "react";
import { PDFDownloadLink } from "@react-pdf/renderer";
import {
  FullReportPDF,
  SingleCandidateReportPDF,
  type PDFCandidate,
} from "./CandidateReportPDF";

type FullReportProps = {
  variant: "full";
  jobTitle: string;
  jobId?: string;
  runDate: string;
  status?: string;
  totalTopN?: number;
  candidates: PDFCandidate[];
  className?: string;
};

type SingleProps = {
  variant: "single";
  candidate: PDFCandidate;
  jobTitle: string;
  runDate: string;
  className?: string;
};

type Props = FullReportProps | SingleProps;

export default function PDFDownloadButton(props: Props) {
  const [clicked, setClicked] = useState(false);

  const filename =
    props.variant === "full"
      ? `screening-report-${props.jobId ?? "report"}.pdf`
      : `candidate-${props.candidate.rank}-${(props.candidate.candidateName ?? "report").toLowerCase().replace(/\s+/g, "-")}.pdf`;

  const doc =
    props.variant === "full" ? (
      <FullReportPDF
        jobTitle={props.jobTitle}
        jobId={props.jobId}
        runDate={props.runDate}
        status={props.status}
        totalTopN={props.totalTopN}
        candidates={props.candidates}
      />
    ) : (
      <SingleCandidateReportPDF
        candidate={props.candidate}
        jobTitle={props.jobTitle}
        runDate={props.runDate}
      />
    );

  const defaultClass =
    props.variant === "full"
      ? "inline-flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white text-sm font-semibold rounded-lg hover:bg-neutral-700 transition-colors"
      : "inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-neutral-200 text-neutral-600 text-xs font-medium rounded-lg hover:bg-neutral-50 transition-colors";

  return (
    <PDFDownloadLink document={doc} fileName={filename}>
      {({ loading, error }) =>
        error ? (
          <span className="text-red-500 text-xs">PDF error</span>
        ) : (
          <button
            type="button"
            disabled={loading}
            onClick={() => setClicked(true)}
            className={props.className ?? defaultClass}
          >
            {props.variant === "full" ? (
              <>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                {loading ? "Building PDF…" : "Download PDF"}
              </>
            ) : (
              <>
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                {loading ? "Building…" : "PDF"}
              </>
            )}
          </button>
        )
      }
    </PDFDownloadLink>
  );
}
