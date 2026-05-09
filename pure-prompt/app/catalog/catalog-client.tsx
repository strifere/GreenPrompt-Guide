"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Search, X } from "lucide-react";
import type { PracticeListItem, SidebarData } from "@/domain/practice-repository";
import { catalogPracticeHref } from "./catalog-paths";

type FilterKey = keyof SidebarData;

type SidebarGroup = {
  key: FilterKey;
  title: string;
  items: string[];
};

type CatalogClientProps = Readonly<{
  practices: PracticeListItem[];
  sidebarData: SidebarData;
}>;

type FilterPanelProps = Readonly<{
  groups: SidebarGroup[];
  selectedFilters: Record<FilterKey, string[]>;
  onToggleFilter: (groupKey: FilterKey, item: string) => void;
}>;

type PracticeCardProps = Readonly<{
  practice: PracticeListItem;
  isAnimating?: boolean;
}>;

type SearchFiltersPanelProps = Readonly<{
  includeSourceInSearch: boolean;
  sourceYears: number[];
  sourceYear: string;
  createdFrom: string;
  createdTo: string;
  onIncludeSourceInSearchChange: (enabled: boolean) => void;
  onSourceYearChange: (value: string) => void;
  onCreatedFromChange: (value: string) => void;
  onCreatedToChange: (value: string) => void;
}>;

type ActiveFiltersDisplayProps = Readonly<{
  filters: Record<FilterKey, string[]>;
  onRemoveFilter: (groupKey: FilterKey, item: string) => void;
}>;

function unique(values: string[]) {
  return Array.from(new Set(values));
}

function uniqueNumbers(values: number[]) {
  return Array.from(new Set(values));
}

function hasIntersection(selectedItems: string[], values: string[]) {
  for (const selectedItem of selectedItems) {
    if (values.includes(selectedItem)) {
      return true;
    }
  }

  return false;
}

function practiceValues(practice: PracticeListItem): Record<FilterKey, string[]> {
  return {
    categories: unique(practice.categories.map((entry) => entry.category.name)),
    models: unique(practice.models.map((entry) => entry.model.name)),
    promptTechniques: unique(practice.prompts.map((entry) => entry.promptTechnique.name)),
    hyperparameters: unique(practice.hyperparameters.map((entry) => entry.name)),
    datasets: unique(
      practice.papers.flatMap((paper) =>
        paper.reference.datasets.map((entry) => entry.dataset.name),
      ),
    ),
  };
}

function practiceReferenceYears(practice: PracticeListItem) {
  return uniqueNumbers(practice.papers.map((paper) => paper.reference.year));
}

function practiceCreatedAtTimestamp(practice: PracticeListItem) {
  const value = new Date(practice.createdAt).getTime();
  return Number.isNaN(value) ? null : value;
}

function PracticeCard({ practice, isAnimating }: PracticeCardProps) {
  return (
    <Link 
      href={catalogPracticeHref(practice.name)} 
      className={`practice-card ${isAnimating ? "animate-in" : ""}`}
    >
      <header>
        <h2>{practice.name}</h2>
        <div className="tags" aria-label="Practice categories">
          {practice.categories.map((category) => (
            <span key={`${practice.name}-${category.category.name}`}>
              {category.category.name}
            </span>
          ))}
        </div>
      </header>
      <p>{practice.description}</p>
      <small>Extracted from: {practice.papers[0]?.reference.title ?? "Reference"}</small>
    </Link>
  );
}

function SearchFiltersPanel({
  includeSourceInSearch,
  sourceYears,
  sourceYear,
  createdFrom,
  createdTo,
  onIncludeSourceInSearchChange,
  onSourceYearChange,
  onCreatedFromChange,
  onCreatedToChange,
}: SearchFiltersPanelProps) {
  return (
    <section className="sidebar-search-filters" aria-label="Search filters">
      <h2>Search filters</h2>
      <label className="filter-option-label sidebar-search-toggle">
        <input
          type="checkbox"
          className="filter-option-input"
          checked={includeSourceInSearch}
          onChange={(event) => onIncludeSourceInSearchChange(event.target.checked)}
        />
        <span>Search by source reference title</span>
      </label>

      {includeSourceInSearch ? (
        <label className="sidebar-date-field">
          <span>Source year</span>
          <select value={sourceYear} onChange={(event) => onSourceYearChange(event.target.value)}>
            <option key="all-years" value="">
              All years
            </option>
            {sourceYears.map((year) => (
              <option key={year} value={String(year)}>
                {year}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      <div className="sidebar-date-fields">
        <label className="sidebar-date-field">
          <span>Created from</span>
          <input
            type="date"
            value={createdFrom}
            onChange={(event) => onCreatedFromChange(event.target.value)}
          />
        </label>
        <label className="sidebar-date-field">
          <span>Created to</span>
          <input type="date" value={createdTo} onChange={(event) => onCreatedToChange(event.target.value)} />
        </label>
      </div>
    </section>
  );
}

function FilterPanel({ groups, selectedFilters, onToggleFilter }: FilterPanelProps) {
  return (
    <>
      {groups.map((group) => (
        <details key={group.key} className="sidebar-mobile-group" open>
          <summary>{group.title}</summary>
          <ul>
            {group.items.map((item) => {
              const inputId = `${group.key}-${item}`;
              const checked = selectedFilters[group.key].includes(item);

              return (
                <li key={item} className="filter-option-item">
                  <label htmlFor={inputId} className="filter-option-label">
                    <input
                      id={inputId}
                      type="checkbox"
                      className="filter-option-input"
                      checked={checked}
                      onChange={() => onToggleFilter(group.key, item)}
                    />
                    <span>{item}</span>
                  </label>
                </li>
              );
            })}
          </ul>
        </details>
      ))}
    </>
  );
}

function ActiveFiltersDisplay({ filters, onRemoveFilter }: ActiveFiltersDisplayProps) {
  const activeFilterEntries: Array<[FilterKey, string]> = [];
  
  for (const [key, values] of Object.entries(filters) as Array<[FilterKey, string[]]>) {
    for (const value of values) {
      activeFilterEntries.push([key, value]);
    }
  }

  if (activeFilterEntries.length === 0) {
    return null;
  }

  // Format filter key for display (e.g., "promptTechniques" -> "Prompt Techniques")
  function formatFilterKey(key: FilterKey): string {
    const keyMap: Record<FilterKey, string> = {
      categories: "Category",
      models: "Model",
      promptTechniques: "Technique",
      hyperparameters: "Hyperparameter",
      datasets: "Dataset",
    };
    return keyMap[key];
  }

  return (
    <div className="active-filters">
      {activeFilterEntries.map(([key, value]) => (
        <div key={`${key}-${value}`} className="filter-tag">
          <span>
            {formatFilterKey(key)}: {value}
          </span>
          <button
            className="filter-tag-close"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onRemoveFilter(key, value);
            }}
            aria-label={`Remove ${formatFilterKey(key)} filter: ${value}`}
            type="button"
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}

export default function CatalogClient({ practices, sidebarData }: CatalogClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [includeSourceInSearch, setIncludeSourceInSearch] = useState(false);
  const [sourceYear, setSourceYear] = useState("");
  const [createdFrom, setCreatedFrom] = useState("");
  const [createdTo, setCreatedTo] = useState("");
  const [selectedFilters, setSelectedFilters] = useState<Record<FilterKey, string[]>>({
    categories: [],
    models: [],
    promptTechniques: [],
    hyperparameters: [],
    datasets: [],
  });
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const practiceListRef = useRef<HTMLDivElement>(null);
  const previousPracticeCountRef = useRef<number>(0);
  const sidebarDisclosureRef = useRef<HTMLDetailsElement>(null);
  const mobileInlineDisclosureRef = useRef<HTMLDetailsElement>(null);

  const sidebarGroups: SidebarGroup[] = useMemo(
    () => [
      { key: "categories", title: "Categories", items: sidebarData.categories },
      { key: "promptTechniques", title: "Prompt Techniques", items: sidebarData.promptTechniques },
      { key: "hyperparameters", title: "Hyperparameters", items: sidebarData.hyperparameters },
      { key: "models", title: "Models", items: sidebarData.models },
      { key: "datasets", title: "Datasets", items: sidebarData.datasets },
    ],
    [sidebarData],
  );

  const sourceYears = useMemo(
    () =>
      uniqueNumbers(practices.flatMap((practice) => practiceReferenceYears(practice))).sort(
        (left, right) => right - left,
      ),
    [practices],
  );

  function toggleFilter(groupKey: FilterKey, item: string) {
    setSelectedFilters((currentFilters) => {
      const groupFilters = currentFilters[groupKey];
      const isSelected = groupFilters.includes(item);

      return {
        ...currentFilters,
        [groupKey]: isSelected
          ? groupFilters.filter((entry) => entry !== item)
          : [...groupFilters, item],
      };
    });
  }

  function removeFilter(groupKey: FilterKey, item: string) {
    setSelectedFilters((currentFilters) => {
      const groupFilters = currentFilters[groupKey];
      return {
        ...currentFilters,
        [groupKey]: groupFilters.filter((entry) => entry !== item),
      };
    });
  }

  const filteredPractices = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();
    const createdFromTimestamp = createdFrom
      ? new Date(`${createdFrom}T00:00:00`).getTime()
      : null;
    const createdToTimestamp = createdTo
      ? new Date(`${createdTo}T23:59:59.999`).getTime()
      : null;

    const minCreatedTimestamp =
      createdFromTimestamp !== null && createdToTimestamp !== null
        ? Math.min(createdFromTimestamp, createdToTimestamp)
        : createdFromTimestamp;
    const maxCreatedTimestamp =
      createdFromTimestamp !== null && createdToTimestamp !== null
        ? Math.max(createdFromTimestamp, createdToTimestamp)
        : createdToTimestamp;
    const selectedSourceYearValue = sourceYear ? Number(sourceYear) : null;

    return practices.filter((practice) => {
      const values = practiceValues(practice);
      const referenceYears = practiceReferenceYears(practice);
      const createdAtTimestamp = practiceCreatedAtTimestamp(practice);

      const matchesNameOrDescription =
        practice.name.toLowerCase().includes(normalizedSearch) ||
        practice.description.toLowerCase().includes(normalizedSearch);
      const matchesSourceTitle =
        includeSourceInSearch &&
        practice.papers.some((paper) =>
          paper.reference.title.toLowerCase().includes(normalizedSearch),
        );
      const passesSearch =
        normalizedSearch.length === 0 || matchesNameOrDescription || matchesSourceTitle;

      const passesCreatedAtFrom =
        minCreatedTimestamp === null ||
        (createdAtTimestamp !== null && createdAtTimestamp >= minCreatedTimestamp);
      const passesCreatedAtTo =
        maxCreatedTimestamp === null ||
        (createdAtTimestamp !== null && createdAtTimestamp <= maxCreatedTimestamp);
      const passesSourceYear =
        !includeSourceInSearch ||
        selectedSourceYearValue === null ||
        referenceYears.includes(selectedSourceYearValue);

      if (!passesSearch || !passesCreatedAtFrom || !passesCreatedAtTo || !passesSourceYear) {
        return false;
      }

      for (const group of sidebarGroups) {
        const chosen = selectedFilters[group.key];

        if (chosen.length > 0 && !hasIntersection(chosen, values[group.key])) {
          return false;
        }
      }

      return true;
    });
  }, [
    practices,
    searchQuery,
    includeSourceInSearch,
    sourceYear,
    createdFrom,
    createdTo,
    selectedFilters,
    sidebarGroups,
  ]);

  // Handle scrolling when filtered practices change
  useEffect(() => {
    const currentCount = filteredPractices.length;
    
    // Only update if the count changed
    if (currentCount !== previousPracticeCountRef.current) {
      previousPracticeCountRef.current = currentCount;
      
      // Scroll to top smoothly
      if (practiceListRef.current && "scrollTo" in practiceListRef.current) {
        practiceListRef.current.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  }, [filteredPractices]);

  // Handle animation timing separately
  useEffect(() => {
    if (shouldAnimate) {
      const animationTimeout = setTimeout(() => {
        setShouldAnimate(false);
      }, 400);
      
      return () => clearTimeout(animationTimeout);
    }
  }, [shouldAnimate]);

  // Trigger animation when filter changes (separate from effect logic)
  const previousCountRef = useRef<number>(0);
  useEffect(() => {
    if (filteredPractices.length !== previousCountRef.current) {
      previousCountRef.current = filteredPractices.length;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShouldAnimate(true);
    }
  }, [filteredPractices]);

  // Close mobile filter panels when filters are applied
  useEffect(() => {
    
    if (mobileInlineDisclosureRef.current) {
      mobileInlineDisclosureRef.current.open = false;
    }
  }, [selectedFilters]);

  const totalSelectedFilters =
    selectedFilters.categories.length +
    selectedFilters.models.length +
    selectedFilters.promptTechniques.length +
    selectedFilters.hyperparameters.length +
    selectedFilters.datasets.length;

  return (
    <div className="layout-grid">
        <aside className="sidebar" aria-label="Practice filters">
          <details className="sidebar-mobile-disclosure sidebar-desktop-disclosure" open ref={sidebarDisclosureRef}>
            <summary className="sidebar-mobile-summary">
              Filters{totalSelectedFilters > 0 ? ` (${totalSelectedFilters})` : ""}
            </summary>
            <div className="sidebar-mobile-panel">
              <SearchFiltersPanel
                includeSourceInSearch={includeSourceInSearch}
                sourceYears={sourceYears}
                sourceYear={sourceYear}
                createdFrom={createdFrom}
                createdTo={createdTo}
                onIncludeSourceInSearchChange={setIncludeSourceInSearch}
                onSourceYearChange={setSourceYear}
                onCreatedFromChange={setCreatedFrom}
                onCreatedToChange={setCreatedTo}
              />
              <FilterPanel
                groups={sidebarGroups}
                selectedFilters={selectedFilters}
                onToggleFilter={toggleFilter}
              />
            </div>
          </details>
        </aside>

        <main className="content" aria-label="Practice catalog">
          <div className="catalog-body">
            <div className="title-row">
              <h1>List of practices</h1>
                <label className="search-box" aria-label="Search practices">
                  <span className="search-icon" aria-hidden>
                    <Search size={18} />
                  </span>
                  <input
                    type="search"
                    placeholder="Search practices"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                  />
                </label>
            </div>

            <details className="sidebar-mobile-disclosure sidebar-mobile-inline" ref={mobileInlineDisclosureRef}>
              <summary className="sidebar-mobile-summary">
                Filters{totalSelectedFilters > 0 ? ` (${totalSelectedFilters})` : ""}
              </summary>
              <div className="sidebar-mobile-panel">
                <SearchFiltersPanel
                  includeSourceInSearch={includeSourceInSearch}
                  sourceYears={sourceYears}
                  sourceYear={sourceYear}
                  createdFrom={createdFrom}
                  createdTo={createdTo}
                  onIncludeSourceInSearchChange={setIncludeSourceInSearch}
                  onSourceYearChange={setSourceYear}
                  onCreatedFromChange={setCreatedFrom}
                  onCreatedToChange={setCreatedTo}
                />
                <FilterPanel
                  groups={sidebarGroups}
                  selectedFilters={selectedFilters}
                  onToggleFilter={toggleFilter}
                />
              </div>
            </details>

            <ActiveFiltersDisplay 
              filters={selectedFilters}
              onRemoveFilter={removeFilter}
            />

            <div className="practice-list" ref={practiceListRef}>
              {filteredPractices.map((practice) => (
                <PracticeCard 
                  key={practice.name} 
                  practice={practice}
                  isAnimating={shouldAnimate}
                />
              ))}
            </div>
          </div>
        </main>
      </div>
  );
}
