import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowRight, Printer } from 'lucide-react';
import { Observation, Round } from '../../types';
import { Button } from '../../components/ui/Button';
import { useBackClose } from '../../hooks/useBackClose';
import {
  formatDuration,
  formatNumericDate,
  formatTime,
  OBSERVATION_STATUS_LABEL,
  ROUND_STATUS_LABEL,
  ROUND_TYPE_LABEL,
  toDate,
} from '../../utils/formatters';
import { getRoundCode } from '../../utils/roundCode';
import './report.css';

// Optional branding for the printed header. The logo area is reserved even when empty.
const REPORT_LOGO_URL: string | null = null;
const REPORT_ORGANIZATION = '';

const PAPER_WIDTH_PX = (210 / 25.4) * 96;

interface RoundReportProps {
  round: Round;
  /** Oldest first. */
  observations: Observation[];
  onClose: () => void;
}

function cssString(value: string): string {
  return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

function sameDay(a: unknown, b: unknown): boolean {
  const da = toDate(a);
  const db = toDate(b);
  return !!da && !!db && da.toDateString() === db.toDateString();
}

export const RoundReport: React.FC<RoundReportProps> = ({ round, observations, onClose }) => {
  useBackClose(true, onClose);

  const scrollerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const generatedAt = useMemo(() => new Date(), []);

  const code = getRoundCode(round);
  const openCount = observations.filter((o) => o.status === 'open').length;
  const completed = round.status === 'completed';

  // Fit the A4 sheet to narrow screens.
  useLayoutEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const update = () => {
      const styles = getComputedStyle(el);
      const available = el.clientWidth - parseFloat(styles.paddingLeft) - parseFloat(styles.paddingRight);
      setScale(Math.min(1, available / PAPER_WIDTH_PX));
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  const print = async () => {
    await document.fonts?.ready;
    const previousTitle = document.title;
    // Browsers use the title as the suggested PDF file name.
    document.title = code;
    const restore = () => {
      document.title = previousTitle;
      window.removeEventListener('afterprint', restore);
    };
    window.addEventListener('afterprint', restore);
    window.print();
  };

  // Page footer, repeated on every printed page. The code is wrapped in LTR isolates so it stays
  // one unit inside the Arabic line.
  const footerStyle = `font-family: "IBM Plex Sans Arabic", sans-serif; font-size: 7.5pt; color: #64748b; direction: rtl; white-space: nowrap;`;
  const pageRules = `@page {
  @bottom-right { content: ${cssString(`رقم الجولة: ⁦${code}⁩`)}; ${footerStyle} }
  @bottom-center { content: ${cssString(`تاريخ إنشاء التقرير: ${formatNumericDate(generatedAt)} — ${formatTime(generatedAt)}`)}; ${footerStyle} }
  @bottom-left { content: "الصفحة " counter(page) " من " counter(pages); ${footerStyle} }
  @top-left { content: ""; }
  @top-center { content: ""; }
  @top-right { content: ""; }
}`;

  const meta: [string, React.ReactNode][] = [
    ['رقم الجولة', <span dir="ltr">{code}</span>],
    ['نوع الجولة', ROUND_TYPE_LABEL[round.type]],
    ['التاريخ', formatNumericDate(round.startedAt)],
    ['الحالة', ROUND_STATUS_LABEL[round.status]],
    ['المشرف', round.supervisorName],
    ['وقت البداية', formatTime(round.startedAt)],
    ['وقت النهاية', completed ? formatTime(round.completedAt) : '—'],
    ['المدة', completed ? formatDuration(round.startedAt, round.completedAt) : '—'],
  ];

  return createPortal(
    <div className="report-overlay fixed inset-0 z-50 flex flex-col bg-slate-100">
      <style>{pageRules}</style>

      <div className="no-print flex h-14 shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-white px-2 sm:px-4">
        <button
          type="button"
          onClick={onClose}
          className="flex h-11 cursor-pointer items-center gap-1.5 rounded-lg px-2 text-[15px] text-slate-600 hover:bg-slate-100"
        >
          <ArrowRight className="size-5" />
          رجوع
        </button>
        <Button size="sm" className="h-10 px-4" onClick={print}>
          <Printer className="size-4" />
          طباعة / PDF
        </Button>
      </div>

      <div ref={scrollerRef} className="report-scroller flex-1 overflow-auto px-3 py-4 sm:px-8 sm:py-8">
        <article className="report-paper" style={{ zoom: scale }} dir="rtl" lang="ar">
          <header className="rpt-header">
            <div>
              {REPORT_ORGANIZATION && <p className="rpt-org">{REPORT_ORGANIZATION}</p>}
              <h1 className="rpt-title">تقرير جولة إشرافية</h1>
            </div>
            <div className="rpt-logo">{REPORT_LOGO_URL && <img src={REPORT_LOGO_URL} alt="" />}</div>
          </header>

          <dl className="rpt-meta">
            {meta.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>

          <p className="rpt-counts">
            الملاحظات: {observations.length}
            <span className="sep">|</span>
            مفتوحة: {openCount}
            <span className="sep">|</span>
            مغلقة: {observations.length - openCount}
          </p>

          <table className="rpt-table">
            <colgroup>
              <col style={{ width: '8mm' }} />
              <col style={{ width: '30mm' }} />
              <col style={{ width: '19mm' }} />
              <col />
              <col style={{ width: '36mm' }} />
              <col style={{ width: '27mm' }} />
            </colgroup>
            <thead>
              <tr>
                <th className="num">م</th>
                <th>الموقع</th>
                <th>النوع</th>
                <th>الملاحظة</th>
                <th>الإجراء</th>
                <th>الحالة</th>
              </tr>
            </thead>
            <tbody>
              {observations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="empty">
                    لم تُسجَّل ملاحظات في هذه الجولة.
                  </td>
                </tr>
              ) : (
                observations.map((obs, index) => (
                  <tr key={obs.id}>
                    <td className="num">{index + 1}</td>
                    <td>{obs.locationName}</td>
                    <td>{obs.categoryName}</td>
                    <td>{obs.description}</td>
                    <td className={obs.actionTaken ? undefined : 'muted'}>{obs.actionTaken || '—'}</td>
                    <td>
                      <span className={`rpt-status ${obs.status}`}>{OBSERVATION_STATUS_LABEL[obs.status]}</span>
                      {obs.status === 'resolved' && (obs.resolvedByName || obs.resolvedAt) && (
                        <span className="rpt-resolution">
                          {obs.resolvedByName}
                          {obs.resolvedByName && obs.resolvedAt && <br />}
                          {obs.resolvedAt && (
                            <>
                              {!sameDay(obs.resolvedAt, round.startedAt) && `${formatNumericDate(obs.resolvedAt)} `}
                              {formatTime(obs.resolvedAt)}
                            </>
                          )}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {round.summary && (
            <section className="rpt-section">
              <h2>ملخص الجولة</h2>
              <p>{round.summary}</p>
            </section>
          )}

          <section className="rpt-signatures">
            <div>
              <p className="role">المشرف</p>
              <p className="name">{round.supervisorName}</p>
              <div className="line" />
              <p className="hint">التوقيع</p>
            </div>
            <div>
              <p className="role">{round.type === 'cleaning' ? 'مسؤول النظافة' : 'مسؤول الصيانة'}</p>
              <p className="name" />
              <div className="line" />
              <p className="hint">التوقيع</p>
            </div>
          </section>
        </article>
      </div>
    </div>,
    document.body
  );
};
