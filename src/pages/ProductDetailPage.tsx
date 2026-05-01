import {
  ArrowLeft,
  Heart,
  Minus,
  Plus,
  ShoppingBag,
  ShoppingCart,
  Truck,
  X,
} from "lucide-react";
import axios from "axios";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { addCartItem } from "../api/cart";
import { getItem, likeItem, unlikeItem } from "../api/items";
import { ProductReviews } from "../components/ProductReviews";
import { ProductQuestions } from "../components/ProductQuestions";
import { ProductSectionTabs } from "../components/ProductSectionTabs";
import type { ItemDetailResponse, ItemListResponse } from "../types/item";
import type { OrderPageState } from "../types/order";

const currencyFormatter = new Intl.NumberFormat("ko-KR");
const DEFAULT_COLORS = ["White", "Ivory", "Gray", "Beige", "Blue", "Charcoal"];
const dateFormatter = new Intl.DateTimeFormat("ko-KR", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return dateFormatter.format(date);
}

export function ProductDetailPage() {
  const { itemId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isPurchaseModalOpen, setPurchaseModalOpen] = useState(false);
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [purchaseError, setPurchaseError] = useState("");
  const [cartMessage, setCartMessage] = useState("");
  const [likeMessage, setLikeMessage] = useState("");
  const [selectedSectionId, setSelectedSectionId] = useState("info");
  const infoSectionRef = useRef<HTMLElement | null>(null);
  const reviewSectionRef = useRef<HTMLElement | null>(null);
  const qnaSectionRef = useRef<HTMLElement | null>(null);
  const parsedItemId = Number(itemId);
  const isValidItemId = Number.isInteger(parsedItemId) && parsedItemId > 0;

  const { data, isError, isLoading } = useQuery({
    queryKey: ["item", parsedItemId],
    queryFn: () => getItem(parsedItemId),
    enabled: isValidItemId,
  });

  const product = data;
  const reviews = product?.reviews ?? [];
  const mainPicture = product?.itemPictures[0]?.url ?? "";
  const colorOptions = useMemo(() => {
    if (!product) {
      return DEFAULT_COLORS;
    }

    return Array.from(new Set([product.color, ...DEFAULT_COLORS].filter(Boolean)));
  }, [product]);
  const sizeOptions = useMemo(() => {
    if (!product) {
      return [];
    }

    return product.size
      .split("/")
      .map((size) => size.trim())
      .filter(Boolean);
  }, [product]);
  const subtotal = product ? product.salePrice * quantity : 0;
  const discountRate =
    product && product.price > product.salePrice
      ? Math.round(((product.price - product.salePrice) / product.price) * 100)
      : 0;

  const addCartMutation = useMutation({
    mutationFn: ({
      itemId,
      color,
      size,
      quantity,
    }: {
      itemId: number;
      color?: string;
      size?: string;
      quantity?: number;
    }) => addCartItem(itemId, { color, size, quantity }),
    onSuccess: () => {
      setCartMessage("장바구니에 담았습니다.");
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
    onError: (error) => {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        navigate("/login");
        return;
      }

      setCartMessage("장바구니에 담지 못했습니다. 다시 시도해 주세요.");
    },
  });

  const likeMutation = useMutation({
    mutationFn: ({ itemId, liked }: { itemId: number; liked: boolean }) =>
      liked ? likeItem(itemId) : unlikeItem(itemId),
    onMutate: async ({ itemId, liked }) => {
      setLikeMessage("");
      await Promise.all([
        queryClient.cancelQueries({ queryKey: ["item", itemId] }),
        queryClient.cancelQueries({ queryKey: ["items"] }),
      ]);

      const previousItem = queryClient.getQueryData<ItemDetailResponse>(["item", itemId]);
      const previousItems = queryClient.getQueriesData<ItemListResponse[]>({
        queryKey: ["items"],
      });

      queryClient.setQueryData<ItemDetailResponse>(["item", itemId], (item) =>
        item ? { ...item, like: liked } : item,
      );
      queryClient.setQueriesData<ItemListResponse[]>({ queryKey: ["items"] }, (items) =>
        items?.map((item) => (item.id === itemId ? { ...item, like: liked } : item)),
      );

      return { previousItem, previousItems };
    },
    onError: (error, variables, context) => {
      queryClient.setQueryData(["item", variables.itemId], context?.previousItem);
      context?.previousItems.forEach(([queryKey, items]) => {
        queryClient.setQueryData(queryKey, items);
      });

      if (axios.isAxiosError(error) && error.response?.status === 401) {
        navigate("/login");
        return;
      }

      setLikeMessage("좋아요 상태를 저장하지 못했습니다.");
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: ["item", variables.itemId] });
      queryClient.invalidateQueries({ queryKey: ["items"] });
    },
  });

  const handleAddCart = () => {
    if (!product) {
      return;
    }

    setCartMessage("");
    addCartMutation.mutate({
      itemId: product.itemId,
      color: product.color,
      size: product.size,
      quantity: 1,
    });
  };

  const handleLikeToggle = () => {
    if (!product) {
      return;
    }

    likeMutation.mutate({ itemId: product.itemId, liked: !product.like });
  };

  const scrollToSection = (sectionId: string) => {
    const sectionMap: Record<string, HTMLElement | null> = {
      info: infoSectionRef.current,
      review: reviewSectionRef.current,
      qna: qnaSectionRef.current,
    };

    setSelectedSectionId(sectionId);
    sectionMap[sectionId]?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const openPurchaseModal = () => {
    if (!product) {
      return;
    }

    setSelectedColor((current) => current || product.color || colorOptions[0] || "");
    setSelectedSize((current) => current || sizeOptions[0] || product.size || "");
    setQuantity((current) => Math.max(1, current));
    setPurchaseError("");
    setPurchaseModalOpen(true);
  };

  const confirmPurchase = () => {
    if (!product) {
      return;
    }

    if (!selectedColor || !selectedSize) {
      setPurchaseError("색상과 사이즈를 선택해 주세요.");
      return;
    }

    const state: OrderPageState = {
      items: [
        {
          itemId: product.itemId,
          color: selectedColor,
          size: selectedSize,
          quantity,
        },
      ],
      previewItems: [
        {
          itemId: product.itemId,
          name: product.name,
          color: selectedColor,
          size: selectedSize,
          quantity,
          unitPrice: product.salePrice,
          pictureUrl: product.itemPictures[0]?.url ?? "",
        },
      ],
    };

    navigate("/order", { state });
  };

  useEffect(() => {
    const sections = [
      { id: "info", element: infoSectionRef.current },
      { id: "review", element: reviewSectionRef.current },
      { id: "qna", element: qnaSectionRef.current },
    ].filter(
      (section): section is { id: string; element: HTMLElement } => Boolean(section.element),
    );

    if (sections.length === 0) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort((left, right) => right.intersectionRatio - left.intersectionRatio)[0];

        if (!visibleEntry) {
          return;
        }

        const currentSection = sections.find(
          (section) => section.element === visibleEntry.target,
        );

        if (currentSection) {
          setSelectedSectionId(currentSection.id);
        }
      },
      {
        rootMargin: "-140px 0px -45% 0px",
        threshold: [0.2, 0.4, 0.6],
      },
    );

    sections.forEach((section) => observer.observe(section.element));

    return () => observer.disconnect();
  }, [product]);

  if (!isValidItemId || (!isLoading && !product)) {
    return (
      <section className="mx-auto flex min-h-[calc(100vh-73px)] max-w-3xl flex-col items-center justify-center px-4 text-center">
        <p className="text-sm font-medium text-muted">상품 상세</p>
        <h1 className="mt-2 text-3xl font-semibold">상품을 찾을 수 없습니다.</h1>
        <Link
          to="/"
          className="mt-8 rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white"
        >
          메인으로 돌아가기
        </Link>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-sm font-medium text-muted transition hover:text-ink"
      >
        <ArrowLeft size={16} />
        목록으로 돌아가기
      </Link>

      {isError ? (
        <p className="mt-4 rounded-md border border-hairline px-3 py-2 text-sm text-muted">
          상품 상세 정보를 불러오지 못했습니다. 백엔드 API 연결 상태를 확인해 주세요.
        </p>
      ) : null}

      {isLoading && !product ? (
        <p className="mt-10 text-sm text-muted">상품 정보를 불러오는 중입니다.</p>
      ) : null}

      {product ? (
        <>
          <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)] lg:gap-12">
            <div className="space-y-3">
              <div className="aspect-square overflow-hidden rounded-lg bg-soft">
                <img
                  src={mainPicture}
                  alt={product.name}
                  className="h-full w-full object-cover"
                />
              </div>
              {product.itemPictures.length > 1 ? (
                <div className="grid grid-cols-4 gap-3">
                  {product.itemPictures.slice(0, 4).map((picture, index) => (
                    <div
                      key={`${picture.url}-${index}`}
                      className="aspect-square overflow-hidden rounded-md bg-soft"
                    >
                      <img
                        src={picture.url}
                        alt={`${product.name} ${index + 1}`}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="lg:pt-2">
              <p className="text-sm font-medium text-muted">Hable Bedding</p>
              <h1 className="mt-2 text-[28px] font-semibold leading-tight text-ink sm:text-[34px]">
                {product.name}
              </h1>

              <div className="mt-5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                {discountRate > 0 ? (
                  <>
                    <span className="text-lg font-semibold text-accent">
                      {discountRate}%
                    </span>
                    <span className="text-base text-muted line-through">
                      {currencyFormatter.format(product.price)}원
                    </span>
                  </>
                ) : null}
                <span className="text-2xl font-semibold text-ink">
                  {currencyFormatter.format(product.salePrice)}원
                </span>
              </div>

              <dl className="mt-8 divide-y divide-hairline border-y border-hairline text-sm">
                <div className="grid grid-cols-[96px_1fr] gap-4 py-4">
                  <dt className="font-medium text-muted">배송비</dt>
                  <dd className="text-ink">
                    {product.shippingPrice === 0
                      ? "무료배송"
                      : `${currencyFormatter.format(product.shippingPrice)}원`}
                  </dd>
                </div>
                <div className="grid grid-cols-[96px_1fr] gap-4 py-4">
                  <dt className="font-medium text-muted">색상</dt>
                  <dd className="text-ink">{product.color}</dd>
                </div>
                <div className="grid grid-cols-[96px_1fr] gap-4 py-4">
                  <dt className="font-medium text-muted">사이즈</dt>
                  <dd className="text-ink">{product.size}</dd>
                </div>
              </dl>

              <div className="mt-8 grid grid-cols-[52px_1fr] gap-3">
                <button
                  type="button"
                  onClick={handleLikeToggle}
                  disabled={likeMutation.isPending}
                  className={`flex h-[52px] min-h-[52px] items-center justify-center rounded-md border transition ${
                    product.like
                      ? "border-red-200 bg-red-50 text-red-500"
                      : "border-hairline bg-white text-ink hover:border-ink"
                  }`}
                  aria-label={product.like ? "좋아요 취소" : "좋아요"}
                  aria-pressed={product.like}
                >
                  <Heart
                    size={20}
                    className={product.like ? "fill-red-500 text-red-500" : ""}
                  />
                </button>
                <button
                  type="button"
                  onClick={handleAddCart}
                  disabled={addCartMutation.isPending}
                  className="flex h-[52px] min-h-[52px] items-center justify-center gap-2 rounded-md bg-ink px-5 text-sm font-semibold text-white"
                >
                  <ShoppingCart size={18} />
                  {addCartMutation.isPending ? "담는 중" : "장바구니 담기"}
                </button>
              </div>
              {cartMessage ? (
                <p className="mt-3 rounded-md bg-soft px-3 py-2 text-sm text-body">
                  {cartMessage}
                </p>
              ) : null}
              {likeMessage ? (
                <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
                  {likeMessage}
                </p>
              ) : null}
              <button
                type="button"
                onClick={openPurchaseModal}
                className="mt-3 flex h-[52px] min-h-[52px] w-full items-center justify-center gap-2 rounded-md bg-accent px-5 text-sm font-semibold text-white"
              >
                <ShoppingBag size={18} />
                바로 구매
              </button>

              <div className="mt-6 flex items-start gap-3 rounded-md bg-soft p-4 text-sm text-body">
                <Truck size={18} className="mt-0.5 shrink-0 text-muted" />
                <p>결제 완료 후 평균 2-3영업일 내 출고됩니다.</p>
              </div>
            </div>
          </div>

          <div className="mt-14 border-t border-hairline">
            <ProductSectionTabs
              tabs={[
                { id: "info", label: "상품 정보" },
                { id: "review", label: `리뷰 ${reviews.length}` },
                { id: "qna", label: `Q&A ${product.questions.length}` },
              ]}
              selectedId={selectedSectionId}
              onSelect={scrollToSection}
            />

            <div className="divide-y divide-hairline">
              <article
                ref={infoSectionRef}
                className="scroll-mt-[140px] py-10"
              >
                <h2 className="text-xl font-semibold text-ink">상품 정보</h2>
                <p className="mt-5 max-w-4xl whitespace-pre-line leading-7 text-body">
                  {product.information}
                </p>
              </article>

              <section
                ref={reviewSectionRef}
                className="scroll-mt-[140px] py-10"
              >
                <ProductReviews reviews={reviews} formatDate={formatDate} />
              </section>

              <section
                ref={qnaSectionRef}
                className="scroll-mt-[140px] py-10"
              >
                <ProductQuestions
                  itemId={product.itemId}
                  questions={product.questions}
                  formatDate={formatDate}
                />
              </section>
            </div>
          </div>

          {isPurchaseModalOpen ? (
            <div
              className="fixed inset-0 z-50 flex items-end bg-black/40 px-0 sm:items-center sm:justify-center sm:px-4"
              role="dialog"
              aria-modal="true"
              aria-labelledby="purchase-modal-title"
            >
              <div className="max-h-[92vh] w-full overflow-y-auto rounded-t-lg bg-white p-5 shadow-soft sm:max-w-[520px] sm:rounded-lg sm:p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted">옵션 선택</p>
                    <h2 id="purchase-modal-title" className="mt-1 text-xl font-semibold text-ink">
                      {product.name}
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPurchaseModalOpen(false)}
                    className="flex size-10 shrink-0 items-center justify-center rounded-full border border-hairline text-ink"
                    aria-label="닫기"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="mt-6 space-y-6">
                  <section>
                    <h3 className="text-sm font-semibold text-ink">색상</h3>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {colorOptions.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => {
                            setSelectedColor(color);
                            setPurchaseError("");
                          }}
                          className={`h-10 rounded-md border px-4 text-sm font-medium transition ${
                            selectedColor === color
                              ? "border-ink bg-ink text-white"
                              : "border-hairline bg-white text-body hover:border-ink"
                          }`}
                        >
                          {color}
                        </button>
                      ))}
                    </div>
                  </section>

                  <section>
                    <h3 className="text-sm font-semibold text-ink">사이즈</h3>
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      {sizeOptions.map((size) => (
                        <button
                          key={size}
                          type="button"
                          onClick={() => {
                            setSelectedSize(size);
                            setPurchaseError("");
                          }}
                          className={`h-11 rounded-md border text-sm font-semibold transition ${
                            selectedSize === size
                              ? "border-ink bg-ink text-white"
                              : "border-hairline bg-white text-body hover:border-ink"
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </section>

                  <section className="flex items-center justify-between border-y border-hairline py-4">
                    <div>
                      <h3 className="text-sm font-semibold text-ink">수량</h3>
                      <p className="mt-1 text-sm text-muted">
                        {currencyFormatter.format(product.salePrice)}원 / 개
                      </p>
                    </div>
                    <div className="flex h-10 items-center rounded-full border border-hairline">
                      <button
                        type="button"
                        onClick={() => setQuantity((current) => Math.max(1, current - 1))}
                        className="flex size-10 items-center justify-center text-ink disabled:text-muted"
                        disabled={quantity <= 1}
                        aria-label="수량 줄이기"
                      >
                        <Minus size={16} />
                      </button>
                      <span className="w-10 text-center text-sm font-semibold">{quantity}</span>
                      <button
                        type="button"
                        onClick={() => setQuantity((current) => current + 1)}
                        className="flex size-10 items-center justify-center text-ink"
                        aria-label="수량 늘리기"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </section>

                  <section className="space-y-2 rounded-md bg-soft p-4 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted">상품 금액</span>
                      <span className="font-medium text-ink">
                        {currencyFormatter.format(subtotal)}원
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-hairline pt-3 text-base">
                      <span className="font-semibold text-ink">주문서 상품 금액</span>
                      <span className="font-semibold text-accent">
                        {currencyFormatter.format(subtotal)}원
                      </span>
                    </div>
                  </section>

                  {purchaseError ? (
                    <p className="rounded-md border border-accent/30 bg-accent/5 px-3 py-2 text-sm text-accent">
                      {purchaseError}
                    </p>
                  ) : null}

                  <button
                    type="button"
                    onClick={confirmPurchase}
                    className="flex h-12 w-full items-center justify-center rounded-md bg-ink px-5 text-sm font-semibold text-white"
                  >
                    구매 진행
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </>
      ) : null}
    </section>
  );
}
