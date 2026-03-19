import { NextRequest, NextResponse } from 'next/server';

/**
 * remove.bg API 代理路由
 * 接收前端上传的图片，转发到 remove.bg API 处理
 * API Key 从环境变量读取，前端不可见
 */
export async function POST(request: NextRequest) {
  const apiKey = process.env.REMOVEBG_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: 'api_key_missing', message: 'API Key 未配置' },
      { status: 500 }
    );
  }

  try {
    const formData = await request.formData();
    const imageFile = formData.get('image_file');

    if (!imageFile || !(imageFile instanceof File)) {
      return NextResponse.json(
        { error: 'invalid_input', message: '缺少图片文件' },
        { status: 400 }
      );
    }

    // 构建 remove.bg API 请求
    const apiFormData = new FormData();
    apiFormData.append('image_file', imageFile);
    apiFormData.append('size', 'auto'); // 自动选择最佳质量

    const apiResponse = await fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: {
        'X-Api-Key': apiKey,
      },
      body: apiFormData,
    });

    if (!apiResponse.ok) {
      // 额度不足
      if (apiResponse.status === 402) {
        return NextResponse.json(
          { error: 'quota_exceeded', message: '云端服务额度已用完，请使用免费模式' },
          { status: 429 }
        );
      }

      // 其他错误
      const errorData = await apiResponse.json().catch(() => ({}));
      const message =
        (errorData as { errors?: Array<{ title?: string }> })?.errors?.[0]?.title ||
        '云端处理失败';

      return NextResponse.json(
        { error: 'api_error', message },
        { status: apiResponse.status }
      );
    }

    // 返回处理后的图片
    const resultBlob = await apiResponse.blob();
    return new NextResponse(resultBlob, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'X-Engine': 'removebg',
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('remove-bg API error:', error);
    return NextResponse.json(
      { error: 'internal_error', message: '服务异常，请稍后重试' },
      { status: 500 }
    );
  }
}
