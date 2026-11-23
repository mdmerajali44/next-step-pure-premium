import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Shield, Check } from 'lucide-react';
import {
  PERMISSION_SECTIONS,
  getDefaultAllPermissions,
  getSectionOptionCounts,
} from './permissionsConfig';
import { toBn } from './adminUtils';

interface GranularPermissionsSelectorProps {
  permissions: string[];
  onChange: (nextPermissions: string[]) => void;
  title?: string;
  subtitle?: string;
}

export default function GranularPermissionsSelector({
  permissions,
  onChange,
  title = 'সেকশন ও অপশনভিত্তিক অ্যাডমিন পারমিশন',
  subtitle = 'প্রতিটি সেকশনে ক্লিক করে ভিতরের কোন কোন অপশন অ্যাক্সেস করতে পারবেন তা আলাদাভাবে নির্ধারণ করুন:',
}: GranularPermissionsSelectorProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(() => {
    // Expand sections that are partially selected by default so admin notices partial rules immediately
    const initial: Record<string, boolean> = {};
    PERMISSION_SECTIONS.forEach((sec) => {
      const { enabled, total } = getSectionOptionCounts(permissions, sec.id);
      if (enabled > 0 && enabled < total) {
        initial[sec.id] = true;
      }
    });
    return initial;
  });

  const toggleExpand = (secId: string) => {
    setExpandedSections((prev) => ({ ...prev, [secId]: !prev[secId] }));
  };

  const toggleSection = (secId: string) => {
    const sec = PERMISSION_SECTIONS.find((s) => s.id === secId);
    if (!sec) return;
    const { enabled } = getSectionOptionCounts(permissions, secId);
    const cleaned = permissions.filter((p) => p !== secId && !p.startsWith(secId + ':'));
    if (enabled > 0) {
      // Turn OFF entire section and all its options
      onChange(cleaned);
    } else {
      // Turn ON section + all its options
      onChange([...cleaned, secId, ...sec.options.map((o) => o.id)]);
    }
  };

  const toggleOption = (secId: string, fullOptionId: string) => {
    const sec = PERMISSION_SECTIONS.find((s) => s.id === secId);
    if (!sec) return;

    // Ensure legacy section without granular keys expands first before toggling one option
    const hasGranular = permissions.some((p) => p.startsWith(secId + ':'));
    let currentSectionOpts: string[];
    if (hasGranular) {
      currentSectionOpts = sec.options.filter((o) => permissions.includes(o.id)).map((o) => o.id);
    } else if (permissions.includes(secId)) {
      currentSectionOpts = sec.options.map((o) => o.id);
    } else {
      currentSectionOpts = [];
    }

    const exists = currentSectionOpts.includes(fullOptionId);
    const nextSectionOpts = exists
      ? currentSectionOpts.filter((id) => id !== fullOptionId)
      : [...currentSectionOpts, fullOptionId];

    const withoutSection = permissions.filter((p) => p !== secId && !p.startsWith(secId + ':'));
    if (nextSectionOpts.length > 0) {
      onChange([...withoutSection, secId, ...nextSectionOpts]);
    } else {
      onChange(withoutSection);
    }
  };

  const totalOptions = PERMISSION_SECTIONS.reduce((sum, s) => sum + s.options.length, 0);
  const totalEnabledOptions = PERMISSION_SECTIONS.reduce(
    (sum, s) => sum + getSectionOptionCounts(permissions, s.id).enabled,
    0
  );
  const totalEnabledSections = PERMISSION_SECTIONS.filter(
    (s) => getSectionOptionCounts(permissions, s.id).enabled > 0
  ).length;

  return (
    <div className="p-4 bg-slate-50 border border-slate-200/90 rounded-2xl space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
        <div className="flex items-center gap-1.5">
          <Shield className="w-4 h-4 text-[#006437] shrink-0" />
          <span className="font-extrabold text-xs text-gray-800">{title}</span>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-bold text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded-md tabular-nums">
            {toBn(totalEnabledSections)}/{toBn(PERMISSION_SECTIONS.length)} সেকশন · {toBn(totalEnabledOptions)}/{toBn(totalOptions)} অপশন
          </span>
          <button
            type="button"
            onClick={() => onChange(getDefaultAllPermissions())}
            className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-md cursor-pointer transition-colors"
          >
            সব দিন
          </button>
          <button
            type="button"
            onClick={() => onChange([])}
            className="text-[10px] font-extrabold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2 py-0.5 rounded-md cursor-pointer transition-colors"
          >
            সব বাতিল
          </button>
        </div>
      </div>

      <p className="text-[10px] text-gray-500 font-semibold leading-normal">{subtitle}</p>

      <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
        {PERMISSION_SECTIONS.map((sec) => {
          const { enabled, total } = getSectionOptionCounts(permissions, sec.id);
          const isAllChecked = enabled === total && total > 0;
          const isPartial = enabled > 0 && enabled < total;
          const isExpanded = Boolean(expandedSections[sec.id]);
          const hasGranular = permissions.some((p) => p.startsWith(sec.id + ':'));

          return (
            <div
              key={sec.id}
              className={`rounded-xl border transition-colors overflow-hidden ${
                enabled > 0 ? 'bg-white border-emerald-200/80' : 'bg-white/70 border-slate-200'
              }`}
            >
              {/* Parent Section Row */}
              <div className="flex items-center justify-between gap-2 p-2.5">
                <div className="flex items-start gap-2.5 flex-1 min-w-0">
                  <button
                    type="button"
                    onClick={() => toggleSection(sec.id)}
                    aria-label={`${sec.name} সেকশন টগল`}
                    className={`mt-0.5 w-4 h-4 rounded flex items-center justify-center border shrink-0 cursor-pointer transition-colors ${
                      isAllChecked
                        ? 'bg-[#006437] border-[#006437] text-white'
                        : isPartial
                        ? 'bg-amber-500 border-amber-500 text-white'
                        : 'bg-white border-slate-300 hover:border-slate-400'
                    }`}
                  >
                    {isAllChecked ? (
                      <Check className="w-3 h-3 stroke-[3]" />
                    ) : isPartial ? (
                      <span className="w-2 h-0.5 bg-white rounded-full" />
                    ) : null}
                  </button>
                  <div
                    onClick={() => toggleExpand(sec.id)}
                    className="flex-1 min-w-0 cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-extrabold text-gray-800">{sec.name}</span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.2 rounded tabular-nums ${
                          isAllChecked
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : isPartial
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-slate-100 text-slate-500 border border-slate-200'
                        }`}
                      >
                        {toBn(enabled)}/{toBn(total)} অপশন
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-400 leading-snug mt-0.5">{sec.desc}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => toggleExpand(sec.id)}
                  className="px-2 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[10px] font-bold text-slate-600 flex items-center gap-1 shrink-0 cursor-pointer transition-colors"
                >
                  <span>অপশন</span>
                  {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Sub-options */}
              {isExpanded && (
                <div className="px-3 pb-3 pt-2 border-t border-slate-100 bg-slate-50/70 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {sec.options.map((opt) => {
                    const isOptChecked = hasGranular
                      ? permissions.includes(opt.id)
                      : permissions.includes(sec.id);

                    return (
                      <label
                        key={opt.id}
                        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold cursor-pointer transition-colors select-none ${
                          isOptChecked
                            ? 'bg-white border-emerald-200 text-slate-800'
                            : 'bg-white/50 border-slate-200/70 text-slate-400 hover:text-slate-600'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isOptChecked}
                          onChange={() => toggleOption(sec.id, opt.id)}
                          className="rounded text-[#006437] focus:ring-[#006437] cursor-pointer w-3.5 h-3.5 shrink-0"
                        />
                        <span className="truncate">{opt.name}</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
