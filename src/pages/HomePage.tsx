import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CategoryTabs } from "../components/CategoryTabs";
import { HomePromoBanner } from "../components/HomePromoBanner";
import { ProductGrid } from "../components/ProductGrid";
import { getItems } from "../api/items";
import { categories } from "../data/categories";

export function HomePage() {
  const [selectedCategoryId, setSelectedCategoryId] = useState(categories[0].id);
  const { data: products = [], isError, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["items", 0],
    queryFn: () => getItems(0),
  });

  const selectedCategory =
    categories.find((category) => category.id === selectedCategoryId) ?? categories[0];

  const filteredProducts = useMemo(() => {
    if (selectedCategory.categoryNames.length === 0) {
      return products;
    }

    return products.filter((product) =>
      product.categories?.some((category) =>
        selectedCategory.categoryNames.includes(category),
      ),
    );
  }, [products, selectedCategory]);

  return (
    <>
      <CategoryTabs
        categories={categories}
        selectedId={selectedCategoryId}
        onSelect={setSelectedCategoryId}
      />

      <HomePromoBanner />

      <section className="mx-auto max-w-6xl px-4 pb-2 pt-8 sm:px-6 sm:pt-10">
        <p className="text-sm font-medium text-muted">Hable Bedding</p>
        <h1 className="mt-2 max-w-2xl text-[28px] font-semibold leading-tight text-ink sm:text-[34px]">
          편안한 하루를 완성하는 깨끗한 침구
        </h1>
      </section>

      {isLoading ? (
        <ProductGridSkeleton />
      ) : null}

      {!isLoading && isError ? (
        <HomeCatalogState
          title="상품을 불러오지 못했어요"
          description="백엔드 서버와 API 연결 상태를 확인한 뒤 다시 시도해 주세요."
          actionLabel={isFetching ? "다시 불러오는 중" : "다시 불러오기"}
          onAction={() => void refetch()}
          actionDisabled={isFetching}
        />
      ) : null}

      {!isLoading && !isError && products.length === 0 ? (
        <HomeCatalogState
          title="등록된 상품이 없습니다"
          description="백엔드 초기 데이터 또는 관리자 상품 등록 상태를 확인해 주세요."
        />
      ) : null}

      {!isLoading && !isError && products.length > 0 && filteredProducts.length === 0 ? (
        <HomeCatalogState
          title={`${selectedCategory.label} 상품이 아직 없습니다`}
          description="다른 카테고리를 선택하면 등록된 상품을 볼 수 있습니다."
        />
      ) : null}

      {!isLoading && !isError && filteredProducts.length > 0 ? (
        <ProductGrid products={filteredProducts} />
      ) : null}
    </>
  );
}

type HomeCatalogStateProps = {
  title: string;
  description: string;
  actionLabel?: string;
  actionDisabled?: boolean;
  onAction?: () => void;
};

function HomeCatalogState({
  title,
  description,
  actionLabel,
  actionDisabled = false,
  onAction,
}: HomeCatalogStateProps) {
  return (
    <section className="mx-auto flex min-h-[280px] max-w-6xl flex-col items-center justify-center px-4 py-14 text-center sm:px-6">
      <h2 className="text-lg font-semibold text-ink">{title}</h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-muted">{description}</p>
      {actionLabel && onAction ? (
        <button
          type="button"
          onClick={onAction}
          disabled={actionDisabled}
          className="mt-6 h-11 rounded-md bg-ink px-5 text-sm font-semibold text-white disabled:bg-muted"
        >
          {actionLabel}
        </button>
      ) : null}
    </section>
  );
}

function ProductGridSkeleton() {
  return (
    <section
      className="mx-auto grid max-w-6xl grid-cols-2 gap-x-4 gap-y-8 px-4 py-8 sm:px-6 lg:grid-cols-3 lg:gap-x-6 lg:gap-y-10"
      aria-label="상품을 불러오는 중"
    >
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="overflow-hidden rounded-md bg-[#181a19]">
          <div className="aspect-[4/5] animate-pulse bg-soft" />
          <div className="space-y-2 px-3 py-3">
            <div className="h-3 w-3/4 animate-pulse rounded bg-white/20" />
            <div className="h-4 w-2/3 animate-pulse rounded bg-white/20" />
            <div className="h-2.5 w-12 animate-pulse rounded bg-white/20" />
          </div>
        </div>
      ))}
    </section>
  );
}
