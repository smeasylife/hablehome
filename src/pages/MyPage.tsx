import { useEffect, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { LogOut, Package, PenSquare, UserRound } from "lucide-react";
import { PurchaseReviewComposer } from "../components/PurchaseReviewComposer";
import { logout } from "../api/auth";
import { resolveApiAssetUrl } from "../api/client";
import { getOrders } from "../api/orders";
import { getMemberReviews } from "../data/localReviews";
import { clearSession } from "../data/localSession";
import { currentMemberQueryKey, useCurrentMember } from "../hooks/useCurrentMember";
import type { PurchasedProduct } from "../data/localPurchases";

const currencyFormatter = new Intl.NumberFormat("ko-KR");
const dateFormatter = new Intl.DateTimeFormat("ko-KR", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : dateFormatter.format(date);
}

export function MyPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: session, isError, isLoading } = useCurrentMember();

  const ordersQuery = useQuery({
    queryKey: ["orders"],
    queryFn: getOrders,
    enabled: Boolean(session),
  });
  const reviewsQuery = useQuery({
    queryKey: ["memberReviews", session?.memberId],
    queryFn: () => getMemberReviews(session!.memberId),
    enabled: Boolean(session),
    initialData: session ? getMemberReviews(session.memberId) : [],
  });

  const purchases = useMemo<PurchasedProduct[]>(() => {
    if (!ordersQuery.data || !session) {
      return [];
    }

    return ordersQuery.data.flatMap((order) =>
      order.items.map((item) => {
        const productOption = `${item.color} / ${item.size}`;
        const reviewed = reviewsQuery.data.some(
          (review) =>
            review.itemId === item.itemId && review.productOption === productOption,
        );

        return {
          purchaseId: `${order.orderId}-${item.orderItemId}`,
          memberId: session.memberId,
          itemId: item.itemId,
          name: item.itemName,
          pictureUrl: "",
          color: item.color,
          size: item.size,
          quantity: item.quantity,
          price: item.totalPrice,
          purchasedAt: order.createdAt,
          reviewed,
        };
      }),
    );
  }, [ordersQuery.data, reviewsQuery.data, session]);

  const pendingReviews = useMemo(
    () => purchases.filter((purchase) => !purchase.reviewed),
    [purchases],
  );

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSettled: () => {
      clearSession();
      queryClient.clear();
      queryClient.setQueryData(currentMemberQueryKey, null);
      navigate("/login", { replace: true });
    },
  });

  useEffect(() => {
    if (isError) {
      clearSession();
    }
  }, [isError]);

  if (isLoading) {
    return (
      <section className="mx-auto flex min-h-[calc(100vh-73px)] max-w-3xl flex-col items-center justify-center px-4 text-center">
        <p className="text-sm text-muted">회원 정보를 확인하는 중입니다.</p>
      </section>
    );
  }

  if (!session) {
    return <Navigate to="/login?redirect=%2Fmypage" replace />;
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
      <div className="rounded-md border border-hairline p-5">
        <div className="flex items-center gap-4">
          <div className="flex size-12 items-center justify-center rounded-full bg-soft">
            <UserRound size={20} className="text-ink" />
          </div>
          <div>
            <p className="text-sm text-muted">마이페이지</p>
            <h1 className="text-2xl font-semibold text-ink">{session.nickname}</h1>
            <p className="mt-1 text-sm text-muted">{session.email}</p>
          </div>
          <button
            type="button"
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
            className="ml-auto inline-flex h-10 items-center gap-2 rounded-md border border-hairline px-4 text-sm font-semibold text-ink disabled:text-muted"
          >
            <LogOut size={16} />
            로그아웃
          </button>
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <section>
          <div className="flex items-center gap-2">
            <Package size={18} className="text-muted" />
            <h2 className="text-xl font-semibold text-ink">구매 내역</h2>
          </div>

          <div className="mt-4 space-y-3">
            {ordersQuery.isLoading ? (
              <p className="rounded-md border border-hairline p-4 text-sm text-muted">
                주문 내역을 불러오는 중입니다.
              </p>
            ) : purchases.length > 0 ? (
              purchases.map((purchase) => (
                <div
                  key={purchase.purchaseId}
                  className="grid grid-cols-[88px_1fr] gap-4 rounded-md border border-hairline p-4"
                >
                  <div className="aspect-square overflow-hidden rounded-md bg-soft">
                    {purchase.pictureUrl ? (
                      <img
                        src={resolveApiAssetUrl(purchase.pictureUrl)}
                        alt={purchase.name}
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0">
                    <Link
                      to={`/items/${purchase.itemId}`}
                      className="text-sm font-semibold text-ink"
                    >
                      {purchase.name}
                    </Link>
                    <p className="mt-1 text-xs text-muted">
                      {purchase.color} / {purchase.size} · {purchase.quantity}개
                    </p>
                    <p className="mt-2 text-sm text-body">
                      {currencyFormatter.format(purchase.price)}원
                    </p>
                    <div className="mt-3 flex items-center justify-between gap-3 text-xs">
                      <span className="text-muted">{formatDate(purchase.purchasedAt)}</span>
                      <span className={purchase.reviewed ? "text-muted" : "text-accent"}>
                        {purchase.reviewed ? "리뷰 작성 완료" : "리뷰 작성 가능"}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="rounded-md border border-hairline p-4 text-sm text-muted">
                아직 구매한 상품이 없습니다.
              </p>
            )}
          </div>
        </section>

        <div className="space-y-8">
          <section>
            <div className="flex items-center gap-2">
              <PenSquare size={18} className="text-muted" />
              <h2 className="text-xl font-semibold text-ink">작성 가능한 리뷰</h2>
            </div>

            <div className="mt-4 space-y-3">
              {pendingReviews.length > 0 ? (
                pendingReviews.map((purchase) => (
                  <PurchaseReviewComposer
                    key={purchase.purchaseId}
                    purchase={purchase}
                    session={session}
                  />
                ))
              ) : (
                <p className="rounded-md border border-hairline p-4 text-sm text-muted">
                  작성 가능한 리뷰가 없습니다.
                </p>
              )}
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink">내가 작성한 리뷰</h2>
            <div className="mt-4 space-y-3">
              {reviewsQuery.data.length > 0 ? (
                reviewsQuery.data.map((review) => (
                  <div
                    key={`${review.itemId}-${review.id}-${review.createdAt}`}
                    className="rounded-md border border-hairline p-4"
                  >
                    <Link
                      to={`/items/${review.itemId}`}
                      className="text-sm font-semibold text-ink"
                    >
                      상품 상세 보기
                    </Link>
                    {review.productOption ? (
                      <p className="mt-1 text-xs text-muted">{review.productOption}</p>
                    ) : null}
                    <p className="mt-3 whitespace-pre-line text-sm leading-6 text-body">
                      {review.content}
                    </p>
                    <p className="mt-2 text-xs text-muted">{formatDate(review.createdAt)}</p>
                  </div>
                ))
              ) : (
                <p className="rounded-md border border-hairline p-4 text-sm text-muted">
                  아직 작성한 리뷰가 없습니다.
                </p>
              )}
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}
