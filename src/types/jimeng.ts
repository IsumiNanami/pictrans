// 即梦 API 类型定义

// 上传响应
export interface UploadResponse {
  code: number;
  message: string;
  data: {
    file_id: string;
    file_url: string;
  };
}

// 任务提交请求
export interface SubmitTaskRequest {
  file_id: string;
  prompt?: string;
  style?: StyleType;
  strength?: number; // 0-1 风格强度
}

// 风格类型
export type StyleType =
  | 'anime'      // 动漫风格
  | 'oil_paint'  // 油画风格
  | 'sketch'     // 素描风格
  | 'watercolor' // 水彩风格
  | 'cyberpunk'  // 赛博朋克
  | 'ghibli'     // 吉卜力风格
  | 'enhance';   // 画质增强

// 任务提交响应
export interface SubmitTaskResponse {
  code: number;
  message: string;
  data: {
    task_id: string;
  };
}

// 任务状态
export type TaskStatus = 'pending' | 'processing' | 'success' | 'failed';

// 任务状态响应
export interface TaskStatusResponse {
  code: number;
  message: string;
  data: {
    task_id: string;
    status: TaskStatus;
    progress?: number; // 0-100
    result_url?: string;
    error_message?: string;
  };
}

// 前端使用的处理状态
export interface ProcessingState {
  status: 'idle' | 'uploading' | 'processing' | 'success' | 'error';
  progress: number;
  message: string;
  originalUrl?: string;
  resultUrl?: string;
  error?: string;
}

// API 错误响应
export interface ApiError {
  code: number;
  message: string;
  details?: string;
}

// 风格选项配置
export interface StyleOption {
  value: StyleType;
  label: string;
  description: string;
}

export const STYLE_OPTIONS: StyleOption[] = [
  { value: 'anime', label: '动漫风格', description: '将图片转换为日系动漫风格' },
  { value: 'oil_paint', label: '油画风格', description: '模拟经典油画质感' },
  { value: 'sketch', label: '素描风格', description: '转换为铅笔素描效果' },
  { value: 'watercolor', label: '水彩风格', description: '呈现水彩画的柔和效果' },
  { value: 'cyberpunk', label: '赛博朋克', description: '未来科幻霓虹风格' },
  { value: 'ghibli', label: '吉卜力', description: '宫崎骏动画风格' },
  { value: 'enhance', label: '画质增强', description: '提升图片清晰度和细节' },
];
