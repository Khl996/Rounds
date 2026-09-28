import React from 'react';
import { Round, Observation } from '../../types';
import {
  formatDateArabic,
  formatTimeArabic,
  formatDateTimeArabic,
  calculateDurationString,
  getRoundTypeLabel,
  generateReportFilename,
} from '../../utils/formatters';
import { Printer, Download, X, Building2, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';

interface RoundPdfReportProps {
  round: Round;
  observations: Observation[];
  isOpen: boolean;
  onClose: () => void;
}

export const RoundPdfReport: React.FC<RoundPdfReportProps> = ({
  round,
  observations,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const openCount = observations.filter((o) => o.status === 'open').length;
  const resolvedCount = observations.filter((o) => o.status === 'resolved').length;
  const generationTime = formatDateTimeArabic(new Date());

  const handlePrint = () => {
    const originalTitle = document.title;
    // Set document title to desired PDF filename so browser defaults to it on "Save as PDF"
    document.title = generateReportFilename(round.id, round.type, round.supervisorName, round.startedAt);
    window.print();
    setTimeout(() => {
      document.title = originalTitle;
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      {/* Container */}
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-300 overflow-hidden max-h-[96vh] flex flex-col">
        {/* Floating Action Header on screen (hidden in print) */}
        <div className="no-print px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="font-bold text-sm">معاينة التقرير الرسمي للجولة</h3>
              <p className="text-[11px] text-slate-400">جاهز للتصدير والطباعة بتنسيق A4 المعتمد</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="py-2 px-4 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>طباعة / حفظ كـ PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Paper Document (A4 Styling) */}
        <div className="overflow-y-auto p-4 sm:p-8 bg-slate-100/50 print:bg-white print:p-0">
          <div className="max-w-[210mm] mx-auto bg-white p-6 sm:p-10 border border-slate-200 print:border-none shadow-sm print:shadow-none min-h-[297mm] flex flex-col justify-between text-slate-900">
            <div>
              {/* Report Header */}
              <div className="border-b-2 border-slate-800 pb-4 mb-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-xl border-2 border-emerald-700 bg-emerald-50 text-emerald-800 flex items-center justify-center shadow-xs">
                      <Building2 className="w-8 h-8" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-500 tracking-wide block">
                        المملكة العربية السعودية • إدارة الصيانة والتشغيل
                      </span>
                      <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
                        تقرير جولة الصيانة الميدانية
                      </h1>
                      <p className="text-xs font-bold text-emerald-700 mt-0.5">
                        {getRoundTypeLabel(round.type)}
                      </p>
                    </div>
                  </div>

                  {/* Reference & Date Block */}
                  <div className="text-left text-xs space-y-1">
                    <div className="font-mono text-slate-600">
                      رقم الجولة:{' '}
                      <span className="font-bold text-slate-900">
                        ROUND-{round.id.slice(0, 6).toUpperCase()}
                      </span>
                    </div>
                    <div className="text-slate-600">
                      تاريخ التقرير:{' '}
                      <span className="font-bold text-slate-900">{formatDateArabic(round.startedAt)}</span>
                    </div>
                    <div className="text-slate-600">
                      حالة الجولة:{' '}
                      <span
                        className={`font-bold ${
                          round.status === 'completed' ? 'text-emerald-700' : 'text-amber-700'
                        }`}
                      >
                        {round.status === 'completed' ? 'جولة مكتملة ومعتمدة' : 'جولة قيد التنفيذ'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Round Metadata Grid */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-5 text-xs">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <span className="text-slate-500 block text-[11px] mb-0.5">المشرف المسؤول:</span>
                    <strong className="text-slate-900 font-bold text-sm">{round.supervisorName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px] mb-0.5">وقت بدء الجولة:</span>
                    <strong className="text-slate-900 font-bold">{formatTimeArabic(round.startedAt)}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px] mb-0.5">وقت انتهاء الجولة:</span>
                    <strong className="text-slate-900 font-bold">
                      {round.completedAt ? formatTimeArabic(round.completedAt) : 'قيد الإجراء'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px] mb-0.5">مدة الجولة المستغرقة:</span>
                    <strong className="text-slate-900 font-bold">
                      {calculateDurationString(round.startedAt, round.completedAt)}
                    </strong>
                  </div>
                </div>

                {round.summary && (
                  <div className="mt-3 pt-3 border-t border-slate-200 text-xs">
                    <span className="text-slate-500 font-bold block mb-1">ملخص وتوصيات الجولة:</span>
                    <p className="text-slate-800 leading-relaxed font-medium">{round.summary}</p>
                  </div>
                )}
              </div>

              {/* Statistics Strip */}
              <div className="grid grid-cols-3 gap-3 mb-5 text-center">
                <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50">
                  <span className="text-[11px] text-slate-500 font-semibold block">إجمالي الملاحظات</span>
                  <span className="text-lg font-black text-slate-900">{observations.length}</span>
                </div>
                <div className="p-2.5 rounded-lg border border-emerald-200 bg-emerald-50/50">
                  <span className="text-[11px] text-emerald-800 font-semibold block">تمت المعالجة</span>
                  <span className="text-lg font-black text-emerald-900">{resolvedCount}</span>
                </div>
                <div className="p-2.5 rounded-lg border border-amber-200 bg-amber-50/50">
                  <span className="text-[11px] text-amber-800 font-semibold block">مفتوحة للمتابعة</span>
                  <span className="text-lg font-black text-amber-900">{openCount}</span>
                </div>
              </div>

              {/* Table of Observations */}
              <div className="mb-6">
                <h3 className="text-xs font-bold text-slate-800 mb-2 border-r-2 border-emerald-600 pr-2">
                  جدول الملاحظات الميدانية المسجلة ({observations.length})
                </h3>

                {observations.length === 0 ? (
                  <div className="p-6 text-center border border-dashed border-slate-300 rounded-xl text-xs text-slate-500">
                    لم تسجل أي ملاحظات خلال هذه الجولة. المرافق بحالة ممتازة.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-right border-collapse border border-slate-300 text-xs">
                      <thead>
                        <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                          <th className="p-2 border border-slate-300 w-8 text-center">#</th>
                          <th className="p-2 border border-slate-300 w-32">الموقع</th>
                          <th className="p-2 border border-slate-300 w-24">التصنيف</th>
                          <th className="p-2 border border-slate-300">الملاحظة الميدانية</th>
                          <th className="p-2 border border-slate-300 w-36">الإجراء المتخذ</th>
                          <th className="p-2 border border-slate-300 w-28 text-center">الحالة</th>
                        </tr>
                      </thead>
                      <tbody>
                        {observations.map((obs, idx) => {
                          const isResolved = obs.status === 'resolved';
                          return (
                            <tr
                              key={obs.id}
                              className={`border-b border-slate-200 page-break-inside-avoid ${
                                idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'
                              }`}
                            >
                              <td className="p-2 border border-slate-300 text-center font-bold text-slate-600">
                                {obs.orderNumber || idx + 1}
                              </td>
                              <td className="p-2 border border-slate-300 font-bold text-slate-900">
                                {obs.locationName}
                              </td>
                              <td className="p-2 border border-slate-300 font-semibold text-slate-700">
                                {obs.categoryName}
                              </td>
                              <td className="p-2 border border-slate-300 text-slate-800 leading-relaxed">
                                {obs.description}
                              </td>
                              <td className="p-2 border border-slate-300 text-slate-600 text-[11px]">
                                {obs.actionTaken || '—'}
                              </td>
                              <td className="p-2 border border-slate-300 text-center">
                                {isResolved ? (
                                  <div className="text-emerald-800">
                                    <span className="font-bold text-[11px] block">تمت المعالجة</span>
                                    <span className="text-[10px] text-slate-500 block">
                                      بواسطة: {obs.resolvedByName || 'المشرف'}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="inline-block px-1.5 py-0.5 rounded text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200">
                                    مفتوحة
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Formal Approvals & Signatures Footer */}
            <div className="page-break-inside-avoid pt-6 mt-6 border-t-2 border-slate-800">
              <div className="grid grid-cols-2 gap-8 text-xs mb-8">
                <div className="border border-slate-300 rounded-xl p-3 bg-slate-50">
                  <span className="text-slate-500 block mb-1">المشرف الميداني القائم بالجولة:</span>
                  <div className="font-bold text-slate-900 text-sm mb-4">{round.supervisorName}</div>
                  <div className="flex items-center justify-between text-slate-400 text-[11px] pt-4 border-t border-dashed border-slate-300">
                    <span>التوقيع: ............................</span>
                    <span>التاريخ: {formatDateArabic(round.startedAt)}</span>
                  </div>
                </div>

                <div className="border border-slate-300 rounded-xl p-3 bg-slate-50">
                  <span className="text-slate-500 block mb-1">اعتماد مدير إدارة الصيانة والتشغيل:</span>
                  <div className="font-bold text-slate-900 text-sm mb-4">المهندس المسؤول / رئيس القسم</div>
                  <div className="flex items-center justify-between text-slate-400 text-[11px] pt-4 border-t border-dashed border-slate-300">
                    <span>الختم والاعتماد: ............................</span>
                    <span>التاريخ: ............................</span>
                  </div>
                </div>
              </div>

              {/* Bottom Copyright & Print Timestamp */}
              <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-slate-200">
                <span>تم إنشاء هذا التقرير آليًا بتاريخ {generationTime} - نظام جولات الصيانة</span>
                <span>الصفحة 1 من 1</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
