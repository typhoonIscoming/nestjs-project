'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api, getErrorMessage } from '@/lib/api';
import { useFavorites } from '@/hooks/queries';
import { useRequireLogin } from '@/hooks/useRequireLogin';
import { toast } from '@/store/toast';
import { cx } from '@/lib/utils';
import type { Job, Listed } from '@/types';

type FavData = Listed<Job> & { ids: number[] };

export default function FavoriteButton({ jobId, withLabel = false, className }: { jobId: number; withLabel?: boolean; className?: string }) {
  const queryClient = useQueryClient();
  const requireLogin = useRequireLogin();
  const { data } = useFavorites();
  const isFavorite = data?.ids.includes(jobId) ?? false;

  const mutation = useMutation({
    mutationFn: async (next: boolean) => {
      if (next) await api.post(`/jobs/${jobId}/favorite`);
      else await api.delete(`/jobs/${jobId}/favorite`);
    },
    onMutate: async (next) => {
      await queryClient.cancelQueries({ queryKey: ['favorites'] });
      const previous = queryClient.getQueryData<FavData>(['favorites']);
      queryClient.setQueryData<FavData>(['favorites'], (old) =>
        old ? { ...old, ids: next ? [...old.ids, jobId] : old.ids.filter((id) => id !== jobId) } : old,
      );
      return { previous };
    },
    onError: (error, _next, context) => {
      queryClient.setQueryData(['favorites'], context?.previous);
      toast.error(getErrorMessage(error));
    },
    onSuccess: (_data, next) => toast.success(next ? '已收藏该岗位' : '已取消收藏'),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['favorites'] }),
  });

  return (
    <button
      type="button"
      aria-pressed={isFavorite}
      aria-label={isFavorite ? '取消收藏' : '收藏岗位'}
      title={isFavorite ? '取消收藏' : '收藏岗位'}
      disabled={mutation.isPending}
      onClick={() => {
        if (!requireLogin('candidate', '登录后即可收藏岗位')) return;
        mutation.mutate(!isFavorite);
      }}
      className={cx(
        'relative z-10 inline-flex items-center justify-center gap-1.5 rounded-lg text-sm transition',
        withLabel ? 'btn-secondary' : 'h-9 w-9 border border-slate-700 bg-ink-800 hover:border-slate-500',
        isFavorite ? 'text-rose-400' : 'text-slate-300',
        className,
      )}
    >
      <span aria-hidden="true">{isFavorite ? '♥' : '♡'}</span>
      {withLabel && <span>{isFavorite ? '已收藏' : '收藏'}</span>}
    </button>
  );
}
