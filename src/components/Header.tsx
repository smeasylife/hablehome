import { Search, ShoppingBag, X } from "lucide-react";
import { type FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCurrentMember } from "../hooks/useCurrentMember";

export function Header() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");
  const navigate = useNavigate();
  const { data: member } = useCurrentMember();

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedKeyword = searchKeyword.trim();
    if (!trimmedKeyword) {
      return;
    }

    navigate(`/search?keyword=${encodeURIComponent(trimmedKeyword)}`);
    setSearchKeyword(trimmedKeyword);
    setIsSearchOpen(false);
  };

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-hairline bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-[72px] max-w-6xl items-center justify-end px-4 sm:px-6">
        <Link
          to="/"
          className="absolute left-1/2 -translate-x-1/2 text-[25px] font-bold leading-none tracking-normal text-ink"
          style={{
            fontFamily:
              '"Airbnb Cereal VF", Circular, "Avenir Next", ui-rounded, system-ui, sans-serif',
          }}
          aria-label="Hable 홈"
        >
          hable
        </Link>

        <div className="flex items-center gap-1">
          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-soft"
            aria-label="상품 검색"
            aria-expanded={isSearchOpen}
            onClick={() => setIsSearchOpen((isOpen) => !isOpen)}
          >
            <Search size={21} strokeWidth={1.8} />
          </button>
          <Link
            to="/cart"
            className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-soft"
            aria-label="장바구니"
          >
            <ShoppingBag size={21} strokeWidth={1.8} />
          </Link>
          <Link
            to={member ? "/mypage" : "/login"}
            className={`flex h-9 min-w-[84px] items-center justify-center rounded-full px-4 text-sm font-semibold transition-colors ${
              member
                ? "bg-ink text-white hover:bg-body"
                : "bg-ink text-white hover:bg-body"
            }`}
            aria-label={member ? "마이페이지" : "로그인"}
          >
            {member ? "마이페이지" : "Login"}
          </Link>
        </div>
      </div>

      {isSearchOpen ? (
        <div className="border-t border-hairline bg-white">
          <form
            className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-4 sm:px-6"
            onSubmit={handleSearchSubmit}
          >
            <Search size={20} strokeWidth={1.8} className="shrink-0 text-muted" />
            <input
              type="search"
              autoFocus
              value={searchKeyword}
              onChange={(event) => setSearchKeyword(event.target.value)}
              placeholder="상품명 검색"
              className="min-w-0 flex-1 bg-transparent text-base text-ink outline-none placeholder:text-muted"
            />
            <button
              type="submit"
              className="rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white"
            >
              검색
            </button>
            <button
              type="button"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full hover:bg-soft"
              aria-label="검색 닫기"
              onClick={() => setIsSearchOpen(false)}
            >
              <X size={19} strokeWidth={1.8} />
            </button>
          </form>
        </div>
      ) : null}
    </header>
  );
}
