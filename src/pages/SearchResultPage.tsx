import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { ProductGrid } from "../components/ProductGrid";
import { searchItems } from "../api/items";

export function SearchResultPage() {
  const [searchParams] = useSearchParams();
  const keyword = (searchParams.get("keyword") ?? "").trim();
  const hasKeyword = keyword.length > 0;

  const {
    data: products = [],
    isError,
    isFetching,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["items", "search", keyword],
    queryFn: () => searchItems(keyword),
    enabled: hasKeyword,
  });

  return (
    <>
      <section className="mx-auto max-w-6xl px-4 pb-2 pt-8 sm:px-6 sm:pt-10">
        {hasKeyword ? (
          <>
            <p className="text-sm font-medium text-muted">Search Results</p>
            <h1 className="mt-2 text-[28px] font-semibold leading-tight text-ink sm:text-[34px]">
              &quot;{keyword}&quot; 검색 결과
            </h1>
            <p className="mt-3 text-sm text-muted">
              상품 {isLoading ? "..." : products.length.toLocaleString("ko-KR")}개
            </p>
          </>
        ) : (
          <>
            <p className="text-sm font-medium text-muted">Search Results</p>
            <h1 className="mt-2 text-[28px] font-semibold leading-tight text-ink sm:text-[34px]">
              검색어를 입력해 주세요
            </h1>
          </>
        )}
      </section>

      {hasKeyword && isLoading ? <SearchProductGridSkeleton /> : null}

      {hasKeyword && !isLoading && isError ? (
        <SearchCatalogState
          title="검색 결과를 불러오지 못했어요"
          description="백엔드 서버와 API 연결 상태를 확인한 뒤 다시 시도해 주세요."
          actionLabel={isFetching ? "다시 불러오는 중" : "다시 불러오기"}
          actionDisabled={isFetching}
          onAction={() => void refetch()}
        />
      ) : null}

      {hasKeyword && !isLoading && !isError && products.length === 0 ? (
        <SearchCatalogState
          title="검색된 상품이 없습니다"
          description="다른 상품명으로 다시 검색해 보세요."
        />
      ) : null}

      {hasKeyword && !isLoading && !isError && products.length > 0 ? (
        <ProductGrid products={products} />
      ) : null}
    </>
  );
}

type SearchCatalogStateProps = {
  title: string;
  description: string;
  actionLabel?: string;
  actionDisabled?: boolean;
  onAction?: () => void;
};

function SearchCatalogState({
  title,
  description,
  actionLabel,
  actionDisabled = false,
  onAction,
}: SearchCatalogStateProps) {
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

function SearchProductGridSkeleton() {
  return (
    <section
      className="mx-auto grid max-w-6xl grid-cols-2 gap-x-4 gap-y-8 px-4 py-8 sm:px-6 lg:grid-cols-3 lg:gap-x-6 lg:gap-y-10"
      aria-label="검색 결과를 불러오는 중"
    >
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="overflow-hidden rounded-md border border-hairline bg-white">
          <div className="aspect-[4/5] animate-pulse bg-soft" />
          <div className="space-y-2 px-3 py-3">
            <div className="h-3 w-3/4 animate-pulse rounded bg-hairline" />
            <div className="h-4 w-2/3 animate-pulse rounded bg-hairline" />
            <div className="h-2.5 w-12 animate-pulse rounded bg-hairline" />
          </div>
        </div>
      ))}
    </section>
  );
}
