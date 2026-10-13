import { Chonburi, Sarabun } from 'next/font/google';

const displayFont = Chonburi({ weight: '400', subsets: ['thai', 'latin'], variable: '--lobby-font-display', display: 'swap', adjustFontFallback: false });
const bodyFont = Sarabun({ weight: ['400', '600', '700'], subsets: ['thai', 'latin'], variable: '--lobby-font-body', display: 'swap', adjustFontFallback: false });
export const tableFonts = `${displayFont.variable} ${bodyFont.variable}`;
