'use client';

import { useCallback, useState } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

interface DropzoneProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
  previewUrl?: string;
  onClear?: () => void;
}

export function Dropzone({ onFileSelect, disabled, previewUrl, onClear }: DropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      if (disabled) return;

      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith('image/')) {
        onFileSelect(file);
      }
    },
    [disabled, onFileSelect]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        onFileSelect(file);
      }
      // 重置 input 以允许选择相同文件
      e.target.value = '';
    },
    [onFileSelect]
  );

  if (previewUrl) {
    return (
      <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-gray-100 group">
        <img
          src={previewUrl}
          alt="预览图片"
          className="w-full h-full object-contain"
        />
        {onClear && !disabled && (
          <button
            onClick={onClear}
            className="absolute top-3 right-3 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
            aria-label="清除图片"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
    );
  }

  return (
    <label
      className={`
        relative flex flex-col items-center justify-center w-full aspect-video
        border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-200
        ${isDragging
          ? 'border-indigo-500 bg-indigo-50'
          : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileInput}
        disabled={disabled}
        className="hidden"
      />

      <div className="flex flex-col items-center gap-4 p-8">
        <div
          className={`
            p-4 rounded-full transition-colors
            ${isDragging ? 'bg-indigo-100' : 'bg-gray-100'}
          `}
        >
          {isDragging ? (
            <ImageIcon className="w-10 h-10 text-indigo-500" />
          ) : (
            <Upload className="w-10 h-10 text-gray-400" />
          )}
        </div>

        <div className="text-center">
          <p className="text-lg font-medium text-gray-700">
            {isDragging ? '松开以上传图片' : '拖拽图片到这里'}
          </p>
          <p className="mt-1 text-sm text-gray-500">
            或点击选择文件 · 支持 JPG、PNG、WebP、GIF
          </p>
          <p className="mt-1 text-xs text-gray-400">
            最大 10MB
          </p>
        </div>
      </div>
    </label>
  );
}
