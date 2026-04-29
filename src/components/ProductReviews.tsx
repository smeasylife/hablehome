import { Star } from "lucide-react";
import { useState } from "react";
import type { ReviewResponse } from "../types/item";

const REVIEW_PREVIEW_LENGTH = 120;

type ProductReviewsProps = {
  reviews: ReviewResponse[];
  formatDate: (value: string) => string;
};

export function ProductReviews({ reviews, formatDate }: ProductReviewsProps) {
  const [expandedReviewIds, setExpandedReviewIds] = useState<Set<string>>(new Set());

  const toggleReviewExpanded = (reviewKey: string) => {
    setExpandedReviewIds((current) => {
      const next = new Set(current);
      if (next.has(reviewKey)) {
        next.delete(reviewKey);
      } else {
        next.add(reviewKey);
      }
      return next;
    });
  };

  return (
    <section className="w-full">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-ink">리뷰</h2>
        <span className="text-sm text-muted">{reviews.length}개</span>
      </div>

      <div className="mt-5 space-y-4">
        {reviews.length > 0 ? (
          reviews.map((review, index) => {
            const reviewKey = String(review.id ?? `${review.createdAt}-${index}`);
            const isExpanded = expandedReviewIds.has(reviewKey);
            const canExpand = review.content.length > REVIEW_PREVIEW_LENGTH;
            const visibleContent =
              canExpand && !isExpanded
                ? `${review.content.slice(0, REVIEW_PREVIEW_LENGTH)}...`
                : review.content;

            return (
              <div key={reviewKey} className="rounded-md border border-hairline p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-ink">
                      {review.nickname ?? "구매자"}
                    </p>
                    {review.productOption ? (
                      <p className="mt-1 text-xs text-muted">{review.productOption}</p>
                    ) : null}
                  </div>
                  <div
                    className="flex shrink-0 text-accent"
                    aria-label={`평점 ${review.rating ?? 5}점`}
                  >
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <Star
                        key={rating}
                        size={14}
                        fill={rating <= (review.rating ?? 5) ? "currentColor" : "none"}
                      />
                    ))}
                  </div>
                </div>
                {review.imageUrls && review.imageUrls.length > 0 ? (
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {review.imageUrls.slice(0, 3).map((url, imageIndex) => (
                      <div
                        key={`${url}-${imageIndex}`}
                        className="aspect-square overflow-hidden rounded-md bg-soft"
                      >
                        <img
                          src={url}
                          alt={`리뷰 이미지 ${imageIndex + 1}`}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                ) : null}
                <p className="mt-3 whitespace-pre-line text-sm leading-6 text-body">
                  {visibleContent}
                </p>
                {canExpand ? (
                  <button
                    type="button"
                    onClick={() => toggleReviewExpanded(reviewKey)}
                    className="mt-2 text-xs font-semibold text-ink underline"
                  >
                    {isExpanded ? "접기" : "더보기"}
                  </button>
                ) : null}
                {review.adminComment ? (
                  <p className="mt-3 rounded-md bg-soft p-3 text-sm leading-6 text-body">
                    관리자 답변: {review.adminComment}
                  </p>
                ) : null}
                <p className="mt-2 text-xs text-muted">{formatDate(review.createdAt)}</p>
              </div>
            );
          })
        ) : (
          <p className="rounded-md border border-hairline p-5 text-sm text-muted">
            아직 등록된 리뷰가 없습니다.
          </p>
        )}
      </div>
    </section>
  );
}
