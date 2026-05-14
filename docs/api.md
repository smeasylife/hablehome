# Frontend API Documentation

이 문서는 `src/api/*`와 `src/types/*` 기준으로 프론트엔드가 사용하는 API 계약을 정리합니다.

## 공통 클라이언트

- API 클라이언트: `src/api/client.ts`
- 기본 URL: `VITE_API_BASE_URL`, 미설정 시 `http://localhost:8080`
- timeout: 5초. 단, 회원가입 인증번호 발송은 30초
- 인증 방식: Spring Security 세션 쿠키 `JSESSIONID`, `withCredentials: true`
- CSRF: `POST`, `PUT`, `PATCH`, `DELETE` 요청 전에 `GET /auth/csrf`를 호출하고 응답의 `headerName`에 `token`을 넣음
- CSRF 실패 처리: `403` 응답이면서 `code`가 `CSRF_TOKEN_INVALID`일 때만 캐시된 CSRF 토큰을 초기화하고 새 토큰으로 원 요청을 1회 재시도함

## 에러 형식

백엔드는 공통적으로 아래 형태를 반환합니다.

```json
{
  "success": false,
  "data": null,
  "code": "CSRF_TOKEN_INVALID",
  "message": "오류 메시지"
}
```

`code`는 선택 필드입니다. 일반 비즈니스 에러에는 없을 수 있으며, CSRF 토큰 누락/불일치처럼 프론트가 분기해야 하는 오류에 사용합니다.

프론트에서는 주로 Axios 에러의 `response.data.message`를 사용자 메시지로 사용합니다.

## 인증과 회원가입

### `POST /auth/login`

이메일/비밀번호 로그인입니다. 성공하면 세션 쿠키가 설정됩니다.

Request:

```ts
type LoginPayload = {
  email: string;
  password: string;
};
```

Response:

```ts
type AuthMember = {
  memberId: number;
  nickname: string;
  email: string;
  role: "ROLE_USER" | "ROLE_ADMIN";
};
```

사용 위치: `src/api/auth.ts`, `src/pages/LoginPage.tsx`

### `GET /auth/me`

현재 세션의 로그인 사용자 정보를 조회합니다.

Response: `AuthMember`

사용 위치: `src/hooks/useCurrentMember.ts`

### `POST /auth/logout`

현재 세션을 종료합니다. 성공 응답 본문은 없습니다.

사용 위치: `src/pages/MyPage.tsx`

### `GET /auth/csrf`

상태 변경 요청에 사용할 CSRF 토큰을 조회합니다. 프론트 API 클라이언트가 자동으로 호출합니다.

Response:

```ts
type CsrfTokenResponse = {
  headerName: string;
  parameterName: string;
  token: string;
};
```

### `POST /signup/send-code?email={email}`

회원가입 인증번호를 이메일로 발송합니다.

Response: 문자열 메시지

프론트 동작:

- 요청 timeout은 30초
- 성공 시 5분 타이머를 시작함
- 인증번호 입력값을 초기화함

### `POST /signup/verify-code`

회원가입 인증번호를 검증합니다.

Request:

```ts
type VerifyCodePayload = {
  email: string;
  code: string;
};
```

Response: 문자열 메시지

### `POST /signup`

회원가입을 완료합니다. 백엔드는 이메일 인증 완료 여부를 서버 메모리에서 확인합니다.

Request:

```ts
type SignupPayload = {
  nickname: string;
  email: string;
  password: string;
  phoneNumber: string;
};
```

프론트/백엔드 비밀번호 정책:

- 8자 이상 64자 이하
- 영문자와 숫자를 각각 1개 이상 포함

### `POST /auth/kakao/login`

카카오 OAuth authorization code로 로그인합니다.

Request:

```ts
type KakaoLoginPayload = {
  code: string;
  redirectUri: string;
};
```

Response: `AuthMember`

필요 환경 변수:

- 프론트: `VITE_KAKAO_REST_API_KEY`
- 백엔드: `KAKAO_REST_API_KEY`, 선택적으로 `KAKAO_CLIENT_SECRET`

## 상품

### `GET /items?page={page}`

상품 목록을 조회합니다. 서버는 페이지당 20개를 최신순으로 반환합니다.

Response:

```ts
type ItemListResponse = {
  id: number;
  name: string;
  price: number;
  salePrice: number;
  color: string;
  pictureUrl: string;
  like: boolean;
  categories?: string[];
};
```

사용 위치: `src/pages/HomePage.tsx`, `src/components/ProductGrid.tsx`

### `GET /items/{itemId}`

상품 상세, 이미지, 카테고리, 리뷰, 문의를 조회합니다.

Response:

```ts
type ItemDetailResponse = {
  itemId: number;
  name: string;
  price: number;
  salePrice: number;
  shippingPrice: number;
  size: string;
  color: string;
  information: string;
  itemPictures: { url: string }[];
  categories?: string[];
  like: boolean;
  reviews: ReviewResponse[];
  questions: QuestionResponse[];
};
```

사용 위치: `src/pages/ProductDetailPage.tsx`

### `POST /{itemId}/like`

로그인 사용자가 상품을 좋아요합니다. 중복 좋아요는 서버에서 무시됩니다.

### `DELETE /{itemId}/like`

로그인 사용자가 상품 좋아요를 취소합니다.

## 장바구니

### `POST /{itemId}/cart`

상품을 장바구니에 추가합니다. 같은 상품, 색상, 사이즈가 이미 있으면 수량이 증가합니다.

Request:

```ts
type CartItemRequest = {
  color?: string;
  size?: string;
  quantity?: number;
};
```

백엔드 기본값:

- `color` 미입력 시 상품 기본 색상
- `size` 미입력 시 상품 기본 사이즈
- `quantity` 미입력 시 1

### `GET /cart`

현재 사용자의 장바구니 목록을 조회합니다.

Response:

```ts
type CartItemResponse = {
  cartId: number;
  itemId: number;
  name: string;
  price: number;
  salePrice: number;
  color: string;
  size: string;
  quantity: number;
  pictureUrl: string;
};
```

### `DELETE /cart`

선택한 장바구니 항목을 삭제합니다.

Request:

```ts
{
  cartIds: number[];
}
```

## 주문과 결제

### `POST /orders`

주문을 생성합니다. 장바구니 주문과 즉시 구매 중 하나만 사용할 수 있습니다.

Request:

```ts
type OrderCreateRequest = {
  cartIds?: number[];
  items?: OrderItemRequest[];
  couponId?: number;
  usedPoint?: number;
  shippingAddress: ShippingAddressRequest;
};

type OrderItemRequest = {
  itemId: number;
  color?: string;
  size?: string;
  quantity: number;
};
```

Response:

```ts
type OrderResponse = {
  orderId: number;
  orderNumber: string;
  status: "ORDERED" | "PAID" | "SHIPPING" | "DELIVERED" | "CANCELED";
  createdAt: string;
  canceledAt?: string | null;
  shippingAddress: ShippingAddressResponse;
  items: OrderItemResponse[];
  amount: OrderAmountResponse;
};
```

서버 계산 규칙:

- 상품 금액은 `salePrice > 0`이면 `salePrice`, 아니면 `price`
- 50,000원 이상 무료배송
- 기본 배송비 3,000원
- 쿠폰 할인은 상품 금액을 초과하지 않음
- 포인트는 보유 포인트와 결제 예정 금액을 초과할 수 없음

### `GET /orders`

현재 사용자의 주문 목록을 최신순으로 조회합니다.

### `GET /orders/{orderId}`

현재 사용자의 단일 주문을 조회합니다.

### `POST /orders/{orderId}/cancel`

현재 사용자의 주문을 취소합니다.

서버 규칙:

- `SHIPPING`, `DELIVERED` 상태는 취소 불가
- 취소 시 사용 포인트를 복구함
- 이미 취소된 주문을 다시 취소하면 상태 유지

### Toss Payments SDK

프론트 결제 요청은 백엔드 API가 아니라 Toss Payments 브라우저 SDK를 사용합니다.

- 파일: `src/api/payments.ts`
- SDK URL: `https://js.tosspayments.com/v1/payment`
- 환경 변수: `VITE_TOSS_CLIENT_KEY`
- 미설정 시 개발 편의상 `development-complete`를 반환하고 성공 페이지로 이동함
- 성공 URL: `/payment/success?orderId={orderId}`
- 실패 URL: `/payment/fail?orderId={orderId}`

## 리뷰

### `POST /{itemId}/review`

구매 이력이 있는 로그인 사용자만 리뷰를 작성할 수 있습니다.

Request:

```ts
type ReviewRequest = {
  content: string;
  rating: number;
  productOption?: string;
  imageUrls?: string[];
};
```

서버 규칙:

- `content` 필수
- `rating`은 1부터 5까지, 미입력 시 5점 처리
- 구매한 상품만 작성 가능

## 문의

### `POST /question`

로그인 사용자가 상품 문의를 작성합니다.

Request:

```ts
type QuestionRequest = {
  itemId: number;
  title: string;
  content: string;
};
```

문의 목록은 별도 API가 아니라 `GET /items/{itemId}`의 `questions`에 포함됩니다.

## 관리자 API 참고

프론트 앱은 현재 관리자 API를 직접 호출하지 않습니다. 관리자 화면은 백엔드 Thymeleaf 페이지와 `/admin-api/**` REST API가 담당합니다. 상세는 백엔드 `docs/api.md`를 확인하세요.
