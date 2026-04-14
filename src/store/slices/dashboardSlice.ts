"use client";

import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { apiCreateJob, apiGetJob, apiGetJobApplicants, apiGetJobResults, apiIngestCsv, apiIngestUmuravaProfiles, apiListJobs, apiTriggerScreening, apiUpdateJob, apiUploadResume } from "../../lib/api";

export type JobCreateState = {
  loading: boolean;
  error?: string;
  createdJobId?: string;
};

export type ScreeningState = {
  triggering: boolean;
  error?: string;
  lastScreeningResult?: any;
};

export type CandidatesResult = {
  screeningResultId: string;
  jobId: string;
  status: string;
  topN: number;
  shortlist: Array<any>;
  errors?: Array<{ stage: string; code: string; message: string }>;
};

export type JobUpdateState = {
  loading: boolean;
  error?: string;
  success: boolean;
};

export type DashboardState = {
  jobList: Array<{ id: string; title: string; status: string; createdAt?: string }>;
  selectedJobId?: string;
  currentJob?: any;
  jobCreate: JobCreateState;
  jobUpdate: JobUpdateState;
  screening: ScreeningState;
  results?: CandidatesResult;
  applicants?: any[];
  loading: boolean;
};

const initialState: DashboardState = {
  jobList: [],
  selectedJobId: undefined,
  currentJob: undefined,
  jobCreate: { loading: false, error: undefined, createdJobId: undefined },
  jobUpdate: { loading: false, error: undefined, success: false },
  screening: { triggering: false, error: undefined, lastScreeningResult: undefined },
  results: undefined,
  applicants: undefined,
  loading: false
};

export const thunkListJobs = createAsyncThunk("dashboard/listJobs", async () => {
  return (await apiListJobs()).data;
});

export const thunkCreateJob = createAsyncThunk("dashboard/createJob", async (payload: any) => {
  const res = await apiCreateJob(payload);
  return res.data;
});

export const thunkIngestUmuravaProfiles = createAsyncThunk(
  "dashboard/ingestUmuravaProfiles",
  async (args: { jobId: string; profiles: any[] }) => {
    return apiIngestUmuravaProfiles(args.jobId, args.profiles);
  }
);

export const thunkIngestCsv = createAsyncThunk("dashboard/ingestCsv", async (args: { jobId: string; csvFile: File; mapping?: any }) => {
  return apiIngestCsv(args.jobId, args.csvFile, args.mapping);
});

export const thunkUploadResume = createAsyncThunk(
  "dashboard/uploadResume",
  async (args: { jobId: string; applicantId: string; pdfFile: File }) => {
    return apiUploadResume(args.jobId, args.applicantId, args.pdfFile);
  }
);

export const thunkTriggerScreening = createAsyncThunk(
  "dashboard/triggerScreening",
  async (args: { jobId: string; topN?: number }) => {
    return apiTriggerScreening(args.jobId, args.topN);
  }
);

export const thunkFetchResults = createAsyncThunk("dashboard/fetchResults", async (jobId: string) => {
  return (await apiGetJobResults(jobId)).data as CandidatesResult;
});

export const thunkFetchApplicants = createAsyncThunk("dashboard/fetchApplicants", async (jobId: string) => {
  return (await apiGetJobApplicants(jobId)).data as any[];
});

export const thunkFetchJob = createAsyncThunk("dashboard/fetchJob", async (jobId: string) => {
  return (await apiGetJob(jobId)).data;
});

export const thunkUpdateJob = createAsyncThunk(
  "dashboard/updateJob",
  async (args: { jobId: string; payload: any }) => {
    return (await apiUpdateJob(args.jobId, args.payload)).data;
  }
);

const slice = createSlice({
  name: "dashboard",
  initialState,
  reducers: {
    selectJob(state, action) {
      state.selectedJobId = action.payload;
    },
    clearResults(state) {
      state.results = undefined;
      state.screening.lastScreeningResult = undefined;
    },
    resetJobUpdate(state) {
      state.jobUpdate = { loading: false, error: undefined, success: false };
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(thunkListJobs.fulfilled, (state, action) => {
        state.jobList = action.payload;
      })
      .addCase(thunkCreateJob.pending, (state) => {
        state.jobCreate = { loading: true };
      })
      .addCase(thunkCreateJob.fulfilled, (state, action) => {
        state.jobCreate = { loading: false, createdJobId: action.payload.id };
        state.selectedJobId = action.payload.id;
      })
      .addCase(thunkCreateJob.rejected, (state, action) => {
        state.jobCreate = { loading: false, error: action.error.message };
      })
      .addCase(thunkFetchResults.pending, (state) => {
        state.loading = true;
      })
      .addCase(thunkFetchResults.fulfilled, (state, action) => {
        state.loading = false;
        state.results = action.payload;
      })
      .addCase(thunkFetchResults.rejected, (state) => {
        state.loading = false;
      })
      .addCase(thunkFetchApplicants.fulfilled, (state, action) => {
        state.applicants = action.payload;
      })
      .addCase(thunkTriggerScreening.pending, (state) => {
        state.screening.triggering = true;
        state.screening.error = undefined;
      })
      .addCase(thunkTriggerScreening.fulfilled, (state, action) => {
        state.screening.triggering = false;
        state.screening.lastScreeningResult = action.payload.data;
      })
      .addCase(thunkTriggerScreening.rejected, (state, action) => {
        state.screening.triggering = false;
        state.screening.error = action.error.message;
      })
      .addCase(thunkFetchJob.fulfilled, (state, action) => {
        state.currentJob = action.payload;
      })
      .addCase(thunkUpdateJob.pending, (state) => {
        state.jobUpdate = { loading: true, error: undefined, success: false };
      })
      .addCase(thunkUpdateJob.fulfilled, (state) => {
        state.jobUpdate = { loading: false, error: undefined, success: true };
      })
      .addCase(thunkUpdateJob.rejected, (state, action) => {
        state.jobUpdate = { loading: false, error: action.error.message, success: false };
      });
  }
});

export const { selectJob, clearResults, resetJobUpdate } = slice.actions;
export default slice.reducer;

