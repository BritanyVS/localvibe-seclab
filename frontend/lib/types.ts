export type Place = {
  id: string;
  slug: string;
  name: string;
  category: string;
  categoryLabel: string;
  province: string;
  location: string;
  vibe: string;
  description: string;
  tags: string[];
  price: string;
  priceValue: number;
  rating: number;
  hours: string;
  image: string;
  featured: boolean;
};

export type PlaceInput = Omit<Place, "id" | "slug">;

export type Review = {
  id: string;
  placeId: string;
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
};

export type ReviewInput = {
  email: string;
  password: string;
  rating: number;
  comment: string;
};

export type Category = {
  id: string;
  label: string;
};

export type ChatMessage = {
  role: "assistant" | "user";
  content: string;
  placeIds?: string[];
};

export type ConciergeReply = {
  reply: string;
  placeIds: string[];
};