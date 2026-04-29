type ProductSectionTab = {
  id: string;
  label: string;
};

type ProductSectionTabsProps = {
  tabs: ProductSectionTab[];
  selectedId: string;
  onSelect: (tabId: string) => void;
};

export function ProductSectionTabs({
  tabs,
  selectedId,
  onSelect,
}: ProductSectionTabsProps) {
  return (
    <nav className="sticky top-[72px] z-20 border-b border-hairline bg-white">
      <div className="no-scrollbar flex gap-6 overflow-x-auto px-1">
        {tabs.map((tab) => {
          const selected = tab.id === selectedId;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelect(tab.id)}
              className={`relative h-12 shrink-0 text-sm font-semibold transition ${
                selected ? "text-ink" : "text-muted"
              }`}
            >
              {tab.label}
              <span
                className={`absolute inset-x-0 bottom-0 h-0.5 transition ${
                  selected ? "bg-ink" : "bg-transparent"
                }`}
              />
            </button>
          );
        })}
      </div>
    </nav>
  );
}
