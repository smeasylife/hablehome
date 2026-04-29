import { ProductCard } from "./ProductCard";
import type { ItemListResponse } from "../types/item";

type ProductGridProps = {
  products: ItemListResponse[];
};

export function ProductGrid({ products }: ProductGridProps) {
  return (
    <section className="mx-auto grid max-w-6xl grid-cols-2 gap-x-4 gap-y-8 px-4 py-8 sm:px-6 lg:grid-cols-3 lg:gap-x-6 lg:gap-y-10">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </section>
  );
}
