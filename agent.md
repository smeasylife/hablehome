# Hablehome Frontend Agent Guide

이 문서는 프론트엔드 프로젝트에서 작업할 때 먼저 확인할 운영 규칙입니다.

## 프로젝트 개요

- 역할: HABLE 쇼핑몰 사용자 웹 프론트엔드
- 루트: `hablehome`
- 앱 진입점: `src/main.tsx`, `src/App.tsx`
- 라우팅: `react-router-dom`
- 서버 통신: Axios 기반 `src/api/client.ts`

## 사용 도구와 라이브러리

| 영역 | 도구 |
|---|---|
| 빌드 | Vite 6 |
| UI | React 19, React DOM 19 |
| 언어 | TypeScript 5 |
| 라우팅 | React Router DOM 7 |
| 서버 상태 | TanStack React Query 5 |
| HTTP | Axios |
| 스타일 | Tailwind CSS 3, PostCSS, Autoprefixer |
| 아이콘 | lucide-react |
| 결제 | Toss Payments 브라우저 SDK |
| 주소 검색 | 다음 우편번호 브라우저 SDK |
| 소셜 로그인 | Kakao OAuth authorization code flow |

## 주요 명령어

```bash
npm run dev
npm run build
npm run preview
```

## 환경 변수

| 변수 | 용도 | 기본값/비고 |
|---|---|---|
| `VITE_API_BASE_URL` | 백엔드 API base URL | 미설정 시 `https://hablehome.store/` |
| `VITE_KAKAO_REST_API_KEY` | 카카오 로그인 REST API 키 | 없으면 카카오 로그인 버튼에서 오류 표시 |
| `VITE_TOSS_CLIENT_KEY` | Toss Payments 클라이언트 키 | 없으면 개발 완료 처리로 우회 |

## 코딩 원칙

- API 호출은 `src/api`에 함수로 모으고, 화면에서는 직접 Axios를 호출하지 않습니다.
- API 타입은 `src/types` 또는 API 파일의 export type으로 명시합니다.
- 서버 상태는 React Query를 사용하고 mutation 성공 후 관련 query를 invalidate합니다.
- 세션 인증은 서버 쿠키와 CSRF 토큰 흐름을 유지합니다. 임의 토큰을 localStorage에 저장하지 않습니다.
- 새 화면은 `src/App.tsx`에 라우트를 등록하고, 페이지 단위 컴포넌트는 `src/pages`에 둡니다.
- 재사용 UI는 `src/components`에 둡니다.
- 스타일은 기존 Tailwind 토큰과 `docs/design.md`의 시각 언어를 우선합니다.
- 서버 원본 데이터가 필요한 기능은 localStorage가 아니라 백엔드 API를 추가하는 방향을 우선합니다.

## 디렉토리 안내

| 경로 | 내용 |
|---|---|
| `src/api` | 백엔드 API 호출 함수와 공통 Axios 클라이언트 |
| `src/types` | API 요청/응답 및 화면 데이터 타입 |
| `src/pages` | 라우트 단위 페이지 |
| `src/components` | 재사용 컴포넌트 |
| `src/hooks` | 공유 훅 |
| `src/data` | 카테고리, mock/local 데이터 유틸 |
| `docs` | 프로젝트 문서 |

## 문서 안내

| 문서 | 어디서 확인할 내용 |
|---|---|
| `docs/index.md` | 문서 목록과 데이터 위치 빠른 안내 |
| `docs/api.md` | 프론트가 호출하는 API, 요청/응답 타입, 인증/CSRF 흐름 |
| `docs/db-schema.md` | 프론트 데이터 모델, React Query 캐시, localStorage 스키마 |
| `docs/design.md` | 디자인 토큰과 UI 원칙 |

## 백엔드와 맞출 때

- API 경로와 payload는 `hablehome-server/docs/api.md`와 함께 확인합니다.
- DB 테이블과 실제 엔티티 관계는 `hablehome-server/docs/db-schema.md`가 기준입니다.
- CORS 허용 origin은 백엔드 `application-local.yml`의 `FRONTEND_ALLOWED_ORIGINS` 기본값과 맞춰야 합니다.
