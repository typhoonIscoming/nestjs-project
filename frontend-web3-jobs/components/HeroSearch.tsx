'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function HeroSearch() {
  const router = useRouter();
  const [keyword, setKeyword] = useState('');

  return (
    <form
      role="search"
      className="mx-auto flex w-full max-w-2xl flex-col gap-2 sm:flex-row"
      onSubmit={(e) => {
        e.preventDefault();
        const q = keyword.trim();
        router.push(q ? `/jobs?keyword=${encodeURIComponent(q)}` : '/jobs');
      }}
    >
      <label htmlFor="hero-search" className="sr-only">搜索岗位、技能或公司</label>
      <input
        id="hero-search"
        className="input flex-1 py-3 text-base"
        placeholder="搜索岗位、技能或公司，例如 Solidity、DeFi…"
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
      />
      <button type="submit" className="btn-primary py-3 text-base">搜索岗位</button>
    </form>
  );
}
