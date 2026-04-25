export const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "/api";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      ...(init?.body && !(init.headers as any)?.["Content-Type"] ? { "content-type": "application/json" } : {})
    }
  });

  const text = await res.text();
  const json = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const message = json?.error?.message ?? json?.error ?? res.statusText;
    throw new Error(typeof message === "string" ? message : "Request failed");
  }

  return json as T;
}

export async function apiListJobs(): Promise<{ data: Array<{ id: string; title: string; status: string }> }> {
  return request("/jobs", { method: "GET" });
}

export async function apiCreateJob(payload: any): Promise<{ data: { id: string; createdAt: string } }> {
  return request("/jobs", { method: "POST", body: JSON.stringify(payload) });
}

export async function apiIngestUmuravaProfiles(jobId: string, profiles: any[]): Promise<any> {
  return request(`/jobs/${encodeURIComponent(jobId)}/applicants/profiles`, {
    method: "POST",
    body: JSON.stringify({ profiles })
  });
}

export async function apiIngestCsv(jobId: string, csvFile: File, mapping?: any): Promise<any> {
  const form = new FormData();
  form.append("file", csvFile);
  if (mapping) form.append("mapping", JSON.stringify(mapping));

  const url = `${API_BASE}/jobs/${encodeURIComponent(jobId)}/applicants/csv`;
  const res = await fetch(url, { method: "POST", body: form });
  const text = await res.text();
  const json = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const message = json?.error?.message ?? res.statusText;
    throw new Error(message);
  }
  return json;
}

export async function apiUploadResume(jobId: string, applicantId: string, pdfFile: File): Promise<any> {
  const form = new FormData();
  form.append("file", pdfFile);

  // Backend expects applicantId in req.body alongside multipart.
  form.append("applicantId", applicantId);

  const url = `${API_BASE}/jobs/${encodeURIComponent(jobId)}/applicants/resume`;
  const res = await fetch(url, { method: "POST", body: form });
  const text = await res.text();
  const json = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const message = json?.error?.message ?? res.statusText;
    throw new Error(message);
  }
  return json;
}

export async function apiTriggerScreening(jobId: string, topN?: number, applicantIds?: string[]): Promise<any> {
  return request(`/jobs/${encodeURIComponent(jobId)}/screen`, {
    method: "POST",
    body: JSON.stringify({ topN, applicantIds })
  });
}

export async function apiGetJobResults(jobId: string): Promise<any> {
  return request(`/jobs/${encodeURIComponent(jobId)}/results`, { method: "GET" });
}

export async function apiGetJobApplicants(jobId: string): Promise<any> {
  return request(`/jobs/${encodeURIComponent(jobId)}/applicants`, { method: "GET" });
}

export async function apiGetJob(jobId: string): Promise<{ data: any }> {
  return request(`/jobs/${encodeURIComponent(jobId)}`, { method: "GET" });
}

export async function apiUpdateJob(jobId: string, payload: any): Promise<{ data: { id: string; updatedAt: string } }> {
  return request(`/jobs/${encodeURIComponent(jobId)}`, { method: "PUT", body: JSON.stringify(payload) });
}


export async function apiGetParseStatus(jobId: string): Promise<any> {
  return request(`/jobs/${encodeURIComponent(jobId)}/applicants/parse-status`, { method: "GET" });
}
