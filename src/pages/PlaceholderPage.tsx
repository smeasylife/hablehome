import { Link } from "react-router-dom";

type PlaceholderPageProps = {
  title: string;
};

export function PlaceholderPage({ title }: PlaceholderPageProps) {
  return (
    <section className="mx-auto flex min-h-[calc(100vh-73px)] max-w-3xl flex-col items-center justify-center px-4 text-center">
      <p className="text-sm font-medium text-muted">Hable</p>
      <h1 className="mt-2 text-3xl font-semibold">{title}</h1>
      <p className="mt-3 text-body">
        메인 화면 연결을 확인하기 위한 임시 페이지입니다.
      </p>
      <Link
        to="/"
        className="mt-8 rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white"
      >
        메인으로 돌아가기
      </Link>
    </section>
  );
}
