"use client";

import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  apiCreateJob, apiGetJob, apiGetJobApplicants, apiGetJobResults,
  apiIngestCsv, apiIngestUmuravaProfiles, apiIngestZip, apiListJobs,
  apiTriggerScreening, apiUpdateJob, apiUploadResume,
  apiLogin, apiRegister, apiLogout, apiGetMe,
  apiGetDashboardStats, apiGetRecentJobs, apiGetRecentActivity,
  apiGetAccountProfile, apiUpdateAccountProfile, apiUpdateAccountPassword,
  apiGetAccountSessions, apiRevokeSession, apiRevokeAllOtherSessions,
  apiListJobResults, apiDeleteJob, apiBulkUploadResumes,
  handleApiError
} from "../../lib/api";

export type AuthState = {
  user: any | null;
  accessToken: string | null;
  loading: boolean;
  error: string | null;
};

export type DashboardStats = {
  totalJobs: number;
  activeJobs: number;
  totalCandidates: number;
  screeningRuns: number;
  avgMatchScore: number;
  thisWeekJobs: number;
};

export type DashboardState = {
  auth: AuthState;
  stats: DashboardStats | null;
  recentJobs: any[];
  activity: any[];
  jobList: Array<{ id: string; title: string; status: string; createdAt?: string }>;
  selectedJobId?: string;
  currentJob?: any;
  jobCreate: { loading: boolean; error?: string; createdJobId?: string };
  jobUpdate: { loading: boolean; error?: string; success: boolean };
  screening: { triggering: boolean; error?: string; lastScreeningResult?: any };
  results?: any;
  applicants?: any[];
  sessions: any[];
  loading: boolean;
};

const initialState: DashboardState = {
  auth: { user: null, accessToken: null, loading: false, error: null },
  stats: null,
  recentJobs: [],
  activity: [],
  jobList: [],
  selectedJobId: undefined,
  currentJob: undefined,
  jobCreate: { loading: false, error: undefined, createdJobId: undefined },
  jobUpdate: { loading: false, error: undefined, success: false },
  screening: { triggering: false, error: undefined, lastScreeningResult: undefined },
  results: undefined,
  applicants: undefined,
  sessions: [],
  loading: false
};

// --- Auth Thunks ---
export const thunkLogin = createAsyncThunk("auth/login", async (credentials: any, { rejectWithValue }) => {
  try {
    const res = await apiLogin(credentials);
    return res.data;
  } catch (err) {
    return rejectWithValue(handleApiError(err));
  }
});

export const thunkRegister = createAsyncThunk("auth/register", async (userData: any, { rejectWithValue }) => {
  try {
    const res = await apiRegister(userData);
    return res.data;
  } catch (err) {
    return rejectWithValue(handleApiError(err));
  }
});

export const thunkLogout = createAsyncThunk("auth/logout", async (_, { rejectWithValue }) => {
  try {
    await apiLogout();
  } catch (err) {
    return rejectWithValue(handleApiError(err));
  }
});

export const thunkFetchMe = createAsyncThunk("auth/me", async (_, { rejectWithValue }) => {
  try {
    const res = await apiGetMe();
    return res.data;
  } catch (err) {
    return rejectWithValue(handleApiError(err));
  }
});

// --- Dashboard Thunks ---
export const thunkFetchDashboardStats = createAsyncThunk("dashboard/fetchStats", async (_, { rejectWithValue }) => {
  try {
    const res = await apiGetDashboardStats();
    return res.data;
  } catch (err) {
    return rejectWithValue(handleApiError(err));
  }
});

export const thunkFetchRecentJobs = createAsyncThunk("dashboard/fetchRecentJobs", async (_, { rejectWithValue }) => {
  try {
    const res = await apiGetRecentJobs();
    return res.data;
  } catch (err) {
    return rejectWithValue(handleApiError(err));
  }
});

export const thunkFetchActivity = createAsyncThunk("dashboard/fetchActivity", async (_, { rejectWithValue }) => {
  try {
    const res = await apiGetRecentActivity();
    return res.data;
  } catch (err) {
    return rejectWithValue(handleApiError(err));
  }
});

// --- Account Thunks ---
export const thunkFetchAccountProfile = createAsyncThunk("account/fetchProfile", async (_, { rejectWithValue }) => {
  try {
    const res = await apiGetAccountProfile();
    return res.data;
  } catch (err) {
    return rejectWithValue(handleApiError(err));
  }
});

export const thunkUpdateAccountProfile = createAsyncThunk("account/updateProfile", async (payload: any, { rejectWithValue }) => {
  try {
    const res = await apiUpdateAccountProfile(payload);
    return res.data;
  } catch (err) {
    return rejectWithValue(handleApiError(err));
  }
});

export const thunkUpdateAccountPassword = createAsyncThunk("account/updatePassword", async (payload: any, { rejectWithValue }) => {
  try {
    const res = await apiUpdateAccountPassword(payload);
    return res.data;
  } catch (err) {
    return rejectWithValue(handleApiError(err));
  }
});

export const thunkFetchAccountSessions = createAsyncThunk("account/fetchSessions", async (_, { rejectWithValue }) => {
  try {
    const res = await apiGetAccountSessions();
    return res.data;
  } catch (err) {
    return rejectWithValue(handleApiError(err));
  }
});

export const thunkRevokeSession = createAsyncThunk("account/revokeSession", async (sessionId: string, { rejectWithValue }) => {
  try {
    await apiRevokeSession(sessionId);
    return sessionId;
  } catch (err) {
    return rejectWithValue(handleApiError(err));
  }
});

export const thunkRevokeAllOtherSessions = createAsyncThunk("account/revokeAllOther", async (_, { rejectWithValue }) => {
  try {
    await apiRevokeAllOtherSessions();
  } catch (err) {
    return rejectWithValue(handleApiError(err));
  }
});

// --- Existing Thunks ---
export const thunkListJobs = createAsyncThunk("dashboard/listJobs", async (_, { rejectWithValue }) => {
  try {
    return (await apiListJobs()).data;
  } catch (err) {
    return rejectWithValue(handleApiError(err));
  }
});

export const thunkCreateJob = createAsyncThunk("dashboard/createJob", async (payload: any, { rejectWithValue }) => {
  try {
    const res = await apiCreateJob(payload);
    return res.data;
  } catch (err) {
    return rejectWithValue(handleApiError(err));
  }
});

export const thunkIngestUmuravaProfiles = createAsyncThunk(
  "dashboard/ingestUmuravaProfiles",
  async (args: { jobId: string; profiles: any[] }, { rejectWithValue }) => {
    try {
      return apiIngestUmuravaProfiles(args.jobId, args.profiles);
    } catch (err) {
      return rejectWithValue(handleApiError(err));
    }
  }
);

export const thunkIngestCsv = createAsyncThunk("dashboard/ingestCsv", async (args: { jobId: string; csvFile: File; mapping?: any }, { rejectWithValue }) => {
  try {
    return apiIngestCsv(args.jobId, args.csvFile, args.mapping);
  } catch (err) {
    return rejectWithValue(handleApiError(err));
  }
});

export const thunkIngestZip = createAsyncThunk("dashboard/ingestZip", async (args: { jobId: string; zipFile: File }, { rejectWithValue }) => {
  try {
    return apiIngestZip(args.jobId, args.zipFile);
  } catch (err) {
    return rejectWithValue(handleApiError(err));
  }
});

export const thunkBulkUploadResumes = createAsyncThunk("dashboard/bulkUploadResumes", async (args: { jobId: string; files: File[] }, { rejectWithValue }) => {
  try {
    return apiBulkUploadResumes(args.jobId, args.files);
  } catch (err) {
    return rejectWithValue(handleApiError(err));
  }
});

export const thunkUploadResume = createAsyncThunk(
  "dashboard/uploadResume",
  async (args: { jobId: string; applicantId: string; pdfFile: File }, { rejectWithValue }) => {
    try {
      return apiUploadResume(args.jobId, args.applicantId, args.pdfFile);
    } catch (err) {
      return rejectWithValue(handleApiError(err));
    }
  }
);

export const thunkTriggerScreening = createAsyncThunk(
  "dashboard/triggerScreening",
  async (args: { jobId: string; topN?: number; applicantIds?: string[] }, { rejectWithValue }) => {
    try {
      return apiTriggerScreening(args.jobId, args.topN, args.applicantIds);
    } catch (err) {
      return rejectWithValue(handleApiError(err));
    }
  }
);

export const thunkFetchResults = createAsyncThunk("dashboard/fetchResults", async (jobId: string, { rejectWithValue }) => {
  try {
    return (await apiGetJobResults(jobId)).data;
  } catch (err) {
    return rejectWithValue(handleApiError(err));
  }
});

export const thunkFetchApplicants = createAsyncThunk("dashboard/fetchApplicants", async (jobId: string, { rejectWithValue }) => {
  try {
    return (await apiGetJobApplicants(jobId)).data as any[];
  } catch (err) {
    return rejectWithValue(handleApiError(err));
  }
});

export const thunkFetchJob = createAsyncThunk("dashboard/fetchJob", async (jobId: string, { rejectWithValue }) => {
  try {
    return (await apiGetJob(jobId)).data;
  } catch (err) {
    return rejectWithValue(handleApiError(err));
  }
});

export const thunkUpdateJob = createAsyncThunk(
  "dashboard/updateJob",
  async (args: { jobId: string; payload: any }, { rejectWithValue }) => {
    try {
      return (await apiUpdateJob(args.jobId, args.payload)).data;
    } catch (err) {
      return rejectWithValue(handleApiError(err));
    }
  }
);

export const thunkDeleteJob = createAsyncThunk("dashboard/deleteJob", async (jobId: string, { rejectWithValue }) => {
  try {
    await apiDeleteJob(jobId);
    return jobId;
  } catch (err) {
    return rejectWithValue(handleApiError(err));
  }
});

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
    },
    setAccessToken(state, action) {
      state.auth.accessToken = action.payload;
    },
    clearAuth(state) {
      state.auth = { user: null, accessToken: null, loading: false, error: null };
    }
  },
  extraReducers: (builder) => {
    builder
      // --- Auth ---
      .addCase(thunkLogin.pending, (state) => { state.auth.loading = true; state.auth.error = null; })
      .addCase(thunkLogin.fulfilled, (state, action) => {
        state.auth.loading = false;
        state.auth.user = action.payload.user;
        state.auth.accessToken = action.payload.accessToken;
      })
      .addCase(thunkLogin.rejected, (state, action) => { 
        state.auth.loading = false; 
        state.auth.error = (action.payload as string) || action.error.message || "Authentication failed"; 
      })
      .addCase(thunkRegister.pending, (state) => { state.auth.loading = true; state.auth.error = null; })
      .addCase(thunkRegister.fulfilled, (state, action) => {
        state.auth.loading = false;
        state.auth.user = action.payload.user;
        state.auth.accessToken = action.payload.accessToken;
      })
      .addCase(thunkRegister.rejected, (state, action) => { 
        state.auth.loading = false; 
        state.auth.error = (action.payload as string) || action.error.message || "Registration failed"; 
      })
      .addCase(thunkFetchMe.fulfilled, (state, action) => { state.auth.user = action.payload; })
      .addCase(thunkLogout.fulfilled, (state) => {
        state.auth = { user: null, accessToken: null, loading: false, error: null };
      })

      // --- Dashboard ---
      .addCase(thunkFetchDashboardStats.fulfilled, (state, action) => { state.stats = action.payload; })
      .addCase(thunkFetchRecentJobs.fulfilled, (state, action) => { state.recentJobs = action.payload; })
      .addCase(thunkFetchActivity.fulfilled, (state, action) => { state.activity = action.payload; })

      // --- Account ---
      .addCase(thunkFetchAccountProfile.fulfilled, (state, action) => { state.auth.user = action.payload; })
      .addCase(thunkUpdateAccountProfile.fulfilled, (state, action) => {
        if (!action.payload.requiresReauth) state.auth.user = { ...state.auth.user, ...action.payload.user };
      })
      .addCase(thunkFetchAccountSessions.fulfilled, (state, action) => { state.sessions = action.payload; })
      .addCase(thunkRevokeSession.fulfilled, (state, action) => {
        state.sessions = state.sessions.filter(s => s.sessionId !== action.payload);
      })
      .addCase(thunkRevokeAllOtherSessions.fulfilled, (state) => {
        state.sessions = state.sessions.filter(s => s.isCurrent);
      })

      // --- Jobs ---
      .addCase(thunkListJobs.fulfilled, (state, action) => { state.jobList = action.payload; })
      .addCase(thunkCreateJob.pending, (state) => { state.jobCreate.loading = true; state.jobCreate.error = undefined; })
      .addCase(thunkCreateJob.fulfilled, (state, action) => {
        state.jobCreate = { loading: false, createdJobId: action.payload.id };
        state.selectedJobId = action.payload.id;
      })
      .addCase(thunkCreateJob.rejected, (state, action) => {
        state.jobCreate.loading = false;
        state.jobCreate.error = (action.payload as string) || "Failed to create campaign";
      })
      .addCase(thunkFetchResults.fulfilled, (state, action) => {
        state.results = action.payload;
      })
      .addCase(thunkFetchApplicants.fulfilled, (state, action) => {
        state.applicants = action.payload;
      })
      .addCase(thunkFetchJob.fulfilled, (state, action) => {
        state.currentJob = action.payload;
      })
      .addCase(thunkTriggerScreening.pending, (state) => { state.screening.triggering = true; state.screening.error = undefined; })
      .addCase(thunkTriggerScreening.fulfilled, (state, action) => {
        state.screening.triggering = false;
        state.screening.lastScreeningResult = action.payload.data;
      })
      .addCase(thunkTriggerScreening.rejected, (state, action) => {
        state.screening.triggering = false;
        state.screening.error = (action.payload as string) || "Screening failed to start";
      })
      .addCase(thunkDeleteJob.fulfilled, (state, action) => {
        state.jobList = state.jobList.filter(j => j.id !== action.payload);
      });
  }
});

export const { selectJob, clearResults, resetJobUpdate, setAccessToken, clearAuth } = slice.actions;
export default slice.reducer;
