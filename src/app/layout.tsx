import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { GAME_NAME } from '@/lib/game/config';
import './globals.css';
export const metadata: Metadata = { title: GAME_NAME, description: 'เกมบลัฟและเจรจาสำหรับเพื่อน 4–6 คน' };
export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover' };
export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="th"><body><a className="skip-link" href="#main">ข้ามไปเนื้อหาหลัก</a>{children}</body></html>;
}
