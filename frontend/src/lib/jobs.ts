import { apiClient } from "./api";

export interface BackgroundJob {
  job_id: string;
  type: string;
  status: "queued" | "running" | "completed" | "failed";
  progress: number;
  metadata?: Record<string, any>;
  result?: any;
  error?: string | null;
  created_at: string;
  updated_at: string;
}

export const jobsApi = {
  async getJobStatus(jobId: string): Promise<BackgroundJob> {
    return apiClient<BackgroundJob>(`/jobs/${jobId}`, {
      requiresTenant: true,
    });
  },

  async triggerCourierSync(): Promise<{ status: string; job_id: string; message: string }> {
    return apiClient<{ status: string; job_id: string; message: string }>(
      "/jobs/trigger/courier-sync",
      {
        method: "POST",
        requiresTenant: true,
      }
    );
  },

  async triggerAdsInsights(): Promise<{ status: string; job_id: string; message: string }> {
    return apiClient<{ status: string; job_id: string; message: string }>(
      "/jobs/trigger/ads-insights",
      {
        method: "POST",
        requiresTenant: true,
      }
    );
  },

  async triggerCogsBackfill(): Promise<{ status: string; job_id: string; message: string }> {
    return apiClient<{ status: string; job_id: string; message: string }>(
      "/jobs/trigger/cogs-backfill",
      {
        method: "POST",
        requiresTenant: true,
      }
    );
  },

  /**
   * Helper that polls job until complete or failed, with onProgress callback
   */
  async pollJobUntilDone(
    jobId: string,
    onProgress?: (job: BackgroundJob) => void,
    intervalMs: number = 1000,
    maxAttempts: number = 60
  ): Promise<BackgroundJob> {
    for (let i = 0; i < maxAttempts; i++) {
      const job = await this.getJobStatus(jobId);
      if (onProgress) onProgress(job);
      if (job.status === "completed" || job.status === "failed") {
        return job;
      }
      await new Promise((r) => setTimeout(r, intervalMs));
    }
    throw new Error("Job polling timed out.");
  },
};
