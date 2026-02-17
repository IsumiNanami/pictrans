'use client';

import { useState } from 'react';
import { Download, ZoomIn, AlertTriangle, Check } from 'lucide-react';

interface ImageComparisonProps {
  originalUrl: string;
  resultUrl: string;
}

export function ImageComparison({ originalUrl, resultUrl }: ImageComparisonProps) {
  const [downloaded, setDownloaded] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    try {
      setDownloading(true);
      const response = await fetch(resultUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ai-art-${Date.now()}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setDownloaded(true);
    } catch (error) {
      console.error('Download failed:', error);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 保存提示 */}
      {!downloaded && (
        <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
          <p className="text-amber-700 text-sm">
            图片链接 24 小时后失效，请及时保存效果图
          </p>
        </div>
      )}

      {downloaded && (
        <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
          <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
          <p className="text-green-700 text-sm">
            图片已保存到本地
          </p>
        </div>
      )}

      {/* 左右对比布局 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 原图 */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500">原图</span>
          </div>
          <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-100 shadow-sm border border-gray-200">
            <img
              src={originalUrl}
              alt="原图"
              className="w-full h-full object-contain"
            />
          </div>
        </div>

        {/* 效果图 */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-indigo-600">AI 效果图</span>
            <span className="text-xs text-gray-400">点击可查看大图</span>
          </div>
          <a
            href={resultUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="relative aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-indigo-50 to-purple-50 shadow-sm border-2 border-indigo-200 block group cursor-zoom-in"
          >
            <img
              src={resultUrl}
              alt="AI 效果图"
              className="w-full h-full object-contain transition-transform group-hover:scale-[1.02]"
            />
            {/* 悬浮遮罩 */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
              <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
            </div>
          </a>
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
        <button
          onClick={handleDownload}
          disabled={downloading}
          className={`
            flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-medium transition-all
            ${downloaded
              ? 'bg-green-500 hover:bg-green-600 text-white'
              : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl'
            }
            ${downloading ? 'opacity-70 cursor-wait' : ''}
          `}
        >
          {downloading ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              保存中...
            </>
          ) : downloaded ? (
            <>
              <Check className="w-5 h-5" />
              已保存
            </>
          ) : (
            <>
              <Download className="w-5 h-5" />
              保存效果图
            </>
          )}
        </button>
      </div>
    </div>
  );
}
