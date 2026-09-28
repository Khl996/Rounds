import React, { useState, useMemo } from 'react';
import { Observation } from '../../types';
import { useMasterData } from '../../hooks/useMasterData';
import {
  formatDateArabic,
  formatTimeArabic,
} from '../../utils/formatters';
import {
  AlertCircle,
  CheckCircle2,
  Filter,
  MapPin,
  Tag,
  User,
  Calendar,
  X,
  Search,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

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

  const [statusTab, setStatusTab] = useState<'all' | 'open' | 'resolved'>('all');
  const [filterLocation, setFilterLocation] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [filterSupervisor, setFilterSupervisor] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);

  // Extract unique supervisors
  const uniqueSupervisors = useMemo(() => {
    const names = new Set<string>();
    observations.forEach((o) => {
      if (o.createdByName) names.add(o.createdByName);
    });
    return Array.from(names);
  }, [observations]);

  // Filtered observations
  const filteredObservations = useMemo(() => {
    return observations.filter((obs) => {
      if (statusTab === 'open' && obs.status !== 'open') return false;
      if (statusTab === 'resolved' && obs.status !== 'resolved') return false;
      if (filterLocation && obs.locationId !== filterLocation) return false;
      if (filterCategory && obs.categoryId !== filterCategory) return false;
      if (filterSupervisor && obs.createdByName !== filterSupervisor) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const text = `${obs.description} ${obs.locationName} ${obs.categoryName} ${obs.actionTaken || ''}`.toLowerCase();
        if (!text.includes(query)) return false;
      }
      return true;
    });
  }, [
    observations,
    statusTab,
    filterLocation,
    filterCategory,
    filterSupervisor,
    searchQuery,
  ]);

  const openCount = observations.filter((o) => o.status === 'open').length;
  const resolvedCount = observations.filter((o) => o.status === 'resolved').length;

  const hasExtraFilters =
    filterLocation !== '' || filterCategory !== '' || filterSupervisor !== '' || searchQuery !== '';

  const clearFilters = () => {
    setFilterLocation('');
    setFilterCategory('');
    setFilterSupervisor('');
    setSearchQuery('');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 pb-24">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900">سجل الملاحظات الميدانية</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            متابعة الملاحظات الحية في جميع المرافق ومعالجتها وتوثيق دورة حياتها
          </p>
        </div>
      </div>

      {/* Tabs Bar: الكل / المفتوحة / تمت المعالجة */}
      <div className="flex bg-slate-200/70 p-1 rounded-2xl mb-4 text-xs font-bold">
        <button
          onClick={() => setStatusTab('all')}
          className={`flex-1 py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            statusTab === 'all'
              ? 'bg-white text-slate-900 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>الكل</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-600">
            {observations.length}
          </span>
        </button>

        <button
          onClick={() => setStatusTab('open')}
          className={`flex-1 py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            statusTab === 'open'
              ? 'bg-white text-amber-900 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-amber-500"></span>
          <span>المفتوحة</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-100 text-amber-900">
            {openCount}
          </span>
        </button>

        <button
          onClick={() => setStatusTab('resolved')}
          className={`flex-1 py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            statusTab === 'resolved'
              ? 'bg-white text-sky-900 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-sky-500"></span>
          <span>تمت المعالجة</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-sky-100 text-sky-900">
            {resolvedCount}
          </span>
        </button>
      </div>

      {/* Search & Filter Controls */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs mb-6 overflow-hidden">
        <div className="p-3 sm:p-4 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 sm:border-none">
          {/* Search box */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث في الملاحظة، الموقع، أو الإجراء..."
              className="w-full pr-9 pl-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute left-2.5 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {hasExtraFilters && (
              <button
                onClick={clearFilters}
                className="text-[11px] text-rose-600 hover:underline flex items-center gap-0.5"
              >
                <X className="w-3 h-3" />
                <span>مسح التصفية</span>
              </button>
            )}
            <button
              onClick={() => setShowFiltersMobile(!showFiltersMobile)}
              className="sm:hidden text-xs text-slate-600 p-1.5 bg-slate-100 rounded-lg flex items-center gap-1"
            >
              <Filter className="w-3.5 h-3.5" />
              <span>فلاتر</span>
            </button>
          </div>
        </div>

        {/* Filters Grid */}
        <div
          className={`p-4 pt-0 sm:pt-2 border-t border-slate-100 sm:border-none ${
            showFiltersMobile ? 'block' : 'hidden sm:block'
          }`}
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Location */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">الموقع الميداني</label>
              <select
                value={filterLocation}
                onChange={(e) => setFilterLocation(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-sky-500"
              >
                <option value="">كافة المواقع</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">التصنيف</label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-sky-500"
              >
                <option value="">كافة التصنيفات</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Supervisor */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">المشرف المسجّل</label>
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
          </div>
        </div>
      </div>

      {/* Observations Cards List */}
      <div>
        {loading ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
            <p className="text-xs text-slate-500 font-semibold animate-pulse">جاري تحميل الملاحظات...</p>
          </div>
        ) : filteredObservations.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-300">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <AlertCircle className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-700">لا توجد ملاحظات مطابقة.</p>
            <p className="text-xs text-slate-500 mt-1">
              {statusTab === 'open'
                ? 'لا توجد ملاحظات مفتوحة حاليًا. جميع الملاحظات معالجة بنجاح!'
                : 'جرب تعديل خيارات التصفية أو البحث.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredObservations.map((obs) => {
              const isOpen = obs.status === 'open';

              return (
                <div
                  key={obs.id}
                  onClick={() => onSelectObservation(obs)}
                  className={`bg-white rounded-2xl border p-4 sm:p-5 shadow-2xs hover:shadow-xs transition-all cursor-pointer group ${
                    isOpen ? 'border-amber-200/80 hover:border-amber-300' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {/* Card Header Tag */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      {isOpen ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                          <span>مفتوحة</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-50 text-sky-800 border border-sky-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-sky-600" />
                          <span>تمت المعالجة</span>
                        </span>
                      )}

                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                        <Tag className="w-3 h-3 text-slate-400" />
                        {obs.categoryName}
                      </span>
                    </div>

                    <span className="text-[11px] text-slate-400">
                      {formatTimeArabic(obs.createdAt)}
                    </span>
                  </div>

                  {/* Main Description */}
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-relaxed mb-2.5">
                    {obs.description}
                  </h3>

                  {/* Action Taken if present */}
                  {obs.actionTaken && (
                    <div className="mb-3 p-2 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600">
                      <span className="font-bold text-slate-700">الإجراء الميداني: </span>
                      <span>{obs.actionTaken}</span>
                    </div>
                  )}

                  {/* Card Footer */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-slate-100 text-xs text-slate-500">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex items-center gap-1 font-semibold text-slate-700">
                        <MapPin className="w-3.5 h-3.5 text-sky-600" />
                        {obs.locationName}
                      </span>
                      <span>•</span>
                      <span className="inline-flex items-center gap-1">
                        <User className="w-3 h-3 text-slate-400" />
                        {obs.createdByName}
                      </span>
                      <span>•</span>
                      <span>{formatDateArabic(obs.createdAt)}</span>
                    </div>

                    {!isOpen && obs.resolvedByName ? (
                      <span className="text-sky-700 font-bold text-[11px]">
                        عولجت بواسطة {obs.resolvedByName}
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[11px] group-hover:text-sky-700 transition-colors font-bold">
                        متابعة وتحديث ←
                      </span>
                    )}
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
