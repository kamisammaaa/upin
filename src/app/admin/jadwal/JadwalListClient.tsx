'use client';

import {
  Calendar,
  Clock,
  Users,
  Trash2,
  Pencil,
  Activity,
  Database,
  FileSpreadsheet,
  ChevronDown,
  ChevronUp,
  Search,
  LayoutGrid,
  List,
  Sparkles,
  BookOpen,
  ArrowRight,
  Timer,
  X,
  Plus
} from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { deleteJadwalUjian } from '@/app/actions/jadwal';
import { useRouter } from 'next/navigation';

export interface KelasItem {
  id: number;
  nama: string;
}

export interface MapelItem {
  id: number;
  nama: string;
}

export interface BankSoalItem {
  id: number;
  judul?: string;
  mapel: MapelItem;
}

export interface JadwalItem {
  id: number;
  nama: string;
  bankSoalId: number;
  bankSoal: BankSoalItem;
  waktuMulai: Date | string;
  waktuSelesai: Date | string;
  acakSoal?: boolean;
  acakOpsi?: boolean;
  tipeUjian?: string;
  kelas: KelasItem[];
  siswaKhusus?: any[];
  _count?: {
    sesiSiswa: number;
    siswaKhusus?: number;
  };
  sessionNumber?: number;
  sessionLabel?: string;
}

interface JadwalListClientProps {
  jadwals: JadwalItem[];
}

export default function JadwalListClient({ jadwals }: JadwalListClientProps) {
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [activeBackupDropdown, setActiveBackupDropdown] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'semua' | 'hari-ini' | 'berjalan' | 'akan-datang' | 'selesai'>('semua');
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>('semua');
  const [viewMode, setViewMode] = useState<'grouped' | 'table'>('grouped');
  const [collapsedDates, setCollapsedDates] = useState<Record<string, boolean>>({});
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const todaySectionRef = useRef<HTMLDivElement | null>(null);

  // Update clock every minute for live status transitions
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Close backup dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setActiveBackupDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDelete = async (id: number) => {
    if (confirm('Apakah Anda yakin ingin menghapus jadwal ujian ini?')) {
      setLoadingId(id);
      const res = await deleteJadwalUjian(id);
      if (!res.success) {
        alert(res.message);
      } else {
        router.refresh();
      }
      setLoadingId(null);
    }
  };

  // Helper date functions for Asia/Jakarta timezone
  const getLocalDateKey = useCallback((date: Date | string) => {
    const d = new Date(date);
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Jakarta',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(d); // "YYYY-MM-DD"
  }, []);

  const formatLocalDateLabel = useCallback((date: Date | string) => {
    const d = new Date(date);
    return new Intl.DateTimeFormat('id-ID', {
      timeZone: 'Asia/Jakarta',
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(d); // e.g. "Senin, 21 September 2026"
  }, []);

  const formatLocalTime = useCallback((date: Date | string) => {
    const d = new Date(date);
    return new Intl.DateTimeFormat('id-ID', {
      timeZone: 'Asia/Jakarta',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(d).replace(':', '.'); // "07.30"
  }, []);

  const todayKey = useMemo(() => getLocalDateKey(currentTime), [getLocalDateKey, currentTime]);

  // Determine status of an exam
  const getJadwalStatus = useCallback((jadwal: JadwalItem) => {
    const mulai = new Date(jadwal.waktuMulai);
    const selesai = new Date(jadwal.waktuSelesai);
    if (mulai <= currentTime && selesai >= currentTime) {
      return { label: 'Sedang Berjalan', code: 'berjalan', color: 'emerald' };
    } else if (selesai < currentTime) {
      return { label: 'Selesai', code: 'selesai', color: 'gray' };
    } else {
      const isHariIni = getLocalDateKey(mulai) === todayKey;
      return {
        label: isHariIni ? 'Hari Ini' : 'Akan Datang',
        code: 'akan-datang',
        color: isHariIni ? 'cyan' : 'amber',
      };
    }
  }, [currentTime, getLocalDateKey, todayKey]);

  // Calculate duration in minutes
  const getDurationMinutes = useCallback((mulaiStr: Date | string, selesaiStr: Date | string) => {
    const m = new Date(mulaiStr).getTime();
    const s = new Date(selesaiStr).getTime();
    return Math.max(0, Math.round((s - m) / (1000 * 60)));
  }, []);

  // Find the single "Jadwal Terdekat / Highlight" (Active now OR nearest upcoming)
  const highlightJadwal = useMemo(() => {
    if (!jadwals || jadwals.length === 0) return null;

    // 1. Check for actively ongoing exam
    const active = jadwals.find((j) => {
      const m = new Date(j.waktuMulai);
      const s = new Date(j.waktuSelesai);
      return m <= currentTime && s >= currentTime;
    });
    if (active) return { jadwal: active, type: 'active' as const };

    // 2. Otherwise find nearest upcoming exam
    const upcomingList = jadwals
      .filter((j) => new Date(j.waktuMulai) > currentTime)
      .sort((a, b) => new Date(a.waktuMulai).getTime() - new Date(b.waktuMulai).getTime());

    if (upcomingList.length > 0) {
      return { jadwal: upcomingList[0], type: 'upcoming' as const };
    }

    return null;
  }, [jadwals, currentTime]);

  // Extract all unique dates for the dropdown filter
  const allUniqueDates = useMemo(() => {
    const map = new Map<string, { key: string; label: string; count: number }>();
    jadwals.forEach((j) => {
      const key = getLocalDateKey(j.waktuMulai);
      if (!map.has(key)) {
        map.set(key, { key, label: formatLocalDateLabel(j.waktuMulai), count: 1 });
      } else {
        map.get(key)!.count += 1;
      }
    });
    return Array.from(map.values()).sort((a, b) => a.key.localeCompare(b.key));
  }, [jadwals, getLocalDateKey, formatLocalDateLabel]);

  // Filter schedules based on search, status tabs, and date dropdown
  const filteredJadwals = useMemo(() => {
    return jadwals.filter((j) => {
      const statusObj = getJadwalStatus(j);
      const dateKey = getLocalDateKey(j.waktuMulai);

      // Search match
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const namaMatch = j.nama?.toLowerCase().includes(q);
        const mapelMatch = j.bankSoal?.mapel?.nama?.toLowerCase().includes(q);
        const kelasMatch = j.kelas?.some((k) => k.nama?.toLowerCase().includes(q));
        if (!namaMatch && !mapelMatch && !kelasMatch) return false;
      }

      // Status filter match
      if (statusFilter === 'hari-ini' && dateKey !== todayKey) return false;
      if (statusFilter === 'berjalan' && statusObj.code !== 'berjalan') return false;
      if (statusFilter === 'akan-datang' && statusObj.code !== 'akan-datang') return false;
      if (statusFilter === 'selesai' && statusObj.code !== 'selesai') return false;

      // Date select match
      if (selectedDateFilter !== 'semua' && dateKey !== selectedDateFilter) return false;

      return true;
    });
  }, [jadwals, searchQuery, statusFilter, selectedDateFilter, getJadwalStatus, getLocalDateKey, todayKey]);

  // Group filtered schedules by date, and within each date sort and assign sessions
  const groupedByDate = useMemo(() => {
    const groups: {
      dateKey: string;
      dateLabel: string;
      isToday: boolean;
      isPast: boolean;
      items: JadwalItem[];
    }[] = [];

    // Group items
    const map = new Map<string, JadwalItem[]>();
    filteredJadwals.forEach((j) => {
      const key = getLocalDateKey(j.waktuMulai);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(j);
    });

    // Sort dates chronologically
    const sortedKeys = Array.from(map.keys()).sort((a, b) => a.localeCompare(b));

    sortedKeys.forEach((key) => {
      const items = map.get(key)!;
      // Sort items within this date by start time ascending
      items.sort((a, b) => new Date(a.waktuMulai).getTime() - new Date(b.waktuMulai).getTime());

      // Compute distinct session time slots for this date
      const timeSlots: string[] = [];
      items.forEach((item) => {
        const slotKey = `${formatLocalTime(item.waktuMulai)}-${formatLocalTime(item.waktuSelesai)}`;
        if (!timeSlots.includes(slotKey)) timeSlots.push(slotKey);
      });

      // Attach session number to items
      const itemsWithSession: JadwalItem[] = items.map((item) => {
        const slotKey = `${formatLocalTime(item.waktuMulai)}-${formatLocalTime(item.waktuSelesai)}`;
        const sessionIndex = timeSlots.indexOf(slotKey) + 1;
        return {
          ...item,
          sessionNumber: sessionIndex,
          sessionLabel: `Sesi ${sessionIndex}`,
        };
      });

      const firstDate = new Date(items[0].waktuMulai);
      const isToday = key === todayKey;
      const isPast = key < todayKey;

      groups.push({
        dateKey: key,
        dateLabel: formatLocalDateLabel(firstDate),
        isToday,
        isPast,
        items: itemsWithSession,
      });
    });

    return groups;
  }, [filteredJadwals, todayKey, getLocalDateKey, formatLocalTime, formatLocalDateLabel]);

  // Counts for status tabs
  const counts = useMemo(() => {
    const total = jadwals.length;
    let hariIni = 0;
    let berjalan = 0;
    let akanDatang = 0;
    let selesai = 0;

    jadwals.forEach((j) => {
      const st = getJadwalStatus(j);
      const dk = getLocalDateKey(j.waktuMulai);
      if (dk === todayKey) hariIni++;
      if (st.code === 'berjalan') berjalan++;
      if (st.code === 'akan-datang') akanDatang++;
      if (st.code === 'selesai') selesai++;
    });

    return { total, hariIni, berjalan, akanDatang, selesai };
  }, [jadwals, getJadwalStatus, getLocalDateKey, todayKey]);

  const toggleCollapseDate = (dateKey: string) => {
    setCollapsedDates((prev) => ({
      ...prev,
      [dateKey]: !prev[dateKey],
    }));
  };

  const scrollToToday = () => {
    if (todaySectionRef.current) {
      todaySectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      setStatusFilter('hari-ini');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-crypto-card p-5 sm:p-6 rounded-2xl border border-crypto-border shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-crypto-accent/15 border border-crypto-accent/30 flex items-center justify-center text-crypto-accent shadow-neon">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-wide flex items-center gap-2">
                Jadwal Ujian Terstruktur
              </h2>
              <p className="text-xs sm:text-sm text-gray-400 mt-0.5">
                Terurut otomatis per tanggal dan sesi pelaksanaan untuk mempermudah monitoring proktor & admin.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {counts.hariIni > 0 && (
            <button
              type="button"
              onClick={scrollToToday}
              className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold text-cyan-300 bg-cyan-500/10 border border-cyan-500/30 rounded-xl hover:bg-cyan-500/20 transition shadow-[0_0_15px_rgba(6,182,212,0.15)]"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Lihat Hari Ini ({counts.hariIni})</span>
            </button>
          )}

          <Link
            href="/admin/jadwal/tambah"
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white bg-crypto-accent rounded-xl hover:bg-crypto-accent-hover transition-all shadow-neon"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Jadwal Baru</span>
          </Link>
        </div>
      </div>

      {/* HIGHLIGHT CARD: Jadwal Terdekat / Sedang Berlangsung */}
      {highlightJadwal && (
        <div
          className={`relative rounded-2xl p-5 sm:p-6 border overflow-hidden transition-all ${
            highlightJadwal.type === 'active'
              ? 'border-emerald-500/40 bg-gradient-to-br from-emerald-950/40 via-black/80 to-black border-2 shadow-[0_0_25px_rgba(16,185,129,0.2)]'
              : 'border-crypto-accent/30 bg-gradient-to-br from-purple-950/30 via-black/80 to-black shadow-[0_0_25px_rgba(112,0,255,0.15)]'
          }`}
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-crypto-accent/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-5 relative z-10">
            <div className="space-y-2 max-w-3xl">
              <div className="flex flex-wrap items-center gap-2">
                {highlightJadwal.type === 'active' ? (
                  <span className="flex items-center gap-1.5 px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    Sedang Berlangsung Sekarang
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full bg-crypto-accent/20 text-crypto-accent border border-crypto-accent/30 shadow-sm">
                    <Timer className="w-3.5 h-3.5" />
                    Jadwal Ujian Terdekat Berikutnya
                  </span>
                )}

                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {formatLocalDateLabel(highlightJadwal.jadwal.waktuMulai)}
                </span>
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-lg sm:text-xl font-bold text-white tracking-wide">
                    {highlightJadwal.jadwal.nama}
                  </h3>
                  {highlightJadwal.jadwal.tipeUjian === 'SUSULAN' && (
                    <span className="px-2 py-0.5 text-xs font-bold rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
                      SUSULAN
                    </span>
                  )}
                </div>
                <p className="text-sm font-semibold text-crypto-accent mt-0.5 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4" />
                  {highlightJadwal.jadwal.bankSoal?.mapel?.nama}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-1 text-xs text-gray-300">
                <div className="flex items-center gap-1.5 font-mono">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="font-semibold text-white">
                    {formatLocalTime(highlightJadwal.jadwal.waktuMulai)} - {formatLocalTime(highlightJadwal.jadwal.waktuSelesai)} WIB
                  </span>
                  <span className="text-gray-500">
                    ({getDurationMinutes(highlightJadwal.jadwal.waktuMulai, highlightJadwal.jadwal.waktuSelesai)} mnt)
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-gray-400" />
                  <span>Kelas:</span>
                  <div className="flex flex-wrap gap-1">
                    {highlightJadwal.jadwal.kelas?.map((k) => (
                      <span
                        key={k.id}
                        className="px-1.5 py-0.5 bg-white/10 text-white rounded font-medium text-[11px]"
                      >
                        {k.nama}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 w-full lg:w-auto shrink-0">
              <Link
                href={`/admin/jadwal/${highlightJadwal.jadwal.id}`}
                className={`w-full lg:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-bold text-white transition-all shadow-md ${
                  highlightJadwal.type === 'active'
                    ? 'bg-emerald-600 hover:bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                    : 'bg-crypto-accent hover:bg-crypto-accent-hover shadow-neon'
                }`}
              >
                <Activity className="w-4 h-4" />
                <span>Pantau Ujian Sekarang</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* FILTER CONTROLS & SEARCH BAR */}
      <div className="bg-crypto-card p-4 rounded-2xl border border-crypto-border space-y-4">
        {/* Status Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-crypto-border pb-3">
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setStatusFilter('semua')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                statusFilter === 'semua'
                  ? 'bg-crypto-accent text-white shadow-neon'
                  : 'bg-black/30 text-gray-400 hover:text-white hover:bg-black/60'
              }`}
            >
              <span>Semua</span>
              <span className="px-1.5 py-0.2 rounded-md bg-white/20 text-[10px]">
                {counts.total}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('hari-ini')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                statusFilter === 'hari-ini'
                  ? 'bg-cyan-600 text-white shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                  : 'bg-black/30 text-gray-400 hover:text-cyan-400 hover:bg-black/60'
              }`}
            >
              <span>Hari Ini</span>
              <span className="px-1.5 py-0.2 rounded-md bg-white/20 text-[10px]">
                {counts.hariIni}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('berjalan')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                statusFilter === 'berjalan'
                  ? 'bg-emerald-600 text-white shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                  : 'bg-black/30 text-gray-400 hover:text-emerald-400 hover:bg-black/60'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>Sedang Berjalan</span>
              <span className="px-1.5 py-0.2 rounded-md bg-white/20 text-[10px]">
                {counts.berjalan}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('akan-datang')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                statusFilter === 'akan-datang'
                  ? 'bg-amber-600 text-white shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                  : 'bg-black/30 text-gray-400 hover:text-amber-400 hover:bg-black/60'
              }`}
            >
              <span>Akan Datang</span>
              <span className="px-1.5 py-0.2 rounded-md bg-white/20 text-[10px]">
                {counts.akanDatang}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('selesai')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                statusFilter === 'selesai'
                  ? 'bg-gray-700 text-white'
                  : 'bg-black/30 text-gray-400 hover:text-white hover:bg-black/60'
              }`}
            >
              <span>Selesai</span>
              <span className="px-1.5 py-0.2 rounded-md bg-white/20 text-[10px]">
                {counts.selesai}
              </span>
            </button>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-crypto-border">
            <button
              type="button"
              onClick={() => setViewMode('grouped')}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg transition ${
                viewMode === 'grouped'
                  ? 'bg-crypto-accent text-white shadow-xs'
                  : 'text-gray-400 hover:text-white'
              }`}
              title="Tampilan Dikelompokkan per Tanggal & Sesi"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Per Tanggal</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg transition ${
                viewMode === 'table'
                  ? 'bg-crypto-accent text-white shadow-xs'
                  : 'text-gray-400 hover:text-white'
              }`}
              title="Tampilan Tabel Ringkas"
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Tabel</span>
            </button>
          </div>
        </div>

        {/* Search & Date Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari ujian, mata pelajaran, atau nama kelas..."
              className="w-full bg-black/40 border border-crypto-border rounded-xl pl-9 pr-9 py-2 text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-crypto-accent focus:border-transparent transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Date Filter Dropdown */}
          <div className="w-full sm:w-64 shrink-0">
            <select
              value={selectedDateFilter}
              onChange={(e) => setSelectedDateFilter(e.target.value)}
              aria-label="Pilih filter tanggal pelaksanaan ujian"
              className="w-full bg-black/40 border border-crypto-border rounded-xl px-3 py-2 text-xs sm:text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-crypto-accent focus:border-transparent transition"
            >
              <option value="semua">Semua Tanggal ({jadwals.length})</option>
              {allUniqueDates.map((d) => (
                <option key={d.key} value={d.key}>
                  {d.key === todayKey ? '🌟 Hari Ini: ' : ''}
                  {d.label} ({d.count})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT: GROUPED BY DATE OR COMPACT TABLE */}
      {viewMode === 'grouped' ? (
        <div className="space-y-8">
          {groupedByDate.map((group) => {
            const isCollapsed = !!collapsedDates[group.dateKey];

            return (
              <div
                key={group.dateKey}
                ref={group.isToday ? todaySectionRef : null}
                className={`rounded-2xl border transition-all ${
                  group.isToday
                    ? 'border-cyan-500/40 bg-cyan-950/10 shadow-[0_0_20px_rgba(6,182,212,0.1)]'
                    : 'border-crypto-border bg-crypto-card'
                }`}
              >
                {/* DATE HEADER BANNER */}
                <div
                  onClick={() => toggleCollapseDate(group.dateKey)}
                  className={`p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 cursor-pointer select-none rounded-t-2xl transition ${
                    group.isToday
                      ? 'bg-cyan-500/10 hover:bg-cyan-500/15'
                      : 'bg-black/30 hover:bg-black/50'
                  } ${isCollapsed ? 'rounded-b-2xl' : 'border-b border-crypto-border'}`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm ${
                        group.isToday
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                          : 'bg-crypto-accent/15 text-crypto-accent border border-crypto-accent/30'
                      }`}
                    >
                      <Calendar className="w-4 h-4" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base sm:text-lg font-bold text-white tracking-wide">
                          {group.dateLabel}
                        </h3>
                        {group.isToday && (
                          <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 animate-pulse">
                            Hari Ini
                          </span>
                        )}
                        {group.isPast && !group.isToday && (
                          <span className="px-2 py-0.5 text-[10px] font-medium uppercase rounded-md bg-gray-800 text-gray-400">
                            Selesai
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {group.items.length} Jadwal Ujian Terjadwal
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-gray-400 text-xs">
                    <span>{isCollapsed ? 'Tampilkan' : 'Sembunyikan'}</span>
                    {isCollapsed ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronUp className="w-4 h-4" />
                    )}
                  </div>
                </div>

                {/* EXAM CARDS WITHIN THIS DATE */}
                {!isCollapsed && (
                  <div className="p-4 sm:p-5 grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {group.items.map((jadwal) => {
                      const statusObj = getJadwalStatus(jadwal);
                      const duration = getDurationMinutes(jadwal.waktuMulai, jadwal.waktuSelesai);

                      return (
                        <div
                          key={jadwal.id}
                          className={`rounded-xl border flex flex-col justify-between transition-all group overflow-hidden ${
                            statusObj.code === 'berjalan'
                              ? 'border-emerald-500/50 bg-emerald-950/20 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                              : 'border-crypto-border/80 bg-black/40 hover:bg-crypto-card-hover hover:border-crypto-accent/50'
                          }`}
                        >
                          {/* Card Top: Sesi, Waktu, & Status */}
                          <div className="p-4 border-b border-crypto-border/60 flex items-start justify-between gap-2 bg-black/20">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 text-[11px] font-bold rounded-md bg-crypto-accent/20 text-crypto-accent border border-crypto-accent/30">
                                  {jadwal.sessionLabel}
                                </span>
                                {jadwal.tipeUjian === 'SUSULAN' && (
                                  <span className="px-2 py-0.5 text-[11px] font-bold rounded-md bg-amber-500/20 text-amber-400 border border-amber-500/40">
                                    SUSULAN
                                  </span>
                                )}
                                <span className="text-xs font-mono font-semibold text-white flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5 text-gray-400" />
                                  {formatLocalTime(jadwal.waktuMulai)} - {formatLocalTime(jadwal.waktuSelesai)} WIB
                                </span>
                              </div>
                              <p className="text-[11px] text-gray-400">
                                Durasi Ujian: <span className="text-gray-200 font-medium">{duration} Menit</span>
                              </p>
                            </div>

                            <span
                              className={`px-2.5 py-1 text-xs font-semibold rounded-lg border shrink-0 ${
                                statusObj.code === 'berjalan'
                                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 animate-pulse'
                                  : statusObj.code === 'selesai'
                                  ? 'bg-gray-800 text-gray-400 border-gray-700'
                                  : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                              }`}
                            >
                              {statusObj.label}
                            </span>
                          </div>

                          {/* Card Body: Exam Name & Mapel */}
                          <div className="p-4 space-y-3 flex-1">
                            <div>
                              <h4 className="text-base font-bold text-white group-hover:text-crypto-accent transition-colors">
                                {jadwal.nama}
                              </h4>
                              <p className="text-xs font-semibold text-crypto-accent mt-0.5">
                                {jadwal.bankSoal?.mapel?.nama}
                              </p>
                            </div>

                            {/* Kelas Peserta */}
                            <div className="space-y-1">
                              <span className="text-[11px] text-gray-400 flex items-center gap-1 font-medium">
                                <Users className="w-3 h-3 text-gray-500" />
                                Kelas Peserta:
                              </span>
                              <div className="flex flex-wrap gap-1">
                                {jadwal.kelas?.map((k) => (
                                  <span
                                    key={k.id}
                                    className="text-[10px] px-2 py-0.5 bg-blue-500/10 text-blue-300 rounded-md border border-blue-500/20 font-medium"
                                  >
                                    {k.nama}
                                  </span>
                                ))}
                                {(!jadwal.kelas || jadwal.kelas.length === 0) && (
                                  <span className="text-[10px] text-gray-500 italic">
                                    Belum ada kelas ditautkan
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Card Footer: Action Buttons */}
                          <div className="p-3 bg-black/40 border-t border-crypto-border/60 flex items-center justify-between gap-2">
                            {/* Backup Dropdown */}
                            <div
                              className="relative"
                              ref={activeBackupDropdown === jadwal.id ? dropdownRef : null}
                            >
                              <button
                                type="button"
                                onClick={() =>
                                  setActiveBackupDropdown(
                                    activeBackupDropdown === jadwal.id ? null : jadwal.id
                                  )
                                }
                                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-green-400 bg-green-500/10 border border-green-500/20 rounded-lg hover:bg-green-500 hover:text-white transition shadow-xs"
                              >
                                <Database className="w-3.5 h-3.5" />
                                <span>Backup</span>
                                <ChevronDown
                                  className={`w-3 h-3 transition-transform ${
                                    activeBackupDropdown === jadwal.id ? 'rotate-180' : ''
                                  }`}
                                />
                              </button>

                              {activeBackupDropdown === jadwal.id && (
                                <div className="absolute left-0 bottom-full mb-2 w-64 bg-[#121218] border border-crypto-border rounded-xl shadow-2xl z-50 p-2 space-y-1 backdrop-blur-md">
                                  <a
                                    href={`/api/admin/backup/jadwal/${jadwal.id}`}
                                    download
                                    onClick={() => setActiveBackupDropdown(null)}
                                    className="w-full flex items-start gap-2.5 p-2 text-xs font-semibold text-gray-200 hover:text-white hover:bg-white/5 rounded-lg transition text-left group/item"
                                  >
                                    <FileSpreadsheet className="w-4 h-4 text-green-400 mt-0.5 shrink-0 group-hover/item:scale-110 transition-transform" />
                                    <div>
                                      <p className="font-bold text-white">Rekap Hasil (.xlsx)</p>
                                      <p className="text-[10px] text-gray-400 font-normal">
                                        Multi-sheet: Nilai & Jawaban
                                      </p>
                                    </div>
                                  </a>

                                  <a
                                    href="/api/admin/backup/database"
                                    download
                                    onClick={() => setActiveBackupDropdown(null)}
                                    className="w-full flex items-start gap-2.5 p-2 text-xs font-semibold text-gray-200 hover:text-white hover:bg-white/5 rounded-lg transition text-left group/item"
                                  >
                                    <Database className="w-4 h-4 text-crypto-accent mt-0.5 shrink-0 group-hover/item:scale-110 transition-transform" />
                                    <div>
                                      <p className="font-bold text-white">Snapshot Database (.db)</p>
                                      <p className="text-[10px] text-gray-400 font-normal">
                                        Sinkronisasi WAL & Unduh .db
                                      </p>
                                    </div>
                                  </a>
                                </div>
                              )}
                            </div>

                            {/* Action Buttons: Pantau, Edit, Hapus */}
                            <div className="flex items-center gap-1.5">
                              <Link
                                href={`/admin/jadwal/${jadwal.id}`}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-crypto-accent bg-crypto-accent/10 border border-crypto-accent/20 rounded-lg hover:bg-crypto-accent hover:text-white transition shadow-neon"
                              >
                                <Activity className="w-3.5 h-3.5" />
                                <span>Pantau</span>
                              </Link>

                              <Link
                                href={`/admin/jadwal/${jadwal.id}/edit`}
                                className="p-1.5 text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg hover:bg-amber-500 hover:text-white transition"
                                title="Edit Jadwal"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </Link>

                              <button
                                type="button"
                                onClick={() => handleDelete(jadwal.id)}
                                disabled={loadingId === jadwal.id}
                                className="p-1.5 text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg hover:bg-red-500 hover:text-white transition disabled:opacity-50"
                                title="Hapus Jadwal"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW (COMPACT) */
        <div className="bg-crypto-card rounded-2xl border border-crypto-border overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-black/40 border-b border-crypto-border text-xs uppercase text-gray-400">
                <tr>
                  <th className="px-4 py-3.5 font-semibold">Tanggal & Sesi</th>
                  <th className="px-4 py-3.5 font-semibold">Nama Ujian & Mapel</th>
                  <th className="px-4 py-3.5 font-semibold">Kelas Peserta</th>
                  <th className="px-4 py-3.5 font-semibold text-center">Status</th>
                  <th className="px-4 py-3.5 font-semibold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-crypto-border/50">
                {filteredJadwals.map((jadwal) => {
                  const statusObj = getJadwalStatus(jadwal);
                  const duration = getDurationMinutes(jadwal.waktuMulai, jadwal.waktuSelesai);
                  const isToday = getLocalDateKey(jadwal.waktuMulai) === todayKey;

                  return (
                    <tr
                      key={jadwal.id}
                      className="hover:bg-crypto-card-hover transition-colors group"
                    >
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {isToday && (
                            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                          )}
                          <span className="font-semibold text-white">
                            {formatLocalDateLabel(jadwal.waktuMulai)}
                          </span>
                        </div>
                        <div className="text-xs text-gray-400 font-mono mt-0.5">
                          {formatLocalTime(jadwal.waktuMulai)} - {formatLocalTime(jadwal.waktuSelesai)} WIB ({duration} mnt)
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-white group-hover:text-crypto-accent transition-colors">
                            {jadwal.nama}
                          </span>
                          {jadwal.tipeUjian === 'SUSULAN' && (
                            <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                              SUSULAN
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-crypto-accent font-medium">
                          {jadwal.bankSoal?.mapel?.nama}
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {jadwal.kelas?.map((k) => (
                            <span
                              key={k.id}
                              className="text-[10px] px-1.5 py-0.5 bg-blue-500/10 text-blue-300 rounded border border-blue-500/20"
                            >
                              {k.nama}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="px-4 py-3.5 text-center whitespace-nowrap">
                        <span
                          className={`px-2.5 py-1 text-xs font-semibold rounded-lg border ${
                            statusObj.code === 'berjalan'
                              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 animate-pulse'
                              : statusObj.code === 'selesai'
                              ? 'bg-gray-800 text-gray-400 border-gray-700'
                              : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                          }`}
                        >
                          {statusObj.label}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/admin/jadwal/${jadwal.id}`}
                            className="px-2.5 py-1 text-xs font-semibold text-crypto-accent bg-crypto-accent/10 border border-crypto-accent/20 rounded-lg hover:bg-crypto-accent hover:text-white transition"
                          >
                            Pantau
                          </Link>
                          <Link
                            href={`/admin/jadwal/${jadwal.id}/edit`}
                            className="p-1 text-amber-400 hover:text-white hover:bg-amber-500/20 rounded-lg transition"
                            title="Edit"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleDelete(jadwal.id)}
                            disabled={loadingId === jadwal.id}
                            className="p-1 text-red-400 hover:text-white hover:bg-red-500/20 rounded-lg transition disabled:opacity-50"
                            title="Hapus"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* EMPTY STATE */}
      {filteredJadwals.length === 0 && (
        <div className="py-16 text-center text-gray-500 bg-crypto-card rounded-2xl border border-dashed border-crypto-border">
          <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="font-semibold text-gray-300 text-base">Tidak ada jadwal ujian yang sesuai</p>
          <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-sm mx-auto">
            {searchQuery || statusFilter !== 'semua' || selectedDateFilter !== 'semua'
              ? 'Coba atur ulang filter pencarian atau pilih tab status yang berbeda.'
              : 'Belum ada jadwal ujian yang dibuat. Klik tombol + Buat Jadwal Baru untuk mulai.'}
          </p>

          {(searchQuery || statusFilter !== 'semua' || selectedDateFilter !== 'semua') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('semua');
                setSelectedDateFilter('semua');
              }}
              className="mt-4 px-4 py-2 text-xs font-semibold text-crypto-accent bg-crypto-accent/10 border border-crypto-accent/20 rounded-xl hover:bg-crypto-accent/20 transition"
            >
              Reset Semua Filter
            </button>
          )}
        </div>
      )}
    </div>
  );
}
