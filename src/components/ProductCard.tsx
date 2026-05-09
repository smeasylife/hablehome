import { Heart } from "lucide-react";
import { Link } from "react-router-dom";
import type { ItemListResponse } from "../types/item";

type ProductCardProps = {
  product: ItemListResponse;
};

const colorMap: Record<string, string> = {
  White: "#f8f8f8",
  Gray: "#9ca3af",
  Ivory: "#f3ead7",
  Blue: "#8bb7d8",
  Charcoal: "#333333",
  Beige: "#d6c0a4",
};

const currencyFormatter = new Intl.NumberFormat("ko-KR");

export function ProductCard({ product }: ProductCardProps) {
  const discountRate =
    product.price > product.salePrice
      ? Math.round(((product.price - product.salePrice) / product.price) * 100)
      : 0;

  return (
    <Link
      to={`/items/${product.id}`}
      className="group block rounded-md outline-none transition focus-visible:ring-2 focus-visible:ring-ink"
    >
      <article className="overflow-hidden rounded-md border border-hairline bg-white transition group-hover:-translate-y-0.5">
        <div className="relative aspect-[4/5] overflow-hidden bg-soft">
          <img
            src={product.pictureUrl}
            alt={product.name}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
            loading="lazy"
          />
          {product.like ? (
            <Heart
              aria-label="좋아요한 상품"
              size={21}
              strokeWidth={1.8}
              className="absolute right-3 top-3 fill-red-500 text-red-500 drop-shadow"
            />
          ) : null}
        </div>

        <div className="px-3 pb-3 pt-2.5">
          <h2 className="truncate text-[13px] font-medium leading-5 text-ink">
            {product.name}
          </h2>

          <div className="mt-1 flex min-w-0 items-baseline gap-1.5">
            {discountRate > 0 ? (
              <span className="shrink-0 text-[15px] font-bold text-red-500">
                {discountRate}%
              </span>
            ) : null}
            <span className="shrink-0 text-[15px] font-bold text-ink">
              {currencyFormatter.format(product.salePrice)}원
            </span>
            {discountRate > 0 ? (
              <span className="min-w-0 truncate text-xs text-muted line-through">
                {currencyFormatter.format(product.price)}원
              </span>
            ) : null}
          </div>

          <div className="mt-2 flex items-center gap-1.5">
            <span
              className="h-2.5 w-2.5 rounded-full border border-hairline"
              style={{ backgroundColor: colorMap[product.color] ?? "#eeeeee" }}
              aria-label={`${product.color} 색상`}
            />
          </div>
        </div>
      </article>
    </Link>
  );
}
