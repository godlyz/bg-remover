import Link from 'next/link';
import { EngineType } from '@/types';

/** Footer 组件 - 底部信息栏 */
interface FooterProps {
  engine: EngineType;
}

export default function Footer({ engine }: FooterProps) {
  return (
    <footer className="mt-auto border-t border-gray-100 bg-gray-50/80">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        {/* 标签 */}
        <div className="mb-4 flex flex-wrap items-center justify-center gap-3 text-sm">
          {engine === 'local' ? (
            <>
              <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-3 py-1 text-green-700">
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                完全免费
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-3 py-1 text-green-700">
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                无需注册
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-3 py-1 text-green-700">
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                图片不离开你的设备
              </span>
            </>
          ) : (
            <>
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-blue-700">
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                无需注册
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-blue-700">
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                边缘精准
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-yellow-50 px-3 py-1 text-yellow-700">
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
                图片将上传至云端
              </span>
            </>
          )}
        </div>

        {/* 链接 */}
        <div className="mb-3 flex items-center justify-center gap-4 text-sm">
          <Link href="/pricing" className="text-gray-400 hover:text-gray-600 transition-colors">定价</Link>
          <Link href="/account" className="text-gray-400 hover:text-gray-600 transition-colors">个人中心</Link>
        </div>

        {/* 版权 */}
        <p className="text-center text-xs text-gray-400">
          Powered by BRIA RMBG-1.4 & remove.bg API · © {new Date().getFullYear()} BGFree
        </p>
      </div>
    </footer>
  );
}
