import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Star } from "lucide-react";
import { useState } from "react";
import { createReview } from "../api/items";
import { addLocalReview } from "../data/localReviews";
import {
  type PurchasedProduct,
  markPurchaseReviewed,
} from "../data/localPurchases";
import type { UserSession } from "../data/localSession";

type PurchaseReviewComposerProps = {
  purchase: PurchasedProduct;
  session: UserSession;
};

export function PurchaseReviewComposer({
  purchase,
  session,
}: PurchaseReviewComposerProps) {
  const queryClient = useQueryClient();
  const [reviewContent, setReviewContent] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewImageInput, setReviewImageInput] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const createReviewMutation = useMutation({
    mutationFn: async () => {
      const imageUrls = reviewImageInput
        .split(",")
        .map((url) => url.trim())
        .filter(Boolean);

      try {
        await createReview(purchase.itemId, {
          content: reviewContent.trim(),
          rating: reviewRating,
          productOption: `${purchase.color} / ${purchase.size}`,
          imageUrls,
        });
      } catch {
        // API 연결 전까지는 로컬 저장만 수행한다.
      }

      addLocalReview({
        id: Date.now(),
        itemId: purchase.itemId,
        memberId: session.memberId,
        nickname: session.nickname,
        rating: reviewRating,
        productOption: `${purchase.color} / ${purchase.size}`,
        imageUrls,
        content: reviewContent.trim(),
        adminComment: null,
        createdAt: new Date().toISOString(),
      });
      markPurchaseReviewed(purchase.purchaseId);
    },
    onSuccess: () => {
      setReviewContent("");
      setReviewRating(5);
      setReviewImageInput("");
      setErrorMessage("");
      queryClient.invalidateQueries({ queryKey: ["item", purchase.itemId] });
      queryClient.invalidateQueries({ queryKey: ["purchases", session.memberId] });
      queryClient.invalidateQueries({ queryKey: ["memberReviews", session.memberId] });
    },
    onError: () => {
      setErrorMessage("리뷰 등록에 실패했습니다. 내용을 확인해 주세요.");
    },
  });

  const handleSubmit = () => {
    if (!reviewContent.trim() || createReviewMutation.isPending) {
      return;
    }

    createReviewMutation.mutate();
  };

  return (
    <div className="rounded-md border border-hairline p-4">
      <div className="flex items-start gap-4">
        <div className="size-20 overflow-hidden rounded-md bg-soft">
          <img
            src={purchase.pictureUrl}
            alt={purchase.name}
            className="h-full w-full object-cover"
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-ink">{purchase.name}</p>
          <p className="mt-1 text-xs text-muted">
            {purchase.color} / {purchase.size} · {purchase.quantity}개
          </p>
          <div className="mt-3 flex gap-1" aria-label={`평점 ${reviewRating}점`}>
            {[1, 2, 3, 4, 5].map((rating) => (
              <button
                key={rating}
                type="button"
                onClick={() => setReviewRating(rating)}
                className="flex size-7 items-center justify-center text-accent"
                aria-label={`${rating}점`}
              >
                <Star
                  size={17}
                  fill={rating <= reviewRating ? "currentColor" : "none"}
                />
              </button>
            ))}
          </div>
        </div>
      </div>

      <textarea
        value={reviewContent}
        onChange={(event) => setReviewContent(event.target.value)}
        placeholder="구매한 상품의 사용 후기를 입력해 주세요."
        rows={4}
        className="mt-4 w-full resize-none rounded-md border border-hairline px-3 py-2 text-sm leading-6 text-ink outline-none focus:border-ink"
      />
      <input
        value={reviewImageInput}
        onChange={(event) => setReviewImageInput(event.target.value)}
        placeholder="이미지 URL, 쉼표로 여러 개 입력"
        className="mt-2 h-10 w-full rounded-md border border-hairline px-3 text-sm text-ink outline-none focus:border-ink"
      />
      {errorMessage ? <p className="mt-2 text-xs text-accent">{errorMessage}</p> : null}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={!reviewContent.trim() || createReviewMutation.isPending}
        className="mt-3 flex h-10 w-full items-center justify-center rounded-md bg-ink px-4 text-sm font-semibold text-white disabled:bg-muted"
      >
        {createReviewMutation.isPending ? "등록 중" : "리뷰 등록"}
      </button>
    </div>
  );
}
