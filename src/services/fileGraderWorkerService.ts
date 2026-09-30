import { WorkerGradingResult } from '../workers/fileGrader.worker';

export interface ProgressCallback {
  (status: { stage: string; progress: number; message: string }): void;
}

export async function gradeFileInWorker(
  file: File,
  projectId: string,
  onProgress?: ProgressCallback
): Promise<WorkerGradingResult> {
  const arrayBuffer = await file.arrayBuffer();

  return new Promise((resolve, reject) => {
    try {
      // Initialize Vite Web Worker
      const worker = new Worker(
        new URL('../workers/fileGrader.worker.ts', import.meta.url),
        { type: 'module' }
      );

      worker.onmessage = (e: MessageEvent) => {
        const data = e.data;
        if (data.type === 'STATUS' && onProgress) {
          onProgress({
            stage: data.stage,
            progress: data.progress,
            message: data.message,
          });
        } else if (data.type === 'RESULT') {
          worker.terminate();
          resolve(data.result);
        } else if (data.type === 'ERROR') {
          worker.terminate();
          reject(new Error(data.error));
        }
      };

      worker.onerror = (err) => {
        worker.terminate();
        reject(new Error(err.message || 'Lỗi trong Web Worker khi xử lý tệp.'));
      };

      // Post file buffer off the main thread (transferable buffer for optimal zero-copy performance)
      worker.postMessage({ fileBuffer: arrayBuffer, projectId }, [arrayBuffer]);
    } catch (err: any) {
      reject(err);
    }
  });
}
