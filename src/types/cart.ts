export type CartItemResponse = {
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

export type CartItemRequest = {
  color?: string;
  size?: string;
  quantity?: number;
};
