export interface VendorProfile {
  id: string | number;
  name: string;
  email: string;
  status: string;
  phone?: string;
  shop_name?: string;
  address?: string;
  payment_methods?: string;
  profile_img?: string;
}

export interface MobileListing {
  id: string;
  brand: string;
  model: string;
  storage: string;
  ram: string;
  color: string;
  imei?: string;
  condition: "Mint" | "Excellent" | "Good" | "Fair";
  price: number;
  purchasePrice?: number;
  stock: number;
  batteryHealth: number;
  status: "Active" | "Sold" | "Review";
  description: string;
}

export interface ExchangeRequest {
  id: string;
  customerName: string;
  customerPhone: string;
  customerPhoneSpecs: string;
  customerPhoneCondition: "Mint" | "Excellent" | "Good" | "Fair";
  customerPhoneBattery: number;
  targetDevice: string;
  targetPrice: number;
  valuationOffer: number;
  counterOffer?: number;
  status: "Pending" | "Accepted" | "Countered" | "Rejected";
  date: string;
}

export interface OrderRecord {
  id: string;
  customerName: string;
  date: string;
  device: string;
  type: "Purchase" | "Exchange";
  amount: number;
  status: "Processing" | "Shipped" | "Delivered" | "Cancelled";
}

export interface TradeTransaction {
  id: string;
  imei: string;
  deviceModel: string;
  deviceBrand: string;
  type: "Purchase" | "Sale";
  customerName: string;
  amount: number;
  date: string;
  notes?: string;
  storage?: string;
  ram?: string;
  color?: string;
  condition?: "Mint" | "Excellent" | "Good" | "Fair";
  batteryHealth?: number;
}

export interface InvoiceItem {
  type: "Sale" | "Repair" | "Exchange";
  description: string;
  rate: number;
  cost?: number;
  imei?: string;
}

export interface InvoiceRecord {
  id: string;
  customerName: string;
  customerPhone: string;
  date: string;
  billType: "Standard" | "MarginScheme";
  items: InvoiceItem[];
  taxRate: number;
  taxAmount: number;
  subtotal: number;
  exchangeDeduction: number;
  totalAmount: number;
  paymentMethod: string;
}

export interface PurchaseHistoryItem {
  id: string;
  device: string;
  date: string;
  type: "Purchase" | "Exchange";
  amount: number;
  status: "Delivered" | "Shipped" | "Processing" | "Cancelled";
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: "Active" | "Inactive";
  totalOrders: number;
  totalSpent: number;
  joinedDate: string;
  address: string;
  notes: string;
  purchases: PurchaseHistoryItem[];
}

export interface Attachment {
  type: "image" | "video" | "file";
  url: string;
  name: string;
  size?: string;
}

export interface ChatMessage {
  id: string;
  sender: "customer" | "vendor";
  senderId?: number;
  senderName?: string;
  text: string;
  timestamp: string;
  status?: "sent" | "delivered" | "read";
  attachment?: Attachment;
}

export interface ChatSession {
  id: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  avatar: string;
  status: "online" | "offline";
  lastMessage: string;
  unreadCount: number;
  lastActive: string;
  deviceInterest: string;
  notes: string;
  isGroup?: boolean;
  groupName?: string;
  groupMembers?: number[];
  messages: ChatMessage[];
}

