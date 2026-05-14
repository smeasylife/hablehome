export type CartItemResponse = {
  cartId: number;
  itemId: number;
  name: string;
  price: number;
  salePrice: number;
  color: string;
  size: string;
  additionalPrice: number;
  quantity: number;
  pictureUrl: string;
  stockQuantity: number;
  available: boolean;
};

export type CartItemRequest = {
  color?: string;
  size?: string;
  quantity?: number;
};
