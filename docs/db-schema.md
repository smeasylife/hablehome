# Frontend Data Schema

프론트엔드는 자체 데이터베이스를 갖지 않습니다. 서버 데이터는 API 응답과 React Query 캐시에 보관되고, 일부 과거/개발용 데이터만 `localStorage`에 저장됩니다.

## 서버 데이터 모델 매핑

| 프론트 타입 | 서버 원천 | 주요 사용 화면 |
|---|---|---|
| `AuthMember` | `AuthMemberResponse`, `members` | 로그인, 헤더, 마이페이지 |
| `ItemListResponse` | `ItemListResponse`, `item`, `item_picture`, `item_category`, `likes` | 홈 상품 그리드 |
| `ItemDetailResponse` | `ItemDetailResponse`, `item`, `review`, `question` | 상품 상세 |
| `CartItemResponse` | `CartItemResponse`, `cart` | 장바구니 |
| `OrderResponse` | `OrderResponse`, `purchase_order`, `order_item` | 주문서, 결제 결과, 마이페이지 |
| `ReviewResponse` | `ReviewResponse`, `review`, `review_picture`, `review_comment` | 상품 상세 리뷰 |
| `QuestionResponse` | `QuestionResponse`, `question` | 상품 상세 문의 |

서버 실제 테이블과 관계는 `hablehome-server/docs/db-schema.md`가 기준입니다.

## React Query 캐시

명시적으로 확인된 캐시 키입니다.

| Query Key | 데이터 | 위치 |
|---|---|---|
| `currentMemberQueryKey` | 현재 로그인 사용자 | `src/hooks/useCurrentMember.ts` |
| `['items']` 계열 | 상품 목록 | `src/pages/HomePage.tsx`, 로그인 후 invalidate |
| `['item', itemId]` 계열 | 상품 상세 | `src/pages/ProductDetailPage.tsx`, 리뷰/문의/좋아요 후 invalidate |
| `['cart']` 계열 | 장바구니 목록 | `src/pages/CartPage.tsx` |
| `['orders']` 계열 | 주문 목록 | `src/pages/MyPage.tsx` |
| `['order', orderId]` 계열 | 단일 주문 | `src/pages/PaymentResultPage.tsx` |
| `['memberReviews', memberId]` 계열 | 회원별 로컬 리뷰 목록 | `src/pages/MyPage.tsx` |
| `['purchases', memberId]` 계열 | 구매 목록 invalidation용 레거시 키 | `src/components/PurchaseReviewComposer.tsx` |

새 서버 상태를 추가할 때는 API 함수, 타입, Query Key를 함께 추가하고 mutation 성공 시 관련 query를 invalidate하세요.

## localStorage 스키마

현재 서버 API로 대체된 흐름이 많지만, `src/data/*`에 브라우저 저장소 유틸이 남아 있습니다. 이 값들은 서버의 원본 데이터가 아니며, 운영 데이터로 신뢰하면 안 됩니다.

### `hable-cart-items`

파일: `src/data/localCart.ts`

용도: 과거/개발용 로컬 장바구니.

```ts
type LocalCartItem = {
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

### `shopping-mall-purchases`

파일: `src/data/localPurchases.ts`

용도: 과거/개발용 구매 기록.

```ts
type PurchasedProduct = {
  purchaseId: string;
  memberId: number;
  itemId: number;
  name: string;
  pictureUrl: string;
  color: string;
  size: string;
  quantity: number;
  price: number;
  purchasedAt: string;
  reviewed: boolean;
};
```

현재 마이페이지 구매 목록은 서버 주문 데이터를 `PurchasedProduct` 형태로 변환해 사용합니다. 이 localStorage 키는 `markPurchaseReviewed()` 같은 레거시 유틸에서만 갱신될 수 있습니다.

### `shopping-mall-reviews`

파일: `src/data/localReviews.ts`

용도: 과거/개발용 리뷰 저장소.

```ts
type LocalReviewRecord = ReviewResponse & {
  itemId: number;
  memberId: number;
};

type ReviewResponse = {
  id?: number;
  nickname?: string;
  rating: number;
  productOption?: string | null;
  imageUrls?: string[];
  content: string;
  adminComment?: string | null;
  createdAt: string;
};
```

### `shopping-mall-session`

파일: `src/data/localSession.ts`

현재 로그인 세션은 서버 `JSESSIONID` 쿠키가 기준입니다. 이 파일은 `clearSession()`으로 로컬 세션 키를 삭제하는 용도로만 남아 있습니다.

## 페이지 간 전달 상태

### 주문 페이지 state

`ProductDetailPage`와 `CartPage`는 `navigate('/order', { state })`로 주문 미리보기 데이터를 전달합니다.

```ts
type OrderPageState = {
  cartIds?: number[];
  items?: OrderItemRequest[];
  previewItems: OrderPreviewItem[];
};
```

`OrderPage`는 이 state를 기준으로 주문서를 구성하고, 최종 주문 생성은 `POST /orders`로 서버에 반영합니다.

## 외부 브라우저 SDK 데이터

| 기능 | 위치 | 저장 여부 |
|---|---|---|
| Toss Payments | `src/api/payments.ts` | 프론트 저장 없음 |
| 다음 우편번호 | `src/pages/OrderPage.tsx` | 선택 주소만 주문 요청에 포함 |
| 카카오 OAuth | `src/pages/LoginPage.tsx` | authorization code를 서버로 전달, 토큰은 프론트 저장 없음 |

## 데이터 추가 원칙

- 서버에서 관리되어야 하는 데이터는 `localStorage`에 새로 저장하지 말고 백엔드 API와 DTO를 먼저 추가합니다.
- API 응답 타입은 `src/types`에 두고, 호출 함수는 `src/api`에 둡니다.
- 화면 전용 임시 상태는 페이지 컴포넌트 state로 유지합니다.
- 여러 페이지가 공유하는 서버 상태는 React Query 캐시를 사용합니다.
