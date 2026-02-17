'use client';

import { useState, useCallback } from 'react';
import { Palette, RefreshCw, Wand2, Loader2 } from 'lucide-react';
import { compressImage } from '@/utils/imageCompress';
import { Dropzone } from '@/components/Dropzone';
import { ProcessingStatus } from '@/components/ProcessingStatus';
import { ImageComparison } from '@/components/ImageComparison';
import { useImageProcess } from '@/hooks/useImageProcess';
import { STYLE_OPTIONS, type StyleType } from '@/types/jimeng';

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<StyleType>('anime');
  const [strength, setStrength] = useState(0.7);
  const [customPrompt, setCustomPrompt] = useState('');
  const [isCompressing, setIsCompressing] = useState(false);

  const { state, process, isProcessing, reset } = useImageProcess();

  const handleFileSelect = useCallback(async (file: File) => {
    // 如果文件大于 2MB，自动压缩
    if (file.size > 2 * 1024 * 1024) {
      setIsCompressing(true);
      try {
        const compressed = await compressImage(file);
        setSelectedFile(compressed);
      } catch {
        setSelectedFile(file);
      } finally {
        setIsCompressing(false);
      }
    } else {
      setSelectedFile(file);
    }
  }, []);

  const handleClear = useCallback(() => {
    setSelectedFile(null);
    reset();
  }, [reset]);

  const handleProcess = useCallback(() => {
    if (!selectedFile) return;

    process({
      file: selectedFile,
      style: selectedStyle,
      prompt: customPrompt || undefined,
      strength,
    });
  }, [selectedFile, selectedStyle, customPrompt, strength, process]);

  const handleNewImage = useCallback(() => {
    setSelectedFile(null);
    setCustomPrompt('');
    reset();
  }, [reset]);

  return (
    <main className="min-h-screen py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* 标题 */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="p-3 bg-indigo-100 rounded-2xl">
              <Palette className="w-8 h-8 text-indigo-600" />
            </div>
            <h1 className="text-4xl font-bold text-gray-800">
              AI 艺术加工工坊
            </h1>
          </div>
          <p className="text-gray-600 text-lg">
            上传图片，选择风格，让 AI 为您创作独特的艺术作品
          </p>
        </div>

        {/* 主内容区 */}
        <div className="space-y-8">
          {/* 处理成功后显示对比 */}
          {state.status === 'success' && state.originalUrl && state.resultUrl ? (
            <div className="space-y-6">
              <ImageComparison
                originalUrl={state.originalUrl}
                resultUrl={state.resultUrl}
              />
              <div className="flex justify-center">
                <button
                  onClick={handleNewImage}
                  className="flex items-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors"
                >
                  <RefreshCw className="w-5 h-5" />
                  处理新图片
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* 上传区域 */}
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                {isCompressing ? (
                  <div className="flex flex-col items-center justify-center w-full aspect-video">
                    <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
                    <p className="mt-4 text-gray-600">正在压缩图片...</p>
                  </div>
                ) : (
                  <Dropzone
                    onFileSelect={handleFileSelect}
                    disabled={isProcessing}
                    previewUrl={
                      selectedFile ? URL.createObjectURL(selectedFile) : undefined
                    }
                    onClear={handleClear}
                  />
                )}
              </div>

              {/* 风格选择 */}
              {selectedFile && (
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 space-y-6">
                  <h2 className="text-lg font-semibold text-gray-800">
                    选择艺术风格
                  </h2>

                  {/* 风格网格 */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {STYLE_OPTIONS.map((style) => (
                      <button
                        key={style.value}
                        onClick={() => setSelectedStyle(style.value)}
                        disabled={isProcessing}
                        className={`
                          p-4 rounded-xl text-left transition-all
                          ${
                            selectedStyle === style.value
                              ? 'bg-indigo-50 border-2 border-indigo-500 ring-2 ring-indigo-200'
                              : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                          }
                          ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
                        `}
                      >
                        <p className="font-medium text-gray-800">{style.label}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {style.description}
                        </p>
                      </button>
                    ))}
                  </div>

                  {/* 风格强度 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      风格强度: {Math.round(strength * 100)}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={strength * 100}
                      onChange={(e) => setStrength(Number(e.target.value) / 100)}
                      disabled={isProcessing}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>轻微</span>
                      <span>强烈</span>
                    </div>
                  </div>

                  {/* 自定义提示词 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      自定义提示词 (可选)
                    </label>
                    <textarea
                      value={customPrompt}
                      onChange={(e) => setCustomPrompt(e.target.value)}
                      disabled={isProcessing}
                      placeholder="描述您想要的效果，例如：温暖的色调，梦幻的氛围..."
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none disabled:opacity-50"
                      rows={3}
                    />
                  </div>

                  {/* 开始处理按钮 */}
                  <button
                    onClick={handleProcess}
                    disabled={isProcessing}
                    className={`
                      w-full flex items-center justify-center gap-2 py-4 rounded-xl font-medium text-lg transition-all
                      ${
                        isProcessing
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl'
                      }
                    `}
                  >
                    <Wand2 className="w-5 h-5" />
                    {isProcessing ? '处理中...' : '开始艺术加工'}
                  </button>
                </div>
              )}

              {/* 处理状态 */}
              {state.status !== 'idle' && state.status !== 'success' && (
                <ProcessingStatus state={state} />
              )}

              {/* 错误重试 */}
              {state.status === 'error' && (
                <div className="flex justify-center">
                  <button
                    onClick={handleProcess}
                    className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors"
                  >
                    <RefreshCw className="w-5 h-5" />
                    重新尝试
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* 页脚 */}
        <footer className="mt-16 text-center text-sm text-gray-500">
          <p>由 AI 驱动 · 支持多种艺术风格转换</p>
        </footer>
      </div>
    </main>
  );
}
