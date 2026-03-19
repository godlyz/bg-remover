import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'BGFree - 免费在线图片去背景工具',
  description:
    '免费在线去背景工具，支持快速免费（本地处理）和专业品质（云端高清）两种模式。无需注册，打开即用。',
  keywords: ['去背景', '抠图', '背景移除', '免费', 'bgfree', 'background removal'],
  openGraph: {
    title: 'BGFree - 免费在线图片去背景工具',
    description: '免费在线去背景，支持本地处理和云端高清两种模式',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">{children}</body>
    </html>
  );
}
