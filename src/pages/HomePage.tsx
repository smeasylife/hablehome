import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CategoryTabs } from "../components/CategoryTabs";
import { ProductGrid } from "../components/ProductGrid";
import { getItems } from "../api/items";
import { categories, mockProducts } from "../data/mockProducts";

export function HomePage() {
  const [selectedCategoryId, setSelectedCategoryId] = useState(categories[0].id);
  const { data, isLoading, isError } = useQuery({
    queryKey: ["items", 0],
    queryFn: () => getItems(0),
  });

  const products = useMemo(() => {
    if (data && data.length > 0) {
      return data;
    }

    return mockProducts;
  }, [data]);

  return (
    <>
      <CategoryTabs
        categories={categories}
        selectedId={selectedCategoryId}
        onSelect={setSelectedCategoryId}
      />

      <section className="mx-auto max-w-6xl px-4 pb-2 pt-8 sm:px-6 sm:pt-10">
        <p className="text-sm font-medium text-muted">Hable Bedding</p>
        <h1 className="mt-2 max-w-2xl text-[28px] font-semibold leading-tight text-ink sm:text-[34px]">
          편안한 하루를 완성하는 깨끗한 침구
        </h1>
      </section>

      {isLoading ? (
        <p className="mx-auto max-w-6xl px-4 pt-4 text-sm text-muted sm:px-6">
          상품을 불러오는 중입니다.
        </p>
      ) : null}
      {isError ? (
        <p className="mx-auto max-w-6xl px-4 pt-4 text-sm text-muted sm:px-6">
          API 연결 전까지 예시 상품을 표시합니다.
        </p>
      ) : null}

      <ProductGrid products={products} />
    </>
  );
}
