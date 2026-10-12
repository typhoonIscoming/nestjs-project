'use client';

import { usePathname } from 'next/navigation';
import AuthGuard from '@/components/AuthGuard';
import { NavTabs } from '@/components/ui';
import { useAuth } from '@/hooks/queries';

const tabs = [
  { href: '/employer/jobs', label: '岗位管理' },
  { href: '/employer/applications', label: '应用列表' },
  { href: '/employer/company', label: '账户与公司资料' },
];

function Inner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuth();
  return (
    <div className="container-page py-8">
      <header className="mb-4">
        <h1 className="text-3xl font-extrabold text-white">招聘后台</h1>
        <p className="mt-1 text-slate-400">发布岗位、筛选候选人、维护公司资料。</p>
      </header>
      {user?.status === 'pending' && (
        <p className="mb-4 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200" role="status">
          你的企业账号正在等待平台认证；岗位仍可提交审核，认证通过后将显示「已认证」标识。
        </p>
      )}
      <NavTabs tabs={tabs} pathname={pathname} />
      <div className="mt-6">{children}</div>
    </div>
  );
}

export default function EmployerShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard role="employer">
      <Inner>{children}</Inner>
    </AuthGuard>
  );
}
