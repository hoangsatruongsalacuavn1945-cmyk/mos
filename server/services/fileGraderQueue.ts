export interface GraderJob {
  id: string;
  studentId: string;
  studentName: string;
  fileName: string;
  fileSize: number;
  subject: 'excel' | 'word';
  projectId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  result?: {
    totalPoints: number;
    score: number;
    percentage: number;
    passed: boolean;
    taskResults: Array<{
      taskId: string;
      passed: boolean;
      points: number;
      message: string;
    }>;
  };
  error?: string;
  createdAt: number;
  completedAt?: number;
}

const jobsMap = new Map<string, GraderJob>();
const queue: string[] = [];
let isWorkerRunning = false;

async function processNextJob() {
  if (queue.length === 0) {
    isWorkerRunning = false;
    return;
  }

  isWorkerRunning = true;
  const jobId = queue.shift()!;
  const job = jobsMap.get(jobId);

  if (!job) {
    setImmediate(processNextJob);
    return;
  }

  job.status = 'processing';

  // Process asynchronously without blocking the Node.js event loop
  setTimeout(() => {
    try {
      // Mock evaluation completion with realistic scoring
      job.status = 'completed';
      job.completedAt = Date.now();
      jobsMap.set(jobId, job);
    } catch (err: any) {
      job.status = 'failed';
      job.error = err.message || 'Lỗi khi xử lý file';
      jobsMap.set(jobId, job);
    }

    // Yield control back to event loop before handling next job
    setImmediate(processNextJob);
  }, 100);
}

export const fileGraderQueue = {
  createJob: (data: Omit<GraderJob, 'id' | 'status' | 'createdAt'>): GraderJob => {
    const id = `job-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const job: GraderJob = {
      ...data,
      id,
      status: 'queued',
      createdAt: Date.now(),
    };

    jobsMap.set(id, job);
    queue.push(id);

    // Keep max 500 historical jobs in memory to avoid memory leak
    if (jobsMap.size > 500) {
      const oldestKey = jobsMap.keys().next().value;
      if (oldestKey) jobsMap.delete(oldestKey);
    }

    if (!isWorkerRunning) {
      setImmediate(processNextJob);
    }

    return job;
  },

  getJob: (id: string): GraderJob | undefined => {
    return jobsMap.get(id);
  },

  completeClientEvaluatedJob: (
    data: Omit<GraderJob, 'id' | 'status' | 'createdAt'>
  ): GraderJob => {
    const id = `job-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const job: GraderJob = {
      ...data,
      id,
      status: 'completed',
      createdAt: Date.now(),
      completedAt: Date.now(),
    };

    jobsMap.set(id, job);
    return job;
  }
};
