import { NextRequest, NextResponse } from 'next/server';
import { uploadImage } from '@/services/jimeng';

export const runtime = 'nodejs';

// 限制上传大小 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { code: 400, message: '请选择要上传的图片' },
        { status: 400 }
      );
    }

    // 验证文件类型
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { code: 400, message: '仅支持 JPG、PNG、WebP、GIF 格式' },
        { status: 400 }
      );
    }

    // 验证文件大小
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { code: 400, message: '图片大小不能超过 10MB' },
        { status: 400 }
      );
    }

    // 转换为 Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 调用即梦 API 上传
    const result = await uploadImage(buffer, file.name);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Upload error:', error);
    const message = error instanceof Error ? error.message : '上传失败';
    return NextResponse.json(
      { code: 500, message },
      { status: 500 }
    );
  }
}
