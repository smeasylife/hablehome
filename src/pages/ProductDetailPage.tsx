import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
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
import { resolveApiAssetUrl } from "../api/client";
import { getItem, likeItem, unlikeItem } from "../api/items";
import { ProductReviews } from "../components/ProductReviews";
import { ProductQuestions } from "../components/ProductQuestions";
import { ProductSectionTabs } from "../components/ProductSectionTabs";
import type { ItemDetailResponse, ItemListResponse } from "../types/item";
import type { OrderPageState } from "../types/order";

const currencyFormatter = new Intl.NumberFormat("ko-KR");
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

function formatAdditionalPrice(additionalPrice?: number) {
  const price = additionalPrice ?? 0;
  return price > 0 ? `+${currencyFormatter.format(price)}원` : "";
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
  const [selectedPictureIndex, setSelectedPictureIndex] = useState(0);
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
  const pictureUrls = product?.itemPictures.map((picture) => resolveApiAssetUrl(picture.url)) ?? [];
  const mainPicture = pictureUrls[selectedPictureIndex] ?? pictureUrls[0] ?? "";
  const optionItems = product?.options ?? [];
  const colorOptions = useMemo(() => {
    if (!product) {
      return [];
    }

    return Array.from(new Set(optionItems.map((option) => option.color).filter(Boolean)));
  }, [product]);
  const sizeOptions = useMemo(() => {
    if (!product || !selectedColor) {
      return [];
    }

    return optionItems
      .filter((option) => option.color === selectedColor)
      .map((option) => option.size);
  }, [product, selectedColor, optionItems]);
  const firstAvailableOption = useMemo(
    () => optionItems.find((option) => !option.soldOut),
    [optionItems],
  );
  const selectedOption = useMemo(
    () =>
      optionItems.find(
        (option) => option.color === selectedColor && option.size === selectedSize,
      ),
    [optionItems, selectedColor, selectedSize],
  );
  const canPurchaseSelectedOption = Boolean(selectedOption && !selectedOption.soldOut);
  const selectedAdditionalPrice = selectedOption?.additionalPrice ?? 0;
  const selectedListPrice = product ? product.price + selectedAdditionalPrice : 0;
  const selectedUnitPrice = product
    ? product.salePrice + selectedAdditionalPrice
    : 0;
  const subtotal = selectedUnitPrice * quantity;
  const discountRate =
    product && selectedListPrice > selectedUnitPrice
      ? Math.round(((selectedListPrice - selectedUnitPrice) / selectedListPrice) * 100)
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

    if (!canPurchaseSelectedOption) {
      setCartMessage("구매 가능한 옵션을 선택해 주세요.");
      return;
    }

    setCartMessage("");
    addCartMutation.mutate({
      itemId: product.itemId,
      color: selectedColor,
      size: selectedSize,
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

  useEffect(() => {
    if (!product) {
      return;
    }

    const hasSelectedOption = optionItems.some(
      (option) => option.color === selectedColor && option.size === selectedSize,
    );
    if (hasSelectedOption) {
      return;
    }

    if (firstAvailableOption) {
      setSelectedColor(firstAvailableOption.color);
      setSelectedSize(firstAvailableOption.size);
      return;
    }

    setSelectedColor(colorOptions[0] || "");
    setSelectedSize("");
  }, [product, optionItems, selectedColor, selectedSize, firstAvailableOption, colorOptions]);

  useEffect(() => {
    if (!selectedOption) {
      return;
    }

    setQuantity((current) =>
      Math.min(Math.max(1, current), Math.max(1, selectedOption.stockQuantity)),
    );
  }, [selectedOption]);

  useEffect(() => {
    if (!selectedColor) {
      return;
    }

    const sameColorOptions = optionItems.filter((option) => option.color === selectedColor);
    if (sameColorOptions.some((option) => option.size === selectedSize)) {
      return;
    }

    const nextOption = sameColorOptions.find((option) => !option.soldOut) ?? sameColorOptions[0];
    setSelectedSize(nextOption?.size ?? "");
  }, [optionItems, selectedColor, selectedSize]);

  useEffect(() => {
    setSelectedPictureIndex(0);
  }, [product?.itemId]);

  useEffect(() => {
    if (selectedPictureIndex >= pictureUrls.length) {
      setSelectedPictureIndex(Math.max(0, pictureUrls.length - 1));
    }
  }, [pictureUrls.length, selectedPictureIndex]);

  const openPurchaseModal = () => {
    if (!product) {
      return;
    }

    if (!canPurchaseSelectedOption) {
      setPurchaseError("구매 가능한 옵션을 선택해 주세요.");
      return;
    }

    setQuantity((current) =>
      Math.min(Math.max(1, current), selectedOption?.stockQuantity ?? 1),
    );
    setPurchaseError("");
    setPurchaseModalOpen(true);
  };

  const confirmPurchase = () => {
    if (!product) {
      return;
    }

    if (!canPurchaseSelectedOption) {
      setPurchaseError("구매 가능한 옵션을 선택해 주세요.");
      return;
    }
    if (selectedOption && quantity > selectedOption.stockQuantity) {
      setPurchaseError("선택한 옵션의 재고 수량을 초과했습니다.");
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
          unitPrice: selectedUnitPrice,
          pictureUrl: resolveApiAssetUrl(product.itemPictures[0]?.url),
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
              <div className="relative aspect-[4/5] overflow-hidden rounded-lg bg-soft">
                {mainPicture ? (
                  <img
                    src={mainPicture}
                    alt={product.name}
                    className="h-full w-full object-cover"
                  />
                ) : null}
                {pictureUrls.length > 1 ? (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedPictureIndex((current) =>
                          current === 0 ? pictureUrls.length - 1 : current - 1,
                        )
                      }
                      className="absolute left-3 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-ink shadow-soft"
                      aria-label="이전 이미지"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedPictureIndex((current) =>
                          current === pictureUrls.length - 1 ? 0 : current + 1,
                        )
                      }
                      className="absolute right-3 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-ink shadow-soft"
                      aria-label="다음 이미지"
                    >
                      <ChevronRight size={20} />
                    </button>
                    <div className="absolute bottom-3 right-3 rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-white">
                      {selectedPictureIndex + 1} / {pictureUrls.length}
                    </div>
                  </>
                ) : null}
              </div>
              {pictureUrls.length > 1 ? (
                <div className="grid grid-cols-4 gap-3 sm:grid-cols-5">
                  {pictureUrls.map((pictureUrl, index) => (
                    <button
                      type="button"
                      key={`${pictureUrl}-${index}`}
                      onClick={() => setSelectedPictureIndex(index)}
                      className={`aspect-[4/5] overflow-hidden rounded-md border bg-soft ${
                        selectedPictureIndex === index ? "border-ink" : "border-transparent"
                      }`}
                      aria-label={`${index + 1}번째 이미지 보기`}
                    >
                      <img
                        src={pictureUrl}
                        alt={`${product.name} ${index + 1}`}
                        className="h-full w-full object-cover"
                      />
                    </button>
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
                      {currencyFormatter.format(selectedListPrice)}원
                    </span>
                  </>
                ) : null}
                <span className="text-2xl font-semibold text-ink">
                  {currencyFormatter.format(selectedUnitPrice)}원
                </span>
                {selectedAdditionalPrice > 0 ? (
                  <span className="text-sm font-medium text-muted">
                    옵션 추가금 {formatAdditionalPrice(selectedAdditionalPrice)} 반영
                  </span>
                ) : null}
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

              <div className="mt-8 space-y-6">
                <section>
                  <h2 className="text-sm font-semibold text-ink">색상</h2>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {colorOptions.length > 0 ? (
                      colorOptions.map((color) => {
                        const soldOut = optionItems
                          .filter((option) => option.color === color)
                          .every((option) => option.soldOut);

                        return (
                          <button
                            key={color}
                            type="button"
                            onClick={() => {
                              setSelectedColor(color);
                              setPurchaseError("");
                              setCartMessage("");
                            }}
                            disabled={soldOut}
                            className={`h-10 rounded-md border px-4 text-sm font-medium transition disabled:border-hairline disabled:bg-soft disabled:text-muted ${
                              selectedColor === color
                                ? "border-ink bg-ink text-white"
                                : "border-hairline bg-white text-body hover:border-ink"
                            }`}
                          >
                            {color}
                          </button>
                        );
                      })
                    ) : (
                      <p className="text-sm text-muted">등록된 판매 옵션이 없습니다.</p>
                    )}
                  </div>
                </section>

                {selectedColor ? (
                  <section>
                    <h2 className="text-sm font-semibold text-ink">사이즈</h2>
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      {sizeOptions.map((size) => {
                        const option = optionItems.find(
                          (itemOption) =>
                            itemOption.color === selectedColor && itemOption.size === size,
                        );

                        return (
                          <button
                            key={size}
                            type="button"
                            onClick={() => {
                              setSelectedSize(size);
                              setPurchaseError("");
                              setCartMessage("");
                            }}
                            disabled={!option || option.soldOut}
                            className={`min-h-14 rounded-md border px-2 py-2 text-sm font-semibold transition disabled:border-hairline disabled:bg-soft disabled:text-muted ${
                              selectedSize === size
                                ? "border-ink bg-ink text-white"
                                : "border-hairline bg-white text-body hover:border-ink"
                            }`}
                          >
                            <span className="block">{size}</span>
                            {option && option.additionalPrice > 0 ? (
                              <span className="mt-0.5 block text-[11px] font-medium">
                                {formatAdditionalPrice(option.additionalPrice)}
                              </span>
                            ) : null}
                            {option?.soldOut ? (
                              <span className="mt-0.5 block text-[11px] font-medium">품절</span>
                            ) : null}
                          </button>
                        );
                      })}
                    </div>
                    {selectedOption ? (
                      <p className="mt-2 text-sm text-muted">
                        {selectedOption.soldOut
                          ? "선택한 옵션은 품절입니다."
                          : `남은 수량 ${selectedOption.stockQuantity}개`}
                      </p>
                    ) : null}
                  </section>
                ) : null}
              </div>

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
                  disabled={addCartMutation.isPending || !canPurchaseSelectedOption}
                  className="flex h-[52px] min-h-[52px] items-center justify-center gap-2 rounded-md bg-ink px-5 text-sm font-semibold text-white disabled:bg-muted"
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
                disabled={!canPurchaseSelectedOption}
                className="mt-3 flex h-[52px] min-h-[52px] w-full items-center justify-center gap-2 rounded-md bg-accent px-5 text-sm font-semibold text-white disabled:bg-muted"
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
                {pictureUrls.length > 0 ? (
                  <div className="mt-8 max-w-4xl space-y-4">
                    {pictureUrls.map((pictureUrl, index) => (
                      <img
                        key={`${pictureUrl}-detail-${index}`}
                        src={pictureUrl}
                        alt={`${product.name} 상세 이미지 ${index + 1}`}
                        className="w-full rounded-md bg-soft object-cover"
                        loading="lazy"
                      />
                    ))}
                  </div>
                ) : null}
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
                          disabled={optionItems
                            .filter((option) => option.color === color)
                            .every((option) => option.soldOut)}
                          className={`h-10 rounded-md border px-4 text-sm font-medium transition disabled:border-hairline disabled:bg-soft disabled:text-muted ${
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
                      {sizeOptions.map((size) => {
                        const option = optionItems.find(
                          (itemOption) =>
                            itemOption.color === selectedColor && itemOption.size === size,
                        );

                        return (
                          <button
                            key={size}
                            type="button"
                            onClick={() => {
                              setSelectedSize(size);
                              setPurchaseError("");
                            }}
                            disabled={!option || option.soldOut}
                            className={`min-h-14 rounded-md border px-2 py-2 text-sm font-semibold transition disabled:border-hairline disabled:bg-soft disabled:text-muted ${
                              selectedSize === size
                                ? "border-ink bg-ink text-white"
                                : "border-hairline bg-white text-body hover:border-ink"
                            }`}
                          >
                            <span className="block">{size}</span>
                            {option && option.additionalPrice > 0 ? (
                              <span className="mt-0.5 block text-[11px] font-medium">
                                {formatAdditionalPrice(option.additionalPrice)}
                              </span>
                            ) : null}
                            {option?.soldOut ? (
                              <span className="mt-0.5 block text-[11px] font-medium">품절</span>
                            ) : null}
                          </button>
                        );
                      })}
                    </div>
                  </section>

                  <section className="flex items-center justify-between border-y border-hairline py-4">
                    <div>
                      <h3 className="text-sm font-semibold text-ink">수량</h3>
                      <p className="mt-1 text-sm text-muted">
                        {currencyFormatter.format(selectedUnitPrice)}원 / 개
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
                        onClick={() =>
                          setQuantity((current) =>
                            Math.min(selectedOption?.stockQuantity ?? current, current + 1),
                          )
                        }
                        className="flex size-10 items-center justify-center text-ink"
                        disabled={quantity >= (selectedOption?.stockQuantity ?? 1)}
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
