const businessInfo = [
  { label: "상호명", value: "HABLE" },
  { label: "대표", value: "해인" },
  { label: "사업자등록번호", value: "000-00-00000" },
  { label: "통신판매업신고번호", value: "제2026-서울강남-0000호" },
  { label: "주소", value: "서울특별시 강남구 테헤란로 000, HABLE" },
  { label: "고객센터", value: "02-0000-0000" },
  { label: "이메일", value: "support@hablehome.store" },
];

export function BusinessFooter() {
  return (
    <footer className="mt-16 border-t border-hairline bg-soft">
      <div className="mx-auto max-w-6xl px-4 py-9 sm:px-6">
        <div className="flex flex-col gap-7 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-sm">
            <p
              className="text-[24px] font-bold leading-none tracking-normal text-ink"
              style={{
                fontFamily:
                  '"Airbnb Cereal VF", Circular, "Avenir Next", ui-rounded, system-ui, sans-serif',
              }}
            >
              hable
            </p>
            <p className="mt-3 text-sm leading-6 text-muted">
              일상의 휴식을 정돈하는 침구와 홈 패브릭을 소개합니다.
            </p>
          </div>

          <dl className="grid flex-1 gap-x-8 gap-y-2 text-xs leading-6 text-muted sm:grid-cols-2 lg:max-w-2xl">
            {businessInfo.map(({ label, value }) => (
              <div key={label} className="flex min-w-0 gap-2">
                <dt className="shrink-0 font-medium text-body">{label}</dt>
                <dd className="min-w-0 break-keep">{value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="mt-7 flex flex-col gap-3 border-t border-hairline pt-5 text-xs leading-6 text-muted md:flex-row md:items-center md:justify-between">
          <p>Copyright 2026 HABLE. All rights reserved.</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            <a href="#" className="hover:text-ink">
              이용약관
            </a>
            <a href="#" className="font-medium text-body hover:text-ink">
              개인정보처리방침
            </a>
            <a href="#" className="hover:text-ink">
              고객센터
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
