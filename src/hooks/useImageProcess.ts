'use client';

import { useMutation } from '@tanstack/react-query';
import { useState, useCallback, useRef } from 'react';
import axios from 'axios';
import type {
  ProcessingState,
  StyleType,
  UploadResponse,
  SubmitTaskResponse,
  TaskStatusResponse,
} from '@/types/jimeng';

const POLLING_INTERVAL = 2000; // 2秒轮询一次
const POLLING_TIMEOUT = 120000; // 2分钟超时

export function useImageProcess() {
  const [state, setState] = useState<ProcessingState>({
    status: 'idle',
    progress: 0,
    message: '',
  });

  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // 清理轮询
  const clearPolling = useCallback(() => {
    if (pollingRef.current) {
      clearTimeout(pollingRef.current);
      pollingRef.current = null;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  // 重置状态
  const reset = useCallback(() => {
    clearPolling();
    setState({
      status: 'idle',
      progress: 0,
      message: '',
    });
  }, [clearPolling]);

  // 轮询任务状态
  const pollTaskStatus = useCallback(
    async (taskId: string, startTime: number): Promise<string> => {
      return new Promise((resolve, reject) => {
        const poll = async () => {
          // 检查超时
          if (Date.now() - startTime > POLLING_TIMEOUT) {
            reject(new Error('处理超时，请重试'));
            return;
          }

          try {
            const response = await axios.get<TaskStatusResponse>(
              `/api/jimeng/status/${taskId}`
            );

            const { status, progress, result_url, error_message } = response.data.data;

            if (status === 'success' && result_url) {
              setState((prev) => ({
                ...prev,
                status: 'success',
                progress: 100,
                message: '处理完成！',
                resultUrl: result_url,
              }));
              resolve(result_url);
              return;
            }

            if (status === 'failed') {
              reject(new Error(error_message || '处理失败'));
              return;
            }

            // 更新进度
            setState((prev) => ({
              ...prev,
              progress: progress || prev.progress + 5,
              message: status === 'processing' ? 'AI 正在创作中...' : '排队等待中...',
            }));

            // 继续轮询
            pollingRef.current = setTimeout(poll, POLLING_INTERVAL);
          } catch (error) {
            reject(error);
          }
        };

        poll();
      });
    },
    []
  );

  // 主处理流程
  const processMutation = useMutation({
    mutationFn: async ({
      file,
      style,
      prompt,
      strength,
    }: {
      file: File;
      style: StyleType;
      prompt?: string;
      strength?: number;
    }) => {
      abortControllerRef.current = new AbortController();

      // Step 1: 上传图片
      setState({
        status: 'uploading',
        progress: 10,
        message: '正在上传图片...',
        originalUrl: URL.createObjectURL(file),
      });

      const formData = new FormData();
      formData.append('file', file);

      const uploadResponse = await axios.post<UploadResponse>(
        '/api/jimeng/upload',
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          signal: abortControllerRef.current.signal,
        }
      );

      if (uploadResponse.data.code !== 0) {
        throw new Error(uploadResponse.data.message);
      }

      const fileId = uploadResponse.data.data.file_id;

      // Step 2: 提交任务
      setState((prev) => ({
        ...prev,
        status: 'processing',
        progress: 30,
        message: '正在提交处理任务...',
      }));

      const submitResponse = await axios.post<SubmitTaskResponse>(
        '/api/jimeng/submit',
        {
          file_id: fileId,
          style,
          prompt,
          strength,
        },
        { signal: abortControllerRef.current.signal }
      );

      if (submitResponse.data.code !== 0) {
        throw new Error(submitResponse.data.message);
      }

      const taskId = submitResponse.data.data.task_id;

      // Step 3: 轮询状态
      setState((prev) => ({
        ...prev,
        progress: 40,
        message: 'AI 正在创作中...',
      }));

      const resultUrl = await pollTaskStatus(taskId, Date.now());
      return resultUrl;
    },
    onError: (error) => {
      clearPolling();
      const message = error instanceof Error ? error.message : '处理失败，请重试';
      setState((prev) => ({
        ...prev,
        status: 'error',
        message,
        error: message,
      }));
    },
  });

  return {
    state,
    process: processMutation.mutate,
    isProcessing: processMutation.isPending,
    reset,
    cancel: clearPolling,
  };
}
