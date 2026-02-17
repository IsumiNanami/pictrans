import { NextRequest, NextResponse } from 'next/server';
import { submitTask } from '@/services/jimeng';
import type { StyleType } from '@/types/jimeng';

export const runtime = 'nodejs';

interface SubmitRequestBody {
  file_id: string;
  style: StyleType;
  prompt?: string;
  strength?: number;
}

export async function POST(request: NextRequest) {
  try {
    const body: SubmitRequestBody = await request.json();

    // 参数验证
    if (!body.file_id) {
      return NextResponse.json(
        { code: 400, message: '缺少 file_id 参数' },
        { status: 400 }
      );
    }

    if (!body.style) {
      return NextResponse.json(
        { code: 400, message: '请选择处理风格' },
        { status: 400 }
      );
    }

    // 验证 strength 范围
    const strength = body.strength ?? 0.7;
    if (strength < 0 || strength > 1) {
      return NextResponse.json(
        { code: 400, message: 'strength 必须在 0-1 之间' },
        { status: 400 }
      );
    }

    // 提交任务
    const result = await submitTask(
      body.file_id,
      body.style,
      body.prompt,
      strength
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Submit task error:', error);
    const message = error instanceof Error ? error.message : '任务提交失败';
    return NextResponse.json(
      { code: 500, message },
      { status: 500 }
    );
  }
}
