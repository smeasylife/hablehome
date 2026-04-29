import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ArrowLeft, Check, ShoppingBag } from "lucide-react";
import { getCartItems, removeSelectedCartItems } from "../api/cart";
import {
  getLocalCartItems,
  removeLocalCartItems,
} from "../data/localCart";
import type { CartItemResponse } from "../types/cart";

const currencyFormatter = new Intl.NumberFormat("ko-KR");

export function CartPage() {
  const queryClient = useQueryClient();
  const [selectedCartIds, setSelectedCartIds] = useState<number[]>([]);
  const [message, setMessage] = useState("");

  const { data, isError, isLoading } = useQuery({
    queryKey: ["cart"],
    queryFn: getCartItems,
  });

  const cartItems: CartItemResponse[] = data ?? getLocalCartItems();

  const selectedIdSet = useMemo(
    () => new Set(selectedCartIds),
    [selectedCartIds],
  );
  const selectedItems = cartItems.filter((item) => selectedIdSet.has(item.cartId));
  const selectedTotal = selectedItems.reduce(
    (total, item) => total + item.salePrice,
    0,
  );
  const allSelected =
    cartItems.length > 0 && selectedCartIds.length === cartItems.length;

  const removeMutation = useMutation({
    mutationFn: removeSelectedCartItems,
    onSuccess: () => {
      setMessage("선택한 상품을 구매 처리하고 장바구니에서 제거했습니다.");
      setSelectedCartIds([]);
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
    onError: (_error, cartIds) => {
      removeLocalCartItems(cartIds);
      setMessage("선택한 상품을 구매 처리하고 장바구니에서 제거했습니다.");
      setSelectedCartIds([]);
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });

  const toggleItem = (cartId: number) => {
    setMessage("");
    setSelectedCartIds((current) =>
      current.includes(cartId)
        ? current.filter((id) => id !== cartId)
        : [...current, cartId],
    );
  };

  const toggleAll = () => {
    setMessage("");
    setSelectedCartIds(allSelected ? [] : cartItems.map((item) => item.cartId));
  };

  const purchaseSelectedItems = () => {
    if (selectedCartIds.length === 0) {
      setMessage("구매할 상품을 선택해 주세요.");
      return;
    }

    removeMutation.mutate(selectedCartIds);
  };

  return (
    <section className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-sm font-medium text-muted transition hover:text-ink"
      >
        <ArrowLeft size={16} />
        쇼핑 계속하기
      </Link>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-muted">Cart</p>
          <h1 className="mt-2 text-[28px] font-semibold leading-tight text-ink sm:text-[34px]">
            장바구니
          </h1>
        </div>
        <button
          type="button"
          onClick={toggleAll}
          disabled={cartItems.length === 0}
          className="inline-flex h-11 items-center justify-center rounded-md border border-hairline px-4 text-sm font-semibold text-ink disabled:text-muted"
        >
          {allSelected ? "전체 해제" : "전체 선택"}
        </button>
      </div>

      {isLoading ? (
        <p className="mt-8 text-sm text-muted">장바구니를 불러오는 중입니다.</p>
      ) : null}
      {isError ? (
        <p className="mt-4 text-sm text-muted">
          API 연결 전까지 이 브라우저에 담은 상품을 표시합니다.
        </p>
      ) : null}

      {cartItems.length === 0 && !isLoading ? (
        <div className="mt-10 rounded-md border border-hairline px-5 py-12 text-center">
          <p className="text-lg font-semibold text-ink">장바구니가 비어 있습니다.</p>
          <Link
            to="/"
            className="mt-6 inline-flex h-11 items-center justify-center rounded-md bg-ink px-5 text-sm font-semibold text-white"
          >
            상품 보러가기
          </Link>
        </div>
      ) : null}

      {cartItems.length > 0 ? (
        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
          <div className="space-y-3">
            {cartItems.map((item) => {
              const selected = selectedIdSet.has(item.cartId);

              return (
                <article
                  key={item.cartId}
                  className="grid grid-cols-[40px_96px_1fr] gap-4 rounded-md border border-hairline p-4 sm:grid-cols-[44px_120px_1fr]"
                >
                  <button
                    type="button"
                    onClick={() => toggleItem(item.cartId)}
                    className={`mt-1 flex size-7 items-center justify-center rounded-full border ${
                      selected
                        ? "border-ink bg-ink text-white"
                        : "border-hairline bg-white text-transparent"
                    }`}
                    aria-label={`${item.name} 선택`}
                  >
                    <Check size={15} />
                  </button>
                  <Link
                    to={`/items/${item.itemId}`}
                    className="aspect-square overflow-hidden rounded-md bg-soft"
                  >
                    {item.pictureUrl ? (
                      <img
                        src={item.pictureUrl}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                  </Link>
                  <div className="min-w-0">
                    <Link
                      to={`/items/${item.itemId}`}
                      className="text-base font-semibold text-ink transition hover:text-accent"
                    >
                      {item.name}
                    </Link>
                    <p className="mt-2 text-sm text-muted">
                      색상 {item.color} · 사이즈 {item.size}
                    </p>
                    <div className="mt-4 flex flex-wrap items-baseline gap-2">
                      {item.price > item.salePrice ? (
                        <span className="text-sm text-muted line-through">
                          {currencyFormatter.format(item.price)}원
                        </span>
                      ) : null}
                      <span className="text-lg font-semibold text-ink">
                        {currencyFormatter.format(item.salePrice)}원
                      </span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          <aside className="h-fit rounded-md border border-hairline p-5 lg:sticky lg:top-24">
            <h2 className="text-lg font-semibold text-ink">선택 상품 요약</h2>
            <div className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">선택 상품</span>
                <span className="font-medium text-ink">{selectedItems.length}개</span>
              </div>
              <div className="flex justify-between border-t border-hairline pt-4 text-base">
                <span className="font-semibold text-ink">총 상품 금액</span>
                <span className="font-semibold text-accent">
                  {currencyFormatter.format(selectedTotal)}원
                </span>
              </div>
            </div>
            {message ? (
              <p className="mt-4 rounded-md bg-soft px-3 py-2 text-sm text-body">
                {message}
              </p>
            ) : null}
            <button
              type="button"
              onClick={purchaseSelectedItems}
              disabled={removeMutation.isPending}
              className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-md bg-ink px-5 text-sm font-semibold text-white disabled:bg-muted"
            >
              <ShoppingBag size={18} />
              선택 상품 구매
            </button>
          </aside>
        </div>
      ) : null}
    </section>
  );
}
