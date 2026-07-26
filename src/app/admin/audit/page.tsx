import prisma from '@/lib/prisma';
import { ClipboardList } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AuditLogPage({
  searchParams
}: {
  searchParams: Promise<{ page?: string; aksi?: string }>
}) {
  const { page: pageParam, aksi: aksiParam } = await searchParams;
  const page = parseInt(pageParam || '1');
  const perPage = 50;
  const skip = (page - 1) * perPage;

  const where = aksiParam ? { aksi: { contains: aksiParam } } : {};

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: perPage,
      skip
    }),
    prisma.auditLog.count({ where })
  ]);

  const totalPages = Math.ceil(total / perPage);

  const aksiColors: Record<string, string> = {
    CREATE: 'bg-crypto-success/10 text-crypto-success border-crypto-success/20',
    DELETE: 'bg-red-500/10 text-red-400 border-red-500/20',
    UPDATE: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    FORCE: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  };

  const getBadgeClass = (aksi: string) => {
    const key = Object.keys(aksiColors).find(k => aksi.startsWith(k));
    return key ? aksiColors[key] : 'bg-gray-700 text-gray-400 border-gray-600';
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <ClipboardList className="w-6 h-6 text-crypto-accent" />
          <h2 className="text-2xl font-bold text-white tracking-wide">Audit Log</h2>
        </div>
        <p className="text-sm text-gray-400 mt-1">
          Rekam jejak aktivitas kritis yang dilakukan di dalam sistem.
        </p>
      </div>

      <div className="bg-crypto-card rounded-2xl border border-crypto-border overflow-hidden">
        <div className="p-4 border-b border-crypto-border bg-black/40 flex items-center justify-between">
          <p className="text-sm text-gray-400">
            Total <span className="font-semibold text-white">{total}</span> aktivitas tercatat
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-black/40 border-b border-crypto-border text-sm">
                <th className="px-4 py-3 font-semibold text-gray-400">Waktu</th>
                <th className="px-4 py-3 font-semibold text-gray-400">Pengguna</th>
                <th className="px-4 py-3 font-semibold text-gray-400">Aksi</th>
                <th className="px-4 py-3 font-semibold text-gray-400">Entitas</th>
                <th className="px-4 py-3 font-semibold text-gray-400">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-crypto-border text-sm text-gray-300">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-gray-500">
                    Belum ada aktivitas yang tercatat.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-crypto-card-hover transition-colors">
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString('id-ID', {
                        day: '2-digit', month: 'short', year: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </td>
                    <td className="px-4 py-3 font-medium text-white">{log.userNama}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-1 text-xs font-bold rounded-lg border ${getBadgeClass(log.aksi)}`}>
                        {log.aksi}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400">{log.entitas}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs max-w-xs truncate">{log.detail || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="p-4 border-t border-crypto-border flex items-center justify-between bg-black/40">
            <p className="text-sm text-gray-400">Hal {page} / {totalPages}</p>
            <div className="flex gap-2">
              {page > 1 && (
                <a href={`?page=${page - 1}`} className="px-3 py-1.5 text-sm text-gray-300 border border-crypto-border rounded-lg hover:bg-crypto-card-hover transition-colors">
                  Sebelumnya
                </a>
              )}
              {page < totalPages && (
                <a href={`?page=${page + 1}`} className="px-3 py-1.5 text-sm text-gray-300 border border-crypto-border rounded-lg hover:bg-crypto-card-hover transition-colors">
                  Berikutnya
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
