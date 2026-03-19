import { EngineType } from '@/types';

/** Footer 组件 - 底部信息栏（根据引擎模式动态变化） */
interface FooterProps {
  engine: EngineType;
}

export default function Footer({ engine }: FooterProps) {
  return (
    <footer className="border-t border-gray-200 bg-gray-50 py-4">
      <div className="mx-auto max-w-5xl px-4 text-center">
        <div className="mb-2 flex flex-wrap items-center justify-center gap-4 text-sm text-gray-600">
          {engine === 'local' ? (
            <>
              <span>✅ 完全免费</span>
              <span>✅ 无需注册</span>
              <span>✅ 图片不离开你的设备</span>
            </>
          ) : (
            <>
              <span>✅ 无需注册</span>
              <span>✅ 边缘精准</span>
              <span>⚠️ 图片将上传至云端</span>
            </>
          )}
        </div>
        <p className="text-xs text-gray-400">
          Powered by BRIA RMBG-1.4 & remove.bg API · © 2026 BGFree
        </p>
      </div>
    </footer>
  );
}
