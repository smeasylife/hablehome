import type { Category } from "../types/item";

type CategoryTabsProps = {
  categories: Category[];
  selectedId: string;
  onSelect: (categoryId: string) => void;
};

export function CategoryTabs({
  categories,
  selectedId,
  onSelect,
}: CategoryTabsProps) {
  return (
    <nav className="no-scrollbar flex gap-2 overflow-x-auto border-b border-hairline px-4 py-3 sm:justify-center sm:px-6">
      {categories.map((category) => {
        const selected = selectedId === category.id;

        return (
          <button
            key={category.id}
            type="button"
            onClick={() => onSelect(category.id)}
            className={`h-11 shrink-0 rounded-full px-5 text-sm font-medium transition ${
              selected
                ? "bg-ink text-white"
                : "bg-white text-muted hover:bg-soft hover:text-ink"
            }`}
          >
            {category.label}
          </button>
        );
      })}
    </nav>
  );
}
