import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

type PromoBanner = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  imageUrl: string;
  mobileImageUrl: string;
  to: string;
  ctaLabel: string;
};

const promoBanners: PromoBanner[] = [
  {
    id: "clean-cotton",
    eyebrow: "New Arrival",
    title: "하루 끝을 더 부드럽게",
    description: "클린 코튼 차렵이불과 함께 침실의 계절감을 바꿔보세요.",
    imageUrl:
      "https://images.unsplash.com/photo-1616627561950-9f746e330187?auto=format&fit=crop&w=1800&q=85",
    mobileImageUrl:
      "https://images.unsplash.com/photo-1616627561950-9f746e330187?auto=format&fit=crop&w=900&q=85",
    to: "/items/1",
    ctaLabel: "상품 보기",
  },
  {
    id: "modal-stripe",
    eyebrow: "Weekend Event",
    title: "모달 침구 세트 특별가",
    description: "차분한 스트라이프와 매끈한 촉감을 이번 주 혜택으로 만나보세요.",
    imageUrl:
      "https://images.unsplash.com/photo-1631049035182-249067d7618e?auto=format&fit=crop&w=1800&q=85",
    mobileImageUrl:
      "https://images.unsplash.com/photo-1631049035182-249067d7618e?auto=format&fit=crop&w=900&q=85",
    to: "/items/2",
    ctaLabel: "이벤트 보기",
  },
  {
    id: "goose-winter",
    eyebrow: "Best Bedding",
    title: "포근함이 오래 남는 침구",
    description: "프리미엄 구스 이불로 침실에 깊은 휴식을 더하세요.",
    imageUrl:
      "https://images.unsplash.com/photo-1615874694520-474822394e73?auto=format&fit=crop&w=1800&q=85",
    mobileImageUrl:
      "https://images.unsplash.com/photo-1615874694520-474822394e73?auto=format&fit=crop&w=900&q=85",
    to: "/items/5",
    ctaLabel: "베스트 보기",
  },
];

export function HomePromoBanner() {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeBanner = promoBanners[activeIndex] ?? promoBanners[0];
  const hasMultipleBanners = promoBanners.length > 1;

  const orderedBanners = useMemo(
    () =>
      promoBanners.map((banner, index) => ({
        ...banner,
        selected: index === activeIndex,
      })),
    [activeIndex],
  );

  const moveBanner = (direction: "previous" | "next") => {
    setActiveIndex((current) => {
      if (direction === "previous") {
        return current === 0 ? promoBanners.length - 1 : current - 1;
      }

      return current === promoBanners.length - 1 ? 0 : current + 1;
    });
  };

  if (!activeBanner) {
    return null;
  }

  return (
    <section className="relative isolate min-h-[420px] overflow-hidden bg-ink sm:min-h-[520px] lg:min-h-[620px]">
      <picture className="absolute inset-0 -z-20 block h-full w-full">
        <source media="(min-width: 640px)" srcSet={activeBanner.imageUrl} />
        <img
          src={activeBanner.mobileImageUrl}
          alt=""
          className="h-full w-full object-cover"
        />
      </picture>
      <div className="absolute inset-0 -z-10 bg-black/35" />

      <div className="mx-auto flex min-h-[420px] max-w-6xl flex-col justify-end px-4 pb-12 pt-16 text-white sm:min-h-[520px] sm:px-6 sm:pb-16 lg:min-h-[620px]">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/80">
          {activeBanner.eyebrow}
        </p>
        <h2 className="mt-3 max-w-3xl text-[34px] font-semibold leading-tight sm:text-[48px] lg:text-[58px]">
          {activeBanner.title}
        </h2>
        <p className="mt-4 max-w-xl text-base leading-7 text-white/82 sm:text-lg">
          {activeBanner.description}
        </p>
        <Link
          to={activeBanner.to}
          className="mt-7 flex h-11 w-fit items-center justify-center rounded-md bg-white px-5 text-sm font-semibold text-ink transition hover:bg-white/90"
        >
          {activeBanner.ctaLabel}
        </Link>
      </div>

      {hasMultipleBanners ? (
        <>
          <button
            type="button"
            aria-label="이전 배너"
            onClick={() => moveBanner("previous")}
            className="absolute left-4 top-1/2 hidden size-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/25 text-white transition hover:bg-black/40 sm:flex"
          >
            <ChevronLeft size={22} />
          </button>
          <button
            type="button"
            aria-label="다음 배너"
            onClick={() => moveBanner("next")}
            className="absolute right-4 top-1/2 hidden size-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/25 text-white transition hover:bg-black/40 sm:flex"
          >
            <ChevronRight size={22} />
          </button>
          <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 items-center gap-2">
            {orderedBanners.map((banner, index) => (
              <button
                key={banner.id}
                type="button"
                aria-label={`${index + 1}번째 배너 보기`}
                aria-current={banner.selected}
                onClick={() => setActiveIndex(index)}
                className={`h-1.5 rounded-full transition ${
                  banner.selected ? "w-8 bg-white" : "w-2 bg-white/50 hover:bg-white/75"
                }`}
              />
            ))}
          </div>
        </>
      ) : null}
    </section>
  );
}
