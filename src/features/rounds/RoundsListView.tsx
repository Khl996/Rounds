import React, { useState, useMemo } from 'react';
import { Round, RoundType } from '../../types';
import {
  formatDateArabic,
  formatTimeArabic,
  calculateDurationString,
  getRoundTypeLabel,
} from '../../utils/formatters';
import {
  Filter,
  User,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  ChevronDown,
  ChevronUp,
  X,
  PlayCircle,
} from 'lucide-react';

interface RoundsListViewProps {
  rounds: Round[];
  loading: boolean;
  onSelectRound: (round: Round) => void;
  onStartRoundClick: () => void;
}

export const RoundsListView: React.FC<RoundsListViewProps> = ({
  rounds,
  loading,
  onSelectRound,
  onStartRoundClick,
}) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [filterSupervisor, setFilterSupervisor] = useState<string>('');
  const [filterDateFrom, setFilterDateFrom] = useState<string>('');
  const [filterDateTo, setFilterDateTo] = useState<string>('');
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);

  // Extract unique supervisors list
  const uniqueSupervisors = useMemo(() => {
    const names = new Set<string>();
    rounds.forEach((r) => {
      if (r.supervisorName) names.add(r.supervisorName);
    });
    return Array.from(names);
  }, [rounds]);

  // Filter logic
  const filteredRounds = useMemo(() => {
    return rounds.filter((r) => {
      if (filterType !== 'all' && r.type !== filterType) return false;
      if (filterSupervisor && r.supervisorName !== filterSupervisor) return false;

      if (filterDateFrom || filterDateTo) {
        let rDate: Date | null = null;
        if (r.startedAt && typeof (r.startedAt as any).toDate === 'function') {
          rDate = (r.startedAt as any).toDate();
        } else if (r.startedAt) {
          rDate = new Date(r.startedAt as any);
        }

        if (rDate) {
          const dateStr = rDate.toISOString().split('T')[0];
          if (filterDateFrom && dateStr < filterDateFrom) return false;
          if (filterDateTo && dateStr > filterDateTo) return false;
        }
      }

      return true;
    });
  }, [rounds, filterType, filterSupervisor, filterDateFrom, filterDateTo]);

  const hasActiveFilters =
    filterType !== 'all' || filterSupervisor !== '' || filterDateFrom !== '' || filterDateTo !== '';

  const clearFilters = () => {
    setFilterType('all');
    setFilterSupervisor('');
    setFilterDateFrom('');
    setFilterDateTo('');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 pb-24">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900">سجل الجولات الإشرافية</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            عرض وتصفح وتصدير كافة الجولات الميدانية المعتمدة
          </p>
        </div>

        <button
          onClick={onStartRoundClick}
          className="py-2.5 px-4 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <PlayCircle className="w-4 h-4" />
          <span>بدء جولة جديدة</span>
        </button>
      </div>

      {/* Filter Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs mb-6 overflow-hidden">
        <div className="p-3 sm:p-4 flex items-center justify-between border-b border-slate-100 sm:border-none">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-sky-600" />
            <span className="text-xs font-bold text-slate-800">تصفية وبحث الجولات</span>
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-sky-500"></span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-[11px] text-rose-600 hover:underline flex items-center gap-0.5"
              >
                <X className="w-3 h-3" />
                <span>إعادة ضبط</span>
              </button>
            )}
            <button
              onClick={() => setShowFiltersMobile(!showFiltersMobile)}
              className="sm:hidden text-xs text-slate-500 p-1 flex items-center gap-1"
            >
              <span>{showFiltersMobile ? 'إخفاء' : 'عرض الخيارات'}</span>
              {showFiltersMobile ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Filters Form */}
        <div
          className={`p-4 pt-0 sm:pt-2 border-t border-slate-100 sm:border-none ${
            showFiltersMobile ? 'block' : 'hidden sm:block'
          }`}
        >
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            {/* Type */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">نوع الجولة</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-sky-500"
              >
                <option value="all">كافة الأنواع</option>
                <option value="maintenance">صيانة</option>
                <option value="cleaning">نظافة</option>
              </select>
            </div>

            {/* Supervisor */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">المشرف المسؤول</label>
              <select
                value={filterSupervisor}
                onChange={(e) => setFilterSupervisor(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-sky-500"
              >
                <option value="">كافة المشرفين</option>
                {uniqueSupervisors.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>

            {/* From Date */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">من تاريخ</label>
              <input
                type="date"
                value={filterDateFrom}
                onChange={(e) => setFilterDateFrom(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>

            {/* To Date */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">إلى تاريخ</label>
              <input
                type="date"
                value={filterDateTo}
                onChange={(e) => setFilterDateTo(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Rounds List */}
      <div>
        {loading ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
            <p className="text-xs text-slate-500 font-semibold animate-pulse">جاري تحميل الجولات...</p>
          </div>
        ) : filteredRounds.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-300">
            <p className="text-sm font-bold text-slate-700">لا توجد جولات مطابقة للبحث.</p>
            <p className="text-xs text-slate-500 mt-1">
              ابدأ جولة جديدة أو قم بتغيير معايير التصفية.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredRounds.map((round) => {
              const isInProgress = round.status === 'in_progress';
              const openCount = round.openCount || 0;
              const resolvedCount = round.resolvedCount || 0;
              const totalCount = round.observationCount || 0;

              return (
                <div
                  key={round.id}
                  onClick={() => onSelectRound(round)}
                  className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs hover:border-slate-300 hover:shadow-xs transition-all cursor-pointer group"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-lg text-xs font-bold ${
                          round.type === 'maintenance'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-cyan-50 text-cyan-700 border border-cyan-200'
                        }`}
                      >
                        {getRoundTypeLabel(round.type)}
                      </span>
                      <span className="text-xs font-mono text-slate-400 font-bold">
                        #{round.id.slice(0, 5).toUpperCase()}
                      </span>
                      {isInProgress ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                          <span>قيد التنفيذ</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-50 text-sky-800 border border-sky-200">
                          <CheckCircle2 className="w-3 h-3 text-sky-600" />
                          <span>مكتملة</span>
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{formatDateArabic(round.startedAt)}</span>
                    </div>
                  </div>

                  {/* Body Info */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 py-2 text-xs border-y border-slate-100 my-2">
                    <div>
                      <span className="text-slate-400 text-[11px] block">المشرف:</span>
                      <span className="font-bold text-slate-800">{round.supervisorName}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">وقت البدء - الانتهاء:</span>
                      <span className="font-bold text-slate-800">
                        {formatTimeArabic(round.startedAt)} -{' '}
                        {round.completedAt ? formatTimeArabic(round.completedAt) : '...'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">المدة:</span>
                      <span className="font-extrabold text-sky-800">
                        {calculateDurationString(round.startedAt, round.completedAt)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">إجمالي الملاحظات:</span>
                      <span className="font-black text-slate-900">{totalCount} ملاحظة</span>
                    </div>
                  </div>

                  {/* Summary / Footer Counts */}
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-2 text-xs">
                      {openCount > 0 ? (
                        <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 font-bold border border-amber-200 text-[11px]">
                          {openCount} مفتوحة
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md bg-slate-50 text-slate-500 text-[11px]">
                          0 مفتوحة
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded-md bg-sky-50 text-sky-800 font-bold border border-sky-200 text-[11px]">
                        {resolvedCount} معالجة
                      </span>
                    </div>

                    <span className="text-xs text-sky-700 font-bold group-hover:underline flex items-center gap-1">
                      <span>عرض التقرير وتصدير PDF</span>
                      <span>←</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
