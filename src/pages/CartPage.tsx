import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { ArrowLeft, Check, ShoppingBag, Trash2 } from "lucide-react";
import { getCartItems, removeSelectedCartItems } from "../api/cart";
import { resolveApiAssetUrl } from "../api/client";
import type { CartItemResponse } from "../types/cart";
import type { OrderPageState } from "../types/order";

const currencyFormatter = new Intl.NumberFormat("ko-KR");

export function CartPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedCartIds, setSelectedCartIds] = useState<number[]>([]);
  const [message, setMessage] = useState("");

  const { data, isError, isLoading } = useQuery({
    queryKey: ["cart"],
    queryFn: getCartItems,
  });

  const cartItems: CartItemResponse[] = data ?? [];
  const availableCartItems = cartItems.filter((item) => item.available);

  const selectedIdSet = useMemo(
    () => new Set(selectedCartIds),
    [selectedCartIds],
  );
  const selectedItems = cartItems.filter(
    (item) => selectedIdSet.has(item.cartId) && item.available,
  );
  const selectedTotal = selectedItems.reduce(
    (total, item) => total + item.salePrice * item.quantity,
    0,
  );
  const allSelected =
    availableCartItems.length > 0 && selectedCartIds.length === availableCartItems.length;

  const removeCartMutation = useMutation({
    mutationFn: (cartIds: number[]) => removeSelectedCartItems(cartIds),
    onSuccess: (_data, removedCartIds) => {
      const removedIdSet = new Set(removedCartIds);
      setSelectedCartIds((current) => current.filter((id) => !removedIdSet.has(id)));
      setMessage(
        removedCartIds.length > 1
          ? "선택한 상품을 장바구니에서 삭제했습니다."
          : "상품을 장바구니에서 삭제했습니다.",
      );
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
    onError: (error) => {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        navigate("/login?redirect=%2Fcart");
        return;
      }

      setMessage("장바구니 상품을 삭제하지 못했습니다. 다시 시도해 주세요.");
    },
  });

  const toggleItem = (item: CartItemResponse) => {
    setMessage("");
    if (!item.available) {
      setMessage("품절 또는 재고 부족 상품은 구매할 수 없습니다.");
      return;
    }
    setSelectedCartIds((current) =>
      current.includes(item.cartId)
        ? current.filter((id) => id !== item.cartId)
        : [...current, item.cartId],
    );
  };

  const toggleAll = () => {
    setMessage("");
    setSelectedCartIds(allSelected ? [] : availableCartItems.map((item) => item.cartId));
  };

  const purchaseSelectedItems = () => {
    if (selectedItems.length === 0) {
      setMessage("구매할 상품을 선택해 주세요.");
      return;
    }

    const state: OrderPageState = {
      cartIds: selectedItems.map((item) => item.cartId),
      previewItems: selectedItems.map((item) => ({
        itemId: item.itemId,
        name: item.name,
        color: item.color,
        size: item.size,
        quantity: item.quantity,
        unitPrice: item.salePrice,
        pictureUrl: item.pictureUrl,
      })),
    };

    navigate("/order", { state });
  };

  const removeCartItem = (cartId: number) => {
    setMessage("");
    removeCartMutation.mutate([cartId]);
  };

  const removeSelectedItems = () => {
    if (selectedCartIds.length === 0) {
      setMessage("삭제할 상품을 선택해 주세요.");
      return;
    }

    setMessage("");
    removeCartMutation.mutate(selectedCartIds);
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
          disabled={availableCartItems.length === 0}
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
          장바구니를 불러오지 못했습니다. 로그인 상태와 백엔드 API 연결을 확인해 주세요.
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
              const selected = item.available && selectedIdSet.has(item.cartId);

              return (
                <article
                  key={item.cartId}
                  className="grid grid-cols-[40px_96px_1fr] gap-4 rounded-md border border-hairline p-4 sm:grid-cols-[44px_120px_1fr]"
                >
                  <button
                    type="button"
                    onClick={() => toggleItem(item)}
                    disabled={!item.available}
                    className={`mt-1 flex size-7 items-center justify-center rounded-full border disabled:border-hairline disabled:bg-soft ${
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
                        src={resolveApiAssetUrl(item.pictureUrl)}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                  </Link>
                  <div className="min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <Link
                        to={`/items/${item.itemId}`}
                        className="text-base font-semibold text-ink transition hover:text-accent"
                      >
                        {item.name}
                      </Link>
                      <button
                        type="button"
                        onClick={() => removeCartItem(item.cartId)}
                        disabled={removeCartMutation.isPending}
                        className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-md border border-hairline px-3 text-xs font-semibold text-muted transition hover:border-ink hover:text-ink disabled:text-muted"
                        aria-label={`${item.name} 삭제`}
                      >
                        <Trash2 size={14} />
                        삭제
                      </button>
                    </div>
                    <p className="mt-2 text-sm text-muted">
                      색상 {item.color} · 사이즈 {item.size} · 수량 {item.quantity}개
                      {item.additionalPrice > 0
                        ? ` · 옵션 추가금 +${currencyFormatter.format(item.additionalPrice)}원`
                        : ""}
                    </p>
                    {!item.available ? (
                      <p className="mt-2 inline-flex rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600">
                        {item.stockQuantity <= 0
                          ? "품절"
                          : `재고 부족: 남은 수량 ${item.stockQuantity}개`}
                      </p>
                    ) : null}
                    <div className="mt-4 flex flex-wrap items-baseline gap-2">
                      {item.price > item.salePrice ? (
                        <span className="text-sm text-muted line-through">
                          {currencyFormatter.format(item.price)}원
                        </span>
                      ) : null}
                      <span className="text-lg font-semibold text-ink">
                        {currencyFormatter.format(item.salePrice * item.quantity)}원
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
                <span className="font-medium text-ink">
                  {selectedItems.reduce((total, item) => total + item.quantity, 0)}개
                </span>
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
              onClick={removeSelectedItems}
              disabled={selectedCartIds.length === 0 || removeCartMutation.isPending}
              className="mt-6 flex h-11 w-full items-center justify-center gap-2 rounded-md border border-hairline px-5 text-sm font-semibold text-ink disabled:text-muted"
            >
              <Trash2 size={17} />
              선택 상품 삭제
            </button>
            <button
              type="button"
              onClick={purchaseSelectedItems}
              disabled={selectedItems.length === 0}
              className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-md bg-ink px-5 text-sm font-semibold text-white disabled:bg-muted"
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
