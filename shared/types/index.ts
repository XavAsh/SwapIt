// Common types shared across all microservices

export interface User {
  id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Product {
  id: string;
  userId: string;
  title: string;
  description: string;
  price: number;
  category: string;
  size?: string;
  condition: "new" | "like_new" | "good" | "fair";
  images: string[];
  location?: string;
  status: "available" | "sold" | "reserved";
  createdAt: Date;
  updatedAt: Date;
}

export interface Order {
  id: string;
  buyerId: string;
  sellerId: string;
  productId: string;
  amount: number;
  status: "pending" | "paid" | "shipped" | "delivered" | "cancelled";
  paymentIntentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  content: string;
  read: boolean;
  createdAt: Date;
}

export interface Conversation {
  id: string;
  participant1Id: string;
  participant2Id: string;
  productId?: string;
  lastMessageAt: Date;
  createdAt: Date;
}

export interface Review {
  id: string;
  reviewerId: string;
  revieweeId: string;
  orderId: string;
  rating: number;
  comment?: string;
  createdAt: Date;
}

export interface Favorite {
  id: string;
  userId: string;
  productId: string;
  createdAt: Date;
}

export interface Shipment {
  id: string;
  orderId: string;
  shippingMethod: "relay_point" | "home_delivery";
  trackingNumber?: string;
  carrier?: string;
  address: any; // JSON object
  status: "prepared" | "shipped" | "in_transit" | "delivered" | "cancelled";
  createdAt: Date;
  updatedAt: Date;
}

export interface Wallet {
  id: string;
  userId: string;
  balance: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface WalletTransaction {
  id: string;
  walletId: string;
  amount: number;
  type: "credit" | "debit";
  description?: string;
  createdAt: Date;
}

export interface Report {
  id: string;
  reporterId: string;
  reportedUserId?: string;
  reportedProductId?: string;
  reportedMessageId?: string;
  reason: string;
  description?: string;
  status: "pending" | "reviewing" | "resolved" | "dismissed";
  adminNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Event types for RabbitMQ
export interface ItemCreatedEvent {
  type: "ItemCreated";
  productId: string;
  userId: string;
  title: string;
  description: string;
  category: string;
  price: number;
  timestamp: Date;
}

export interface OrderPlacedEvent {
  type: "OrderPlaced";
  orderId: string;
  buyerId: string;
  sellerId: string;
  productId: string;
  amount: number;
  timestamp: Date;
}

export interface MessageSentEvent {
  type: "MessageSent";
  messageId: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: Date;
}

export interface UserRegisteredEvent {
  type: "UserRegistered";
  userId: string;
  email: string;
  username: string;
  timestamp: Date;
}

export interface ReviewCreatedEvent {
  type: "ReviewCreated";
  reviewId: string;
  reviewerId: string;
  revieweeId: string;
  orderId: string;
  rating: number;
  avgRating: number;
  totalReviews: number;
  timestamp: Date;
}

export interface FavoriteAddedEvent {
  type: "FavoriteAdded";
  favoriteId: string;
  userId: string;
  productId: string;
  timestamp: Date;
}

export interface FavoriteRemovedEvent {
  type: "FavoriteRemoved";
  favoriteId: string;
  userId: string;
  productId: string;
  timestamp: Date;
}

export interface ShipmentCreatedEvent {
  type: "ShipmentCreated";
  shipmentId: string;
  orderId: string;
  shippingMethod: string;
  trackingNumber?: string;
  timestamp: Date;
}

export interface OrderDeliveredEvent {
  type: "OrderDelivered";
  shipmentId: string;
  orderId: string;
  timestamp: Date;
}

export interface WalletCreditedEvent {
  type: "WalletCredited";
  userId: string;
  amount: number;
  newBalance: number;
  transactionId: string;
  timestamp: Date;
}

export interface WalletDebitedEvent {
  type: "WalletDebited";
  userId: string;
  amount: number;
  newBalance: number;
  transactionId: string;
  timestamp: Date;
}

export interface ReportCreatedEvent {
  type: "ReportCreated";
  reportId: string;
  reporterId: string;
  timestamp: Date;
}
