"use client";

import { ChevronLeft, ChevronRight, Loader2, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { SearchSummary } from "@/types";

interface SearchSubmitBarProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
  onClear: () => void;
  placeholder: string;
  isSearching?: boolean;
  /** Show the clear button even when the box is empty (a search is applied). */
  hasActiveSearch?: boolean;
  inputClassName?: string;
  onFocus?: () => void;
  onEscape?: () => void;
}

/**
 * Search box that only queries when the person presses Enter or clicks Search.
 * It is a plain container (not a <form>) so it also works inside other forms.
 */
export function SearchSubmitBar({
  value,
  onChange,
  onSearch,
  onClear,
  placeholder,
  isSearching = false,
  hasActiveSearch = false,
  inputClassName = "h-12",
  onFocus,
  onEscape,
}: SearchSubmitBarProps) {
  const showClear = Boolean(value) || hasActiveSearch;
  return (
    <div role="search" className="flex gap-2">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
        <Input
          type="text"
          enterKeyHint="search"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              // Stop a surrounding form (e.g. Create Shipment) from submitting.
              event.preventDefault();
              onSearch();
            } else if (event.key === "Escape") {
              onEscape?.();
            }
          }}
          onFocus={onFocus}
          placeholder={placeholder}
          aria-label={placeholder}
          className={`pl-10 ${showClear ? "pr-10" : ""} ${inputClassName}`}
        />
        {showClear && (
          <button
            type="button"
            onClick={onClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label="Clear search"
            title="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      <Button
        type="button"
        onClick={onSearch}
        disabled={isSearching}
        className={`bg-[#055b8e] px-5 text-white hover:bg-[#044a73] ${inputClassName}`}
      >
        {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
        <span className="ml-2 hidden sm:inline">Search</span>
      </Button>
    </div>
  );
}

/** One line under the search box describing what the last search found. */
export function SearchResultsSummary({
  summary,
  noun,
}: {
  summary?: SearchSummary | null;
  noun: { singular: string; plural: string };
}) {
  if (!summary) return null;
  const { term, exactCount, similarCount } = summary;
  const plural = (count: number) => (count === 1 ? noun.singular : noun.plural);
  if (!exactCount && !similarCount) return null;
  return (
    <p className="mt-3 text-sm text-gray-600" aria-live="polite">
      {exactCount > 0 ? (
        <>
          <span className="font-medium text-gray-800">
            {exactCount.toLocaleString()} {plural(exactCount)}
          </span>{" "}
          matching &ldquo;{term}&rdquo;
        </>
      ) : (
        <>No exact match for &ldquo;{term}&rdquo;</>
      )}
      {similarCount > 0 && (
        <>
          {exactCount > 0 ? " · plus " : ". Showing "}
          <span className="font-medium text-amber-700">
            {similarCount.toLocaleString()} similar {plural(similarCount)}
          </span>
          {exactCount > 0 ? "" : " that might be what you meant"}
        </>
      )}
    </p>
  );
}

export function SimilarMatchBadge() {
  return (
    <span
      className="ml-2 inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700"
      title="Not an exact match: the spelling is close to what you searched for"
    >
      Similar
    </span>
  );
}

/** Page numbers to show: always the first and last, plus a window around the current one. */
function visiblePages(current: number, total: number): Array<number | "gap"> {
  const pages = new Set<number>([1, total, current - 1, current, current + 1]);
  const sorted = Array.from(pages)
    .filter((page) => page >= 1 && page <= total)
    .sort((left, right) => left - right);
  const result: Array<number | "gap"> = [];
  sorted.forEach((page, index) => {
    if (index > 0 && page - sorted[index - 1] > 1) result.push("gap");
    result.push(page);
  });
  return result;
}

export function PaginationBar({
  currentPage,
  totalPages,
  onPageChange,
  label,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  label: string;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="border-t border-gray-200 px-6 py-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-gray-600">{label}</div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
            disabled={currentPage === 1}
            variant="outline"
            size="sm"
            className="flex items-center gap-1"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          {visiblePages(currentPage, totalPages).map((page, index) =>
            page === "gap" ? (
              <span key={`gap-${index}`} className="px-1 text-sm text-gray-400">
                …
              </span>
            ) : (
              <Button
                key={page}
                onClick={() => onPageChange(page)}
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                className={currentPage === page ? "bg-[#055b8e] hover:bg-[#044a73]" : ""}
              >
                {page}
              </Button>
            ),
          )}
          <Button
            onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
            disabled={currentPage === totalPages}
            variant="outline"
            size="sm"
            className="flex items-center gap-1"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
