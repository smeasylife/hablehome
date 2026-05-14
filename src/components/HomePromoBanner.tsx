import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { getPromoBanners } from "../api/banners";
import { resolveApiAssetUrl } from "../api/client";

export function HomePromoBanner() {
  const [activeIndex, setActiveIndex] = useState(0);
  const { data: promoBanners = [] } = useQuery({
    queryKey: ["promo-banners"],
    queryFn: getPromoBanners,
  });
  const activeBanner = promoBanners[activeIndex] ?? promoBanners[0];
  const hasMultipleBanners = promoBanners.length > 1;

  useEffect(() => {
    if (activeIndex >= promoBanners.length) {
      setActiveIndex(0);
    }
  }, [activeIndex, promoBanners.length]);

  const orderedBanners = useMemo(
    () =>
      promoBanners.map((banner, index) => ({
        ...banner,
        selected: index === activeIndex,
      })),
    [activeIndex, promoBanners],
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
        <source media="(min-width: 640px)" srcSet={resolveApiAssetUrl(activeBanner.imageUrl)} />
        <img
          src={resolveApiAssetUrl(activeBanner.imageUrl)}
          alt=""
          className="h-full w-full object-cover"
        />
      </picture>
      <div className="absolute inset-0 -z-10 bg-black/35" />

      <div className="mx-auto flex min-h-[420px] max-w-6xl flex-col justify-end px-4 pb-12 pt-16 text-white sm:min-h-[520px] sm:px-6 sm:pb-16 lg:min-h-[620px]">
        <h2 className="mt-3 max-w-3xl text-[34px] font-semibold leading-tight sm:text-[48px] lg:text-[58px]">
          {activeBanner.largeText}
        </h2>
        <p className="mt-4 max-w-xl text-base leading-7 text-white/82 sm:text-lg">
          {activeBanner.smallText}
        </p>
        {activeBanner.linkUrl ? (
          <Link
            to={activeBanner.linkUrl}
            className="mt-7 flex h-11 w-fit items-center justify-center rounded-md bg-white px-5 text-sm font-semibold text-ink transition hover:bg-white/90"
          >
            {activeBanner.buttonLabel}
          </Link>
        ) : null}
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
