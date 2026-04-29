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
      className="group block rounded-[14px] outline-none transition focus-visible:ring-2 focus-visible:ring-ink"
    >
      <article className="transition group-hover:-translate-y-0.5 group-hover:shadow-soft">
        <div className="relative aspect-square overflow-hidden rounded-[14px] bg-soft">
          <img
            src={product.pictureUrl}
            alt={product.name}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
            loading="lazy"
          />
          {discountRate > 0 ? (
            <span className="absolute left-3 top-3 rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-accent shadow-soft">
              {discountRate}% OFF
            </span>
          ) : null}
          <button
            type="button"
            className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/92 shadow-soft"
            aria-label="좋아요"
            onClick={(event) => event.preventDefault()}
          >
            <Heart
              size={18}
              className={product.like ? "fill-accent text-accent" : "text-ink"}
            />
          </button>
        </div>

        <div className="px-1 pb-2 pt-3">
          <div className="flex items-start justify-between gap-2">
            <h2 className="min-w-0 text-[15px] font-semibold leading-5 text-ink">
              {product.name}
            </h2>
            <span
              className="mt-1 h-4 w-4 shrink-0 rounded-full border border-hairline"
              style={{ backgroundColor: colorMap[product.color] ?? "#eeeeee" }}
              aria-label={`${product.color} 색상`}
            />
          </div>

          <div className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-1">
            {discountRate > 0 ? (
              <span className="text-sm text-muted line-through">
                {currencyFormatter.format(product.price)}원
              </span>
            ) : null}
            <span className="text-[15px] font-semibold text-ink">
              {currencyFormatter.format(product.salePrice)}원
            </span>
          </div>
          <p className="mt-1 text-sm text-muted">{product.color}</p>
        </div>
      </article>
    </Link>
  );
}
