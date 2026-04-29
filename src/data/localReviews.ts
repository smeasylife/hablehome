import type { ReviewResponse } from "../types/item";

const LOCAL_REVIEWS_KEY = "shopping-mall-reviews";

export type LocalReviewRecord = ReviewResponse & {
  itemId: number;
  memberId: number;
};

function readReviews() {
  if (typeof window === "undefined") {
    return [] as LocalReviewRecord[];
  }

  const rawReviews = window.localStorage.getItem(LOCAL_REVIEWS_KEY);
  if (!rawReviews) {
    return [] as LocalReviewRecord[];
  }

  try {
    return JSON.parse(rawReviews) as LocalReviewRecord[];
  } catch {
    return [] as LocalReviewRecord[];
  }
}

function writeReviews(reviews: LocalReviewRecord[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(LOCAL_REVIEWS_KEY, JSON.stringify(reviews));
}

export function getLocalReviews(itemId: number) {
  return readReviews().filter((review) => review.itemId === itemId);
}

export function getMemberReviews(memberId: number) {
  return readReviews()
    .filter((review) => review.memberId === memberId)
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

export function addLocalReview(review: LocalReviewRecord) {
  const reviews = readReviews();
  reviews.unshift(review);
  writeReviews(reviews);
}
