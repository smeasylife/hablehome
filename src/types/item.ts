export type ItemListResponse = {
  id: number;
  name: string;
  price: number;
  salePrice: number;
  color: string;
  pictureUrl: string;
  like: boolean;
  categories?: string[];
};

export type ItemPictureResponse = {
  url: string;
};

export type ItemOptionResponse = {
  optionId: number;
  color: string;
  size: string;
  stockQuantity: number;
  additionalPrice: number;
  soldOut: boolean;
};

export type ReviewResponse = {
  id?: number;
  nickname?: string;
  rating?: number;
  productOption?: string | null;
  imageUrls?: string[];
  content: string;
  adminComment?: string | null;
  createdAt: string;
};

export type ReviewRequest = {
  content: string;
  rating: number;
  productOption?: string;
  imageUrls?: string[];
};

export type QuestionResponse = {
  id?: number;
  title?: string;
  content: string;
  answer: string | null;
  createdAt: string;
};

export type QuestionRequest = {
  itemId: number;
  title: string;
  content: string;
};

export type ItemDetailResponse = {
  itemId: number;
  name: string;
  price: number;
  salePrice: number;
  shippingPrice: number;
  size: string;
  color: string;
  information: string;
  itemPictures: ItemPictureResponse[];
  options: ItemOptionResponse[];
  categories?: string[];
  like: boolean;
  reviews: ReviewResponse[];
  questions: QuestionResponse[];
};

export type Category = {
  id: string;
  label: string;
  categoryNames: string[];
};
