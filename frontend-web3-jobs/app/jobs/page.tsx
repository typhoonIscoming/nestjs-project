import { Suspense } from 'react';
import type { Metadata } from 'next';
import JobsExplorer from '@/components/JobsExplorer';
import { LoadingState } from '@/components/States';

export const metadata: Metadata = {
  title: 'Web3 岗位列表',
  description: '搜索并筛选区块链、智能合约、DeFi、NFT、DAO 岗位，按行业、技能、地点、薪资、类型、远程方式与经验要求过滤。',
  alternates: { canonical: '/jobs' },
};

export default function JobsPage() {
  return (
    <div className="container-page py-8">
      <header className="mb-6">
        <h1 className="text-3xl font-extrabold text-white">Web3 岗位</h1>
        <p className="mt-1 text-slate-400">搜索、筛选并找到最适合你的区块链岗位。</p>
      </header>
      <Suspense fallback={<LoadingState />}>
        <JobsExplorer />
      </Suspense>
    </div>
  );
}
