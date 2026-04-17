"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import type { PracticeListItem, SidebarData } from "@/domain/practice-repository";

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
}>;

function unique(values: string[]) {
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

function PracticeCard({ practice }: PracticeCardProps) {
  return (
    <Link href={`/catalog/practices/${practice.id}`} className="practice-card">
      <header>
        <h2>{practice.name}</h2>
        <div className="tags" aria-label="Practice categories">
          {practice.categories.map((category) => (
            <span key={`${practice.id}-${category.category.name}`}>
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

export default function CatalogClient({ practices, sidebarData }: CatalogClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilters, setSelectedFilters] = useState<Record<FilterKey, string[]>>({
    categories: [],
    models: [],
    promptTechniques: [],
    hyperparameters: [],
    datasets: [],
  });

  const sidebarGroups: SidebarGroup[] = [
    { key: "categories", title: "Categories", items: sidebarData.categories },
    { key: "models", title: "Models", items: sidebarData.models },
    { key: "promptTechniques", title: "Prompt Techniques", items: sidebarData.promptTechniques },
    { key: "hyperparameters", title: "Hyperparameters", items: sidebarData.hyperparameters },
    { key: "datasets", title: "Datasets", items: sidebarData.datasets },
  ];

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

  const filteredPractices = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();

    return practices.filter((practice) => {
      const values = practiceValues(practice);

      const passesSearch =
        normalizedSearch.length === 0 ||
        practice.name.toLowerCase().includes(normalizedSearch) ||
        practice.description.toLowerCase().includes(normalizedSearch);

      if (!passesSearch) {
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
  }, [practices, searchQuery, selectedFilters, sidebarGroups]);

  const totalSelectedFilters =
    selectedFilters.categories.length +
    selectedFilters.models.length +
    selectedFilters.promptTechniques.length +
    selectedFilters.hyperparameters.length +
    selectedFilters.datasets.length;

  return (
    <>
      <div className="layout-grid">
        <aside className="sidebar" aria-label="Practice filters">
          <details className="sidebar-mobile-disclosure sidebar-desktop-disclosure" open>
            <summary className="sidebar-mobile-summary">
              Filters{totalSelectedFilters > 0 ? ` (${totalSelectedFilters})` : ""}
            </summary>
            <div className="sidebar-mobile-panel">
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

            <details className="sidebar-mobile-disclosure sidebar-mobile-inline">
              <summary className="sidebar-mobile-summary">
                Filters{totalSelectedFilters > 0 ? ` (${totalSelectedFilters})` : ""}
              </summary>
              <div className="sidebar-mobile-panel">
                <FilterPanel
                  groups={sidebarGroups}
                  selectedFilters={selectedFilters}
                  onToggleFilter={toggleFilter}
                />
              </div>
            </details>

            <div className="practice-list">
              {filteredPractices.map((practice) => (
                <PracticeCard key={practice.id} practice={practice} />
              ))}
            </div>
          </div>
        </main>
      </div>

      <footer className="mobile-footer" aria-hidden>
        <span>PurePrompt</span>
        <span>Catalog</span>
        <span>Search</span>
        <span>Contribute</span>
        <span>About us</span>
        <span>Sign up</span>
      </footer>
    </>
  );
}
