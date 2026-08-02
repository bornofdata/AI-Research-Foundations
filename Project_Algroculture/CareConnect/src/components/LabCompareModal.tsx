import React, { useState, useMemo } from 'react';
import { X, GitCompare, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { LabReport, TestParameter } from '../types';

interface LabCompareModalProps {
  isOpen: boolean;
  onClose: () => void;
  labReports: LabReport[];
}

type TrendDirection = 'up' | 'down' | 'same' | 'none';
type TrendColor = 'green' | 'red' | 'amber';

function getStatusColor(status: TestParameter['status']): string {
  switch (status) {
    case 'optimal':
      return 'text-emerald-600 bg-emerald-50';
    case 'normal':
      return 'text-primary bg-primary-fixed';
    case 'review':
      return 'text-amber-600 bg-amber-50';
    case 'high':
    case 'low':
      return 'text-error bg-error-container/30';
    default:
      return 'text-on-surface-variant bg-surface-container';
  }
}

function isGoodStatus(status: TestParameter['status']): boolean {
  return status === 'optimal' || status === 'normal';
}

function isBadStatus(status: TestParameter['status']): boolean {
  return status === 'high' || status === 'low';
}

function getTrendColor(
  statusA: TestParameter['status'],
  statusB: TestParameter['status'],
): TrendColor {
  const aGood = isGoodStatus(statusA);
  const aBad = isBadStatus(statusA);
  const bGood = isGoodStatus(statusB);
  const bBad = isBadStatus(statusB);

  if (bGood && aBad) return 'green';
  if (bBad && aGood) return 'red';
  return 'amber';
}

function trendColorClass(color: TrendColor): string {
  switch (color) {
    case 'green':
      return 'text-emerald-600';
    case 'red':
      return 'text-error';
    case 'amber':
      return 'text-amber-600';
  }
}

interface ComparedParameter {
  name: string;
  paramA: TestParameter;
  paramB: TestParameter;
  direction: TrendDirection;
  trendColor: TrendColor;
}

export const LabCompareModal: React.FC<LabCompareModalProps> = ({
  isOpen,
  onClose,
  labReports,
}) => {
  const [reportAId, setReportAId] = useState<string>(labReports[0]?.id ?? '');
  const [reportBId, setReportBId] = useState<string>(labReports[1]?.id ?? labReports[0]?.id ?? '');

  const reportA = labReports.find((r) => r.id === reportAId) ?? null;
  const reportB = labReports.find((r) => r.id === reportBId) ?? null;

  const { sharedParams, onlyInA, onlyInB } = useMemo(() => {
    if (!reportA || !reportB) {
      return { sharedParams: [], onlyInA: [], onlyInB: [] };
    }

    const mapA = new Map<string, TestParameter>(reportA.parameters.map((p) => [p.name, p]));
    const mapB = new Map<string, TestParameter>(reportB.parameters.map((p) => [p.name, p]));

    const shared: ComparedParameter[] = [];
    const onlyA: TestParameter[] = [];
    const onlyBArr: TestParameter[] = [];

    for (const [name, paramA] of mapA.entries()) {
      const paramB = mapB.get(name);
      if (paramB) {
        const numA = parseFloat(String(paramA.value));
        const numB = parseFloat(String(paramB.value));
        let direction: TrendDirection = 'none';
        if (!isNaN(numA) && !isNaN(numB)) {
          if (numB > numA) direction = 'up';
          else if (numB < numA) direction = 'down';
          else direction = 'same';
        }
        const color = getTrendColor(paramA.status, paramB.status);
        shared.push({ name, paramA, paramB, direction, trendColor: color });
      } else {
        onlyA.push(paramA);
      }
    }

    for (const [name, paramB] of mapB.entries()) {
      if (!mapA.has(name)) {
        onlyBArr.push(paramB);
      }
    }

    return { sharedParams: shared, onlyInA: onlyA, onlyInB: onlyBArr };
  }, [reportA, reportB]);

  if (!isOpen) return null;

  const sameReport = reportAId === reportBId;
  const tooFewReports = labReports.length < 2;

  const optionLabel = (r: LabReport) => `${r.title} — ${r.shortDate}`;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-surface w-full max-w-2xl rounded-t-2xl sm:rounded-2xl border border-outline-variant shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant shrink-0">
          <div className="flex items-center gap-2">
            <GitCompare className="w-5 h-5 text-primary" />
            <h2 className="font-bold text-base text-on-surface">Compare Lab Reports</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-full transition-colors active:scale-90"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-5 py-5 space-y-5">
          {tooFewReports ? (
            <div className="text-center py-16 text-on-surface-variant">
              <GitCompare className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="font-semibold">You need at least 2 lab reports to compare.</p>
            </div>
          ) : (
            <>
              {/* Report selectors */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">
                    Report A
                  </label>
                  <select
                    value={reportAId}
                    onChange={(e) => setReportAId(e.target.value)}
                    className="w-full text-sm bg-surface-container border border-outline-variant rounded-xl px-3 py-2.5 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
                  >
                    {labReports.map((r) => (
                      <option key={r.id} value={r.id}>
                        {optionLabel(r)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">
                    Report B
                  </label>
                  <select
                    value={reportBId}
                    onChange={(e) => setReportBId(e.target.value)}
                    className="w-full text-sm bg-surface-container border border-outline-variant rounded-xl px-3 py-2.5 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
                  >
                    {labReports.map((r) => (
                      <option key={r.id} value={r.id}>
                        {optionLabel(r)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Same-report warning */}
              {sameReport && (
                <div className="flex items-center gap-2 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-sm">
                  <Minus className="w-4 h-4 shrink-0" />
                  Select two different reports to compare.
                </div>
              )}

              {/* Comparison table */}
              {!sameReport && sharedParams.length > 0 && (
                <div className="rounded-xl border border-outline-variant overflow-hidden">
                  {/* Column headers */}
                  <div className="grid grid-cols-[1fr_1fr_1fr_40px] gap-0 bg-surface-container-lowest px-4 py-2.5 border-b border-outline-variant">
                    <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">
                      Parameter
                    </span>
                    <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide text-center">
                      Report A
                    </span>
                    <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide text-center">
                      Report B
                    </span>
                    <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide text-center">
                      Trend
                    </span>
                  </div>
                  <div className="divide-y divide-outline-variant/50">
                    {sharedParams.map(({ name, paramA, paramB, direction, trendColor }) => (
                      <div
                        key={name}
                        className="grid grid-cols-[1fr_1fr_1fr_40px] gap-0 px-4 py-3 hover:bg-surface-container/40 transition-colors"
                      >
                        {/* Parameter name */}
                        <div className="flex items-center">
                          <span className="text-sm font-semibold text-on-surface">{name}</span>
                        </div>

                        {/* Report A value */}
                        <div className="flex flex-col items-center gap-1">
                          <span className="font-bold text-sm text-primary">
                            {paramA.value}
                            {paramA.unit ? (
                              <span className="text-xs font-normal text-on-surface-variant ml-0.5">
                                {paramA.unit}
                              </span>
                            ) : null}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${getStatusColor(
                              paramA.status,
                            )}`}
                          >
                            {paramA.statusLabel}
                          </span>
                        </div>

                        {/* Report B value */}
                        <div className="flex flex-col items-center gap-1">
                          <span className="font-bold text-sm text-primary">
                            {paramB.value}
                            {paramB.unit ? (
                              <span className="text-xs font-normal text-on-surface-variant ml-0.5">
                                {paramB.unit}
                              </span>
                            ) : null}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${getStatusColor(
                              paramB.status,
                            )}`}
                          >
                            {paramB.statusLabel}
                          </span>
                        </div>

                        {/* Trend indicator */}
                        <div className="flex items-center justify-center">
                          {direction === 'none' || direction === 'same' ? (
                            <Minus className="w-4 h-4 text-on-surface-variant" />
                          ) : direction === 'up' ? (
                            <ArrowUp
                              className={`w-4 h-4 font-bold ${trendColorClass(trendColor)}`}
                            />
                          ) : (
                            <ArrowDown
                              className={`w-4 h-4 font-bold ${trendColorClass(trendColor)}`}
                            />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* No shared parameters */}
              {!sameReport && sharedParams.length === 0 && (
                <div className="text-center py-8 text-on-surface-variant text-sm">
                  No shared parameters found between these two reports.
                </div>
              )}

              {/* Parameters only in one report */}
              {!sameReport && (onlyInA.length > 0 || onlyInB.length > 0) && (
                <div className="space-y-3">
                  {onlyInA.length > 0 && reportA && (
                    <div>
                      <p className="text-xs font-semibold text-on-surface-variant mb-2">
                        Only in {reportA.title} ({reportA.shortDate})
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {onlyInA.map((p) => (
                          <span
                            key={p.id}
                            className="text-xs px-2.5 py-1 bg-surface-container rounded-full text-on-surface-variant border border-outline-variant"
                          >
                            {p.name} — {p.value} {p.unit}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {onlyInB.length > 0 && reportB && (
                    <div>
                      <p className="text-xs font-semibold text-on-surface-variant mb-2">
                        Only in {reportB.title} ({reportB.shortDate})
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {onlyInB.map((p) => (
                          <span
                            key={p.id}
                            className="text-xs px-2.5 py-1 bg-surface-container rounded-full text-on-surface-variant border border-outline-variant"
                          >
                            {p.name} — {p.value} {p.unit}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Legend */}
              {!sameReport && sharedParams.length > 0 && (
                <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-on-surface-variant">
                  <span className="font-semibold">Trend key:</span>
                  <span className="flex items-center gap-1">
                    <ArrowUp className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Improvement</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <ArrowDown className="w-3.5 h-3.5 text-error" />
                    <span className="text-error">Decline</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <ArrowUp className="w-3.5 h-3.5 text-amber-600" />
                    <ArrowDown className="w-3.5 h-3.5 text-amber-600" />
                    <span className="text-amber-700">Ambiguous change</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Minus className="w-3.5 h-3.5" />
                    No change / non-numeric
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
