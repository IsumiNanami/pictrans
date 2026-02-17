// 火山引擎即梦 API 服务封装 - 图生图 3.0
import crypto from 'crypto';
import axios, { AxiosError } from 'axios';
import type {
  SubmitTaskResponse,
  TaskStatusResponse,
  StyleType,
} from '@/types/jimeng';

const ACCESS_KEY_ID = process.env.VOLC_ACCESS_KEY_ID || '';
const SECRET_ACCESS_KEY = process.env.VOLC_SECRET_ACCESS_KEY || '';
const API_HOST = 'visual.volcengineapi.com';
const SERVICE = 'cv';
const REGION = 'cn-north-1';

// HMAC-SHA256
function hmac(secret: string | Buffer, content: string): Buffer {
  return crypto.createHmac('sha256', secret).update(content, 'utf8').digest();
}

// SHA256 Hash
function hash(content: string): string {
  return crypto.createHash('sha256').update(content, 'utf8').digest('hex');
}

// URL 编码
function uriEscape(str: string): string {
  return encodeURIComponent(str)
    .replace(/[^A-Za-z0-9_.~\-%]+/g, escape)
    .replace(/[*]/g, (ch) => `%${ch.charCodeAt(0).toString(16).toUpperCase()}`);
}

// Query 参数转字符串
function queryParamsToString(params: Record<string, string>): string {
  return Object.keys(params)
    .sort()
    .map((key) => `${uriEscape(key)}=${uriEscape(params[key])}`)
    .join('&');
}

// 获取当前 UTC 时间
function getDateTimeNow(): string {
  return new Date().toISOString().replace(/[:-]|\.\d{3}/g, '');
}

// 火山引擎 API 签名
function sign(
  method: string,
  path: string,
  query: Record<string, string>,
  headers: Record<string, string>,
  body: string
): { authorization: string; xDate: string } {
  const datetime = getDateTimeNow();
  const date = datetime.substring(0, 8);

  // 计算 body hash
  const bodySha = hash(body);

  // 构建 canonical headers
  const signedHeaderKeys = ['host', 'x-date'];
  const canonicalHeaders = [
    `host:${headers['Host']}`,
    `x-date:${datetime}`,
  ].join('\n');
  const signedHeadersStr = signedHeaderKeys.join(';');

  // 构建 canonical request
  const canonicalRequest = [
    method.toUpperCase(),
    path,
    queryParamsToString(query),
    canonicalHeaders + '\n',
    signedHeadersStr,
    bodySha,
  ].join('\n');

  // 构建 credential scope
  const credentialScope = [date, REGION, SERVICE, 'request'].join('/');

  // 构建 string to sign
  const stringToSign = [
    'HMAC-SHA256',
    datetime,
    credentialScope,
    hash(canonicalRequest),
  ].join('\n');

  // 计算签名密钥
  const kDate = hmac(SECRET_ACCESS_KEY, date);
  const kRegion = hmac(kDate, REGION);
  const kService = hmac(kRegion, SERVICE);
  const kSigning = hmac(kService, 'request');

  // 计算签名
  const signature = hmac(kSigning, stringToSign).toString('hex');

  // 构建 Authorization
  const authorization = [
    'HMAC-SHA256',
    `Credential=${ACCESS_KEY_ID}/${credentialScope},`,
    `SignedHeaders=${signedHeadersStr},`,
    `Signature=${signature}`,
  ].join(' ');

  return { authorization, xDate: datetime };
}

// 发送请求
async function request<T>(
  action: string,
  body: Record<string, unknown>
): Promise<T> {
  const method = 'POST';
  const path = '/';
  const query: Record<string, string> = {
    Action: action,
    Version: '2022-08-31',
  };

  const bodyStr = JSON.stringify(body);
  const headers: Record<string, string> = {
    'Host': API_HOST,
  };

  const { authorization, xDate } = sign(method, path, query, headers, bodyStr);

  const requestHeaders = {
    'Content-Type': 'application/json',
    'Host': API_HOST,
    'X-Date': xDate,
    'Authorization': authorization,
  };

  const queryString = queryParamsToString(query);
  const url = `https://${API_HOST}${path}?${queryString}`;

  console.log('Request URL:', url);
  console.log('Request Headers:', JSON.stringify(requestHeaders, null, 2));

  const response = await axios.post<T>(url, bodyStr, {
    headers: requestHeaders,
    timeout: 60000,
  });

  return response.data;
}

// 错误处理
function handleApiError(error: unknown): never {
  if (error instanceof AxiosError) {
    const status = error.response?.status;
    const data = error.response?.data as Record<string, unknown> | undefined;

    console.error('API Error Status:', status);
    console.error('API Error Data:', JSON.stringify(data, null, 2));

    if (status === 429) {
      throw new Error('API 请求频率超限，请稍后重试');
    }
    if (status === 401 || status === 403) {
      throw new Error('API 认证失败，请检查 Access Key');
    }

    // 火山引擎错误格式
    const respMeta = data?.ResponseMetadata as Record<string, unknown> | undefined;
    const respError = respMeta?.Error as Record<string, string> | undefined;
    if (respError?.Message) {
      throw new Error(respError.Message);
    }

    // 业务错误
    if (data?.message && data?.code !== 10000) {
      throw new Error(data.message as string);
    }

    if (error.code === 'ECONNABORTED') {
      throw new Error('请求超时，请重试');
    }

    throw new Error(`服务器错误: ${status || '未知'}`);
  }
  throw error;
}

// 火山引擎即梦 API 响应类型
interface SubmitResponse {
  code: number;
  message: string;
  request_id: string;
  data?: {
    task_id: string;
  };
  ResponseMetadata?: {
    Error?: {
      Code: string;
      Message: string;
    };
  };
}

interface QueryResponse {
  code: number;
  message: string;
  status: number;
  request_id: string;
  data?: {
    status: string;
    binary_data_base64?: string[];
    image_urls?: string[];
  };
  ResponseMetadata?: {
    Error?: {
      Code: string;
      Message: string;
    };
  };
}

/**
 * 上传图片 - 返回 base64 供后续使用
 */
export async function uploadImage(
  imageBuffer: Buffer,
  _filename: string
): Promise<{ code: number; message: string; data: { file_id: string; file_url: string } }> {
  const base64Image = imageBuffer.toString('base64');
  return {
    code: 0,
    message: 'success',
    data: {
      file_id: base64Image,
      file_url: '',
    },
  };
}

/**
 * 提交图生图任务
 */
export async function submitTask(
  imageBase64: string,
  style: StyleType,
  prompt?: string,
  scale: number = 0.5
): Promise<SubmitTaskResponse> {
  try {
    const fullPrompt = buildPrompt(prompt || '', style);

    const response = await request<SubmitResponse>('CVSync2AsyncSubmitTask', {
      req_key: 'jimeng_i2i_v30',
      binary_data_base64: [imageBase64],
      prompt: fullPrompt,
      seed: -1,
      scale: scale,
    });

    console.log('Submit Response:', JSON.stringify(response, null, 2));

    if (response.ResponseMetadata?.Error) {
      throw new Error(response.ResponseMetadata.Error.Message);
    }

    if (response.code !== 10000) {
      throw new Error(response.message || '提交任务失败');
    }

    if (!response.data?.task_id) {
      throw new Error('未获取到任务 ID');
    }

    return {
      code: 0,
      message: 'success',
      data: {
        task_id: response.data.task_id,
      },
    };
  } catch (error) {
    handleApiError(error);
  }
}

/**
 * 查询任务状态
 */
export async function getTaskStatus(taskId: string): Promise<TaskStatusResponse> {
  try {
    const reqJson = JSON.stringify({
      return_url: true,
      logo_info: {
        add_logo: false,
      },
    });

    const response = await request<QueryResponse>('CVSync2AsyncGetResult', {
      req_key: 'jimeng_i2i_v30',
      task_id: taskId,
      req_json: reqJson,
    });

    console.log('Query Response:', JSON.stringify(response, null, 2));

    if (response.ResponseMetadata?.Error) {
      throw new Error(response.ResponseMetadata.Error.Message);
    }

    if (response.code !== 10000) {
      throw new Error(response.message || '查询任务失败');
    }

    const data = response.data;
    let status: 'pending' | 'processing' | 'success' | 'failed' = 'pending';

    switch (data?.status) {
      case 'done':
        status = 'success';
        break;
      case 'generating':
        status = 'processing';
        break;
      case 'in_queue':
        status = 'pending';
        break;
      case 'not_found':
      case 'expired':
        status = 'failed';
        break;
      default:
        status = 'pending';
    }

    return {
      code: 0,
      message: 'success',
      data: {
        task_id: taskId,
        status,
        result_url: data?.image_urls?.[0],
        error_message: data?.status === 'not_found' ? '任务未找到' :
                       data?.status === 'expired' ? '任务已过期' : undefined,
      },
    };
  } catch (error) {
    handleApiError(error);
  }
}

// 根据风格构建完整提示词
function buildPrompt(userPrompt: string, style: StyleType): string {
  const stylePrompts: Record<StyleType, string> = {
    anime: '改成日系动漫风格，精致的线条，明亮的色彩',
    oil_paint: '改成经典油画风格，厚重的笔触，丰富的色彩层次',
    sketch: '改成铅笔素描风格，黑白线条，明暗对比强烈',
    watercolor: '改成水彩画风格，柔和的色彩晕染，透明感',
    cyberpunk: '改成赛博朋克风格，添加霓虹灯光效果，未来科技感',
    ghibli: '改成吉卜力动画风格，宫崎骏风格，温暖的色调，梦幻的氛围',
    enhance: '提升画质，增强细节，让图片更清晰',
  };

  const basePrompt = stylePrompts[style];

  if (userPrompt && userPrompt.trim()) {
    return `${basePrompt}，${userPrompt}`;
  }

  return basePrompt;
}
