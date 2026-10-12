import type { Metadata, Viewport } from 'next';
import './globals.css';
import Providers from './providers';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { SITE_URL } from '@/lib/server-api';

const description = '发现全球 Web3、区块链、智能合约、DeFi、NFT、DAO 岗位，一站式完成搜索、投递与招聘。';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: 'Web3 Career · 区块链与加密行业招聘平台', template: '%s | Web3 Career' },
  description,
  keywords: ['Web3 招聘', '区块链岗位', '智能合约', 'DeFi', 'NFT', 'DAO', '远程工作'],
  openGraph: {
    type: 'website',
    siteName: 'Web3 Career',
    title: 'Web3 Career · 区块链与加密行业招聘平台',
    description,
    locale: 'zh_CN',
  },
  twitter: { card: 'summary_large_image', title: 'Web3 Career', description },
  alternates: { canonical: '/' },
};

export const viewport: Viewport = {
  themeColor: '#070a14',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="flex min-h-screen flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[100] focus:rounded-lg focus:bg-emerald-400 focus:px-3 focus:py-2 focus:text-slate-950"
        >
          跳到主要内容
        </a>
        <Providers>
          <Navbar />
          <main id="main" className="flex-1">
            {children}
          </main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
