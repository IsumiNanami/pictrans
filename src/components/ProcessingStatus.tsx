'use client';

import { Loader2, CheckCircle2, XCircle, Sparkles } from 'lucide-react';
import type { ProcessingState } from '@/types/jimeng';

interface ProcessingStatusProps {
  state: ProcessingState;
}

export function ProcessingStatus({ state }: ProcessingStatusProps) {
  const { status, progress, message } = state;

  if (status === 'idle') {
    return null;
  }

  return (
    <div className="w-full p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
      <div className="flex items-center gap-4">
        {/* 状态图标 */}
        <div className="flex-shrink-0">
          {(status === 'uploading' || status === 'processing') && (
            <div className="relative">
              <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
              <Sparkles className="absolute -top-1 -right-1 w-4 h-4 text-yellow-400 animate-pulse" />
            </div>
          )}
          {status === 'success' && (
            <CheckCircle2 className="w-10 h-10 text-green-500" />
          )}
          {status === 'error' && (
            <XCircle className="w-10 h-10 text-red-500" />
          )}
        </div>

        {/* 状态信息 */}
        <div className="flex-1 min-w-0">
          <p
            className={`font-medium ${
              status === 'error' ? 'text-red-600' : 'text-gray-800'
            }`}
          >
            {message}
          </p>

          {/* 进度条 */}
          {(status === 'uploading' || status === 'processing') && (
            <div className="mt-3">
              <div className="flex justify-between text-sm text-gray-500 mb-1">
                <span>处理进度</span>
                <span>{Math.min(progress, 99)}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${Math.min(progress, 99)}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 提示信息 */}
      {status === 'processing' && (
        <p className="mt-4 text-sm text-gray-500 text-center">
          AI 正在为您的图片施展魔法，请耐心等待...
        </p>
      )}
    </div>
  );
}
