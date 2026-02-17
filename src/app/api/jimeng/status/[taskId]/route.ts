import { NextRequest, NextResponse } from 'next/server';
import { getTaskStatus } from '@/services/jimeng';

export const runtime = 'nodejs';

interface RouteParams {
  params: Promise<{ taskId: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { taskId } = await params;

    if (!taskId) {
      return NextResponse.json(
        { code: 400, message: '缺少 taskId 参数' },
        { status: 400 }
      );
    }

    const result = await getTaskStatus(taskId);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Get task status error:', error);
    const message = error instanceof Error ? error.message : '查询任务状态失败';
    return NextResponse.json(
      { code: 500, message },
      { status: 500 }
    );
  }
}
