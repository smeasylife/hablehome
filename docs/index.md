# Hablehome Frontend Docs

프론트엔드에서 필요한 정보가 어디에 있는지 빠르게 찾기 위한 문서 인덱스입니다.

## 문서 목록

| 문서 | 내용 | 이런 때 확인 |
|---|---|---|
| `docs/api.md` | 프론트엔드가 호출하는 백엔드 API, 요청/응답 타입, 인증/CSRF 처리 | 화면에서 어떤 API를 호출하는지, payload 모양이 필요한 경우 |
| `docs/db-schema.md` | 프론트엔드 관점의 데이터 모델, React Query 캐시 키, localStorage 스키마 | 페이지 상태, 브라우저 저장 데이터, 서버 모델 매핑을 확인할 때 |
| `docs/design.md` | UI 톤앤매너, 색상, 타이포그래피, 레이아웃 기준 | 컴포넌트 스타일 또는 새 화면 디자인을 맞출 때 |
| `agent.md` | 프로젝트 도구, 환경 변수, 코딩 원칙, 문서 위치 안내 | 작업 시작 전 전체 운영 규칙을 확인할 때 |

## 데이터 위치 가이드

| 필요한 데이터 | 위치 |
|---|---|
| API base URL, CSRF, 쿠키 인증 | `src/api/client.ts` |
| 인증/회원가입/카카오 로그인 API | `src/api/auth.ts`, `src/pages/LoginPage.tsx` |
| 상품 목록/상세/좋아요/리뷰 API | `src/api/items.ts`, `src/types/item.ts` |
| 장바구니 API | `src/api/cart.ts`, `src/types/cart.ts` |
| 주문/결제 API | `src/api/orders.ts`, `src/api/payments.ts`, `src/types/order.ts` |
| 문의 API | `src/api/questions.ts`, `src/components/ProductQuestions.tsx` |
| React Query 현재 로그인 사용자 | `src/hooks/useCurrentMember.ts` |
| 임시/레거시 로컬 데이터 | `src/data/localCart.ts`, `src/data/localPurchases.ts`, `src/data/localReviews.ts`, `src/data/localSession.ts` |
| 라우팅 | `src/App.tsx` |
| Tailwind 토큰 | `tailwind.config.js`, `src/index.css` |

## 백엔드 문서와 맞춰 보기

프론트 API 문서는 백엔드 컨트롤러와 DTO를 기준으로 작성되어 있습니다. 서버 측 권한, DB 테이블, 비즈니스 규칙이 필요하면 `../hablehome-server/docs`의 문서를 함께 확인하세요.
