import React, { useState, useMemo } from 'react';
import { Observation } from '../../types';
import { useMasterData } from '../../hooks/useMasterData';
import { formatTimeArabic } from '../../utils/formatters';
import { Filter, X } from 'lucide-react';

interface ObservationsListViewProps {
  observations: Observation[];
  loading: boolean;
  onSelectObservation: (obs: Observation) => void;
}

export const ObservationsListView: React.FC<ObservationsListViewProps> = ({
  observations,
  loading,
  onSelectObservation,
}) => {
  const { locations, categories } = useMasterData();

  // Default tab: 'open'
  const [statusTab, setStatusTab] = useState<'open' | 'resolved' | 'all'>('open');
  const [showFilters, setShowFilters] = useState(false);
  const [filterLocation, setFilterLocation] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [filterDate, setFilterDate] = useState<string>('');

  const openCount = useMemo(
    () => observations.filter((o) => o.status === 'open').length,
    [observations]
  );
  const resolvedCount = useMemo(
    () => observations.filter((o) => o.status === 'resolved').length,
    [observations]
  );

  const filteredObservations = useMemo(() => {
    return observations.filter((obs) => {
      // 1. Status Filter
      if (statusTab === 'open' && obs.status !== 'open') return false;
      if (statusTab === 'resolved' && obs.status !== 'resolved') return false;

      // 2. Location Filter
      if (filterLocation && obs.locationId !== filterLocation) return false;

      // 3. Category Filter
      if (filterCategory && obs.categoryId !== filterCategory) return false;

      // 4. Date Filter
      if (filterDate) {
        let obsDate = '';
        if (obs.createdAt) {
          const d =
            typeof (obs.createdAt as any).toDate === 'function'
              ? (obs.createdAt as any).toDate()
              : new Date(obs.createdAt as any);
          obsDate = d.toISOString().slice(0, 10);
        }
        if (obsDate !== filterDate) return false;
      }

      return true;
    });
  }, [observations, statusTab, filterLocation, filterCategory, filterDate]);

  const hasActiveFilters = filterLocation || filterCategory || filterDate;

  const clearFilters = () => {
    setFilterLocation('');
    setFilterCategory('');
    setFilterDate('');
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-5 pb-24 space-y-4">
      {/* Top Header & Search/Filter Button */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900">الملاحظات</h1>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer border ${
            showFilters || hasActiveFilters
              ? 'bg-sky-50 text-sky-700 border-sky-300'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Filter className="w-3.5 h-3.5" />
          <span>تصفية</span>
          {hasActiveFilters && (
            <span className="w-2 h-2 rounded-full bg-sky-600"></span>
          )}
        </button>
      </div>

      {/* Three Top Tabs: مفتوحة / تمت المعالجة / الكل */}
      <div className="grid grid-cols-3 bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-600">
        <button
          onClick={() => setStatusTab('open')}
          className={`py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
            statusTab === 'open'
              ? 'bg-white text-amber-700 shadow-2xs font-bold'
              : 'hover:text-slate-900'
          }`}
        >
          <span>مفتوحة</span>
          <span className="text-[10px] bg-amber-50 text-amber-700 px-1.5 py-0.2 rounded-full">
            {openCount}
          </span>
        </button>

        <button
          onClick={() => setStatusTab('resolved')}
          className={`py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
            statusTab === 'resolved'
              ? 'bg-white text-emerald-700 shadow-2xs font-bold'
              : 'hover:text-slate-900'
          }`}
        >
          <span>تمت المعالجة</span>
          <span className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.2 rounded-full">
            {resolvedCount}
          </span>
        </button>

        <button
          onClick={() => setStatusTab('all')}
          className={`py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
            statusTab === 'all'
              ? 'bg-white text-slate-900 shadow-2xs font-bold'
              : 'hover:text-slate-900'
          }`}
        >
          <span>الكل</span>
          <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded-full">
            {observations.length}
          </span>
        </button>
      </div>

      {/* Optional Filters Panel */}
      {showFilters && (
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3 text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="font-bold text-slate-700">خيارات التصفية</span>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-sky-600 hover:text-sky-800 text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
              >
                <X className="w-3 h-3" />
                <span>إعادة ضبط</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {/* الموقع */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                الموقع
              </label>
              <select
                value={filterLocation}
                onChange={(e) => setFilterLocation(e.target.value)}
                className="w-full px-2.5 py-2 rounded-lg border border-slate-200 text-xs bg-white"
              >
                <option value="">كافة المواقع</option>
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>

            {/* التصنيف */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                التصنيف
              </label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full px-2.5 py-2 rounded-lg border border-slate-200 text-xs bg-white"
              >
                <option value="">كافة التصنيفات</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* التاريخ */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                التاريخ
              </label>
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="w-full px-2.5 py-2 rounded-lg border border-slate-200 text-xs bg-white"
              />
            </div>
          </div>
        </div>
      )}

      {/* Observation Cards List */}
      <div className="space-y-2.5">
        {loading ? (
          <div className="text-center py-10 text-xs text-slate-400">
            جاري تحميل الملاحظات...
          </div>
        ) : filteredObservations.length === 0 ? (
          <div className="bg-white p-8 rounded-xl border border-dashed border-slate-200 text-center text-slate-400 text-xs">
            لا توجد ملاحظات تطابق الاختيار.
          </div>
        ) : (
          filteredObservations.map((obs) => {
            const isOpen = obs.status === 'open';
            return (
              <div
                key={obs.id}
                onClick={() => onSelectObservation(obs)}
                className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs hover:border-slate-300 transition-colors cursor-pointer space-y-1.5"
              >
                {/* كهرباء */}
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-sky-700">
                    {obs.categoryName}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                      isOpen
                        ? 'bg-amber-50 text-amber-800 border border-amber-200'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}
                  >
                    {isOpen ? 'مفتوحة' : 'تمت المعالجة'}
                  </span>
                </div>

                {/* لمبة الممر أمام غرفة 12 لا تعمل */}
                <p className="text-sm text-slate-900 leading-snug">
                  {obs.description}
                </p>

                {/* العيادات الخارجية • 09:35 • خالد */}
                <div className="flex items-center gap-2 text-[11px] text-slate-500 pt-1 border-t border-slate-50">
                  <span>{obs.locationName}</span>
                  <span>•</span>
                  <span>{formatTimeArabic(obs.createdAt)}</span>
                  <span>•</span>
                  <span>{obs.createdByName}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
