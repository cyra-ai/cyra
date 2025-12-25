import { EventEmitter } from 'events';

export interface JobProgress {
	jobId: string;
	status: 'pending' | 'running' | 'completed' | 'failed';
	progress: number; // 0-100
	message: string;
	result?: unknown;
	error?: string;
	startTime: number;
	endTime?: number;
}

export interface Job {
	id: string;
	execute: () => Promise<unknown>;
	onProgress?: (progress: number, message: string) => void;
}

export class JobQueue extends EventEmitter {
	private jobs: Map<string, JobProgress> = new Map();
	private running: Map<string, boolean> = new Map();
	private static instance: JobQueue;

	private constructor() {
		super();
	};

	static getInstance(): JobQueue {
		if (!JobQueue.instance)
			JobQueue.instance = new JobQueue();
		return JobQueue.instance;
	};

	/**
	 * Submit a long-running job to the queue
	 */
	async submitJob(job: Job): Promise<string> {
		const jobProgress: JobProgress = {
			jobId: job.id,
			status: 'pending',
			progress: 0,
			message: 'Job queued',
			startTime: Date.now()
		};

		this.jobs.set(job.id, jobProgress);
		this.emit('job:submitted', jobProgress);

		// Execute immediately (non-blocking)
		this.executeJob(job).catch((err) => {
			console.error(`Job ${job.id} failed:`, err);
		});

		return job.id;
	};

	/**
	 * Execute a job asynchronously
	 */
	private async executeJob(job: Job): Promise<void> {
		const jobId = job.id;
		const jobProgress = this.jobs.get(jobId)!;

		try {
			jobProgress.status = 'running';
			jobProgress.message = 'Job started';
			this.emit('job:started', jobProgress);

			// Execute the job with progress callback
			const result = await job.execute();

			jobProgress.status = 'completed';
			jobProgress.progress = 100;
			jobProgress.message = 'Job completed successfully';
			jobProgress.result = result;
			jobProgress.endTime = Date.now();

			this.emit('job:completed', jobProgress);
		} catch (err) {
			jobProgress.status = 'failed';
			jobProgress.error = err instanceof Error ? err.message : String(err);
			jobProgress.message = 'Job failed';
			jobProgress.endTime = Date.now();

			this.emit('job:failed', jobProgress);
		} finally {
			this.running.delete(jobId);
		};
	};

	/**
	 * Get job progress
	 */
	getJobProgress(jobId: string): JobProgress | undefined {
		return this.jobs.get(jobId);
	};

	/**
	 * Get all jobs
	 */
	getAllJobs(): JobProgress[] {
		return Array.from(this.jobs.values());
	};

	/**
	 * Update job progress
	 */
	updateProgress(jobId: string, progress: number, message: string): void {
		const job = this.jobs.get(jobId);
		if (job) {
			job.progress = Math.min(100, Math.max(0, progress));
			job.message = message;
			this.emit('job:progress', job);
		};
	};

	/**
	 * Clear completed jobs
	 */
	clearCompleted(): void {
		for (const [id, job] of this.jobs.entries())
			if (job.status === 'completed' || job.status === 'failed')
				this.jobs.delete(id);
	};
};
