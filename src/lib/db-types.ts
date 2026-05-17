/**
 * Clean TypeScript interfaces for MongoDB documents.
 * Used on the frontend — no Mongoose dependency.
 * _id is always a string (serialised from ObjectId by .lean()).
 */

// ─── Shared ───────────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pages: number;
}

// ─── Enums ────────────────────────────────────────────────────────────────────

export type UserRole       = "customer" | "bulk_dealer" | "truck_owner" | "admin" | "station_manager";
export type UserStatus     = "active" | "suspended" | "pending";
export type Product        = "PMS" | "AGO" | "ATK";
export type SupplyPriority = "normal" | "urgent" | "emergency";
export type SupplyStatus   = "pending" | "processing" | "in_transit" | "delivered" | "cancelled";
export type OrderStatus    = "pending" | "processing" | "in_transit" | "delivered" | "cancelled";
export type TxnStatus      = "completed" | "pending" | "failed";
export type PaymentMethod  = "bank_transfer" | "card" | "wallet" | "opay" | "cash";
export type TruckStatus        = "pending_review" | "approved" | "rejected";
export type TruckRentalStatus  = "requested" | "confirmed" | "active" | "completed" | "cancelled";
export type PaymentStatus      = "unpaid" | "paid";
export type StockStatus        = "available" | "limited" | "unavailable";
export type FuelStationStatus  = "active" | "inactive" | "suspended";
export type UnionDuesStatus    = "pending" | "paid" | "overdue" | "waived";
export type SMStatus           = "active" | "blocked" | "inactive";
export type LoadingStatus      = "pending" | "in_progress" | "completed" | "cancelled";
export type LevyFrequency      = "one_time" | "annual" | "monthly" | "quarterly" | "weekly";
export type TransactionType    =
  | "supply_request"
  | "truck_rental"
  | "union_dues"
  | "purchase_order"
  | "supply_fulfillment"
  | "loading"
  | "daily_sales";

// ─── User ─────────────────────────────────────────────────────────────────────

export interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  status: UserStatus;
  emailVerified: boolean;

  // Business details
  companyName?: string;
  rcNumber?: string;
  dprRegNo?: string;
  dprLicence?: string;
  tinNumber?: string;
  cacRegNo?: string;
  dealerCode?: string;
  memberId?: string;

  // Address
  state?: string;
  lga?: string;
  headOfficeAddress?: string;
  stationAddress?: string;

  // Official ID
  officialIdType?: string;
  idNumber?: string;
  idIssueDate?: string;
  idExpiryDate?: string;
  idIssuingAuthority?: string;

  // Bank details
  bankName?: string;
  bankAccountName?: string;
  bankAccountNumber?: string;
  bankBranch?: string;

  pmsTankMaxML?: number;
  agoTankMaxML?: number;
  atkTankMaxML?: number;

  joinedAt: string;
  lastLogin?: string;
  updatedAt: string;
}

// ─── Station Manager ──────────────────────────────────────────────────────────

export interface StationManager {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  depot: string;
  assignedBy: string;
  status: SMStatus;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Supply Request ───────────────────────────────────────────────────────────

export interface SupplyRequest {
  _id: string;
  requestId: string;
  stationId?: string;
  stationName: string;
  product: Product;
  depot?: string;
  quantity: number;
  priority: SupplyPriority;
  deliveryDate?: string;
  notes?: string;
  requestedBy: string;
  status: SupplyStatus;
  createdAt: string;
  updatedAt: string;
  // AI routing
  aiAssignedDepot?: string;
  aiAdjustedPriority?: SupplyPriority;
  aiReasoning?: string;
  aiEstimatedDeliveryDays?: number;
  aiAlternateDepots?: string[];
}

// ─── Purchase Order ───────────────────────────────────────────────────────────

export interface PurchaseOrder {
  _id: string;
  orderId: string;
  status: OrderStatus;
  dealer?: string;
  transactionId?: string;

  // Stage 1: Company
  loadingDepot: string;
  companyName: string;
  dprRegNo: string;
  cacRegNo: string;
  companyAddress: string;
  companyTelephone: string;
  companyEmail: string;
  stationAddress: string;

  // Stage 2: Owner
  ownerName: string;
  ownerTelephone: string;
  ownerAddress: string;
  ownerEmail: string;
  ownerIdType: string;
  ownerIdNumber: string;

  // Stage 3: Product & truck
  productType: string;
  productQuantity: number;
  haulageTruck: "owned_truck" | "rent_truck";
  vehicleType?: string;
  tankCapacity?: number;
  truckRegNumber?: string;
  tractorColor?: string;
  tankColor?: string;
  bodyInscription?: string;
  ullages?: number[];
  driverName?: string;
  driverIdType?: string;
  driverIdNumber?: string;
  rentalId?: string;

  // Stage 4: Payment
  paymentMethod: PaymentMethod;
  bankName?: string;
  bankAccountName?: string;
  transactionRef: string;
  pricePerLitre?: number;
  totalAmount?: number;

  createdAt: string;
  updatedAt: string;
}

// ─── Truck ────────────────────────────────────────────────────────────────────

export interface Truck {
  _id: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  vehicleType: string;
  tankCapacity: number;
  compartments?: number;
  truckRegNumber: string;
  tractorColor?: string;
  tankColor?: string;
  chassisNumber?: string;
  engineNumber?: string;
  yearOfManufacture?: string;
  bodyInscription?: string;
  insuranceProvider?: string;
  insurancePolicyNumber?: string;
  insuranceExpiry?: string;
  dprCertNumber?: string;
  dprCertExpiry?: string;
  roadWorthinessExpiry?: string;
  productTypes: string[];
  dailyRate: number;
  zoneRates?: Record<string, number>;
  approvedZoneRates?: Record<string, number>;
  driverName: string;
  driverPhone?: string;
  driverLicenseNumber?: string;
  driverLicenseExpiry?: string;
  motorBoyName?: string;
  motorBoyPhone?: string;
  motorBoyIdType?: string;
  motorBoyIdNumber?: string;
  destinationState?: string;
  destinationTown?: string;
  tractorImageUrl?: string;
  tankImageUrl?: string;
  status: TruckStatus;
  reviewNote?: string;
  submittedAt: string;
  updatedAt: string;
  // AI review
  aiScore?: number;
  aiRecommendation?: "approve" | "reject";
  aiSummary?: string;
  aiStrengths?: string[];
  aiConcerns?: string[];
  aiConfidenceGate?: "decisive_approve" | "decisive_reject" | "needs_manual_review";
}

// ─── Truck Rental ─────────────────────────────────────────────────────────────

export interface TruckRental {
  _id: string;
  rentalId: string;
  truckId: string;
  truckRegNumber: string;
  truckOwnerEmail: string;
  rentedBy: string;
  linkedRequestId?: string;
  linkedOrderId?: string;
  product: Product;
  quantityLitres: number;
  pickupDepot: string;
  deliveryAddress?: string;
  deliveryState?: string;
  startDate: string;
  endDate: string;
  actualReturnDate?: string;
  dailyRateLocked: number;
  totalDays: number;
  totalAmount: number;
  status: TruckRentalStatus;
  paymentStatus: PaymentStatus;
  transactionId?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Loading Record ───────────────────────────────────────────────────────────

export interface LoadingRecord {
  _id: string;
  loadId: string;
  orderId: string;
  orderRef?: string;
  product?: Product;
  depot?: string;
  truckRegNumber?: string;
  driverName?: string;
  companyName?: string;
  loadingDate: string;
  compartments: number[];
  totalLitresLoaded?: number;
  sealNumbers?: string[];
  temperature?: number;
  density?: number;
  loaderName?: string;
  loaderId?: string;
  remarks?: string;
  status: LoadingStatus;
  createdAt: string;
  updatedAt: string;
}

// ─── Depot ────────────────────────────────────────────────────────────────────

export interface ProductStock {
  level: number;             // 0–100 %
  price: number;             // ₦ per litre
  status: StockStatus;
  capacityLitres?: number;   // max tank volume in litres
  currentLitres?: number;    // actual volume in litres
}

export interface Depot {
  _id: string;
  name: string;
  location: string;
  state: string;
  coordinates: { lat: number; lng: number };
  PMS: ProductStock;
  AGO: ProductStock;
  ATK: ProductStock;
  lastUpdated: string;
}

// ─── Fuel Station ─────────────────────────────────────────────────────────────

export interface TankEntry {
  product: Product;
  capacityLitres: number;
  currentLitres: number;
  reorderLevel: number;
  lastRestocked?: string;
}

export interface FuelStation {
  _id: string;
  ownerEmail: string;
  stationName: string;
  state: string;
  lga?: string;
  address?: string;
  rcNumber?: string;
  dprLicenseNo?: string;
  tanks: TankEntry[];
  staffCount?: number;
  managerName?: string;
  managerPhone?: string;
  status: FuelStationStatus;
  createdAt: string;
  updatedAt: string;
}

// ─── Transaction ──────────────────────────────────────────────────────────────

export interface Transaction {
  _id: string;
  txnId: string;
  type: TransactionType;
  user: string;
  userEmail?: string;
  userRole: "customer" | "bulk_dealer";
  product?: string;
  quantity?: string;
  totalAmount: number;
  status: TxnStatus;
  paymentMethod?: PaymentMethod;
  depot?: string;
  reference: string;
  referenceType?: "supply_request" | "purchase_order" | "truck_rental" | "union_dues" | "loading";
  referenceId?: string;
  timestamp: string;
  aiFlagged?: boolean;
  aiAnomalySeverity?: "low" | "medium" | "high";
  aiAnomalyDesc?: string;
}

// ─── Union Dues ───────────────────────────────────────────────────────────────

export interface LevyEntry {
  levyId: string;
  name: string;
  amount: number;
  frequency: LevyFrequency;
}

export interface UnionDues {
  _id: string;
  paymentId: string;
  userEmail: string;
  fullName: string;
  companyName: string;
  membershipId: string;
  telephone: string;
  address: string;
  paymentDepot: string;
  amountDue: number;
  amountPaid: number;
  customLevies?: LevyEntry[];
  productType?: string;
  litres?: number;
  truckCount?: number;
  declaredValue?: number;
  paymentMethod: PaymentMethod;
  bankName?: string;
  bankAccountName?: string;
  transactionRef: string;
  userRole: "customer" | "bulk_dealer" | "truck_owner";
  duesPeriod?: string;
  periodStart?: string;
  periodEnd?: string;
  status: UnionDuesStatus;
  transactionId?: string;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Custom Levy ──────────────────────────────────────────────────────────────

export interface CustomLevy {
  _id: string;
  name: string;
  amount: number;
  frequency: LevyFrequency;
  isActive: boolean;
  createdBy?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Platform Settings ────────────────────────────────────────────────────────

export interface PlatformSettings {
  _id: string;
  settingsKey: string;
  platformName: string;
  tagline?: string;
  businessAddress?: string;
  rcNumber?: string;
  vatNumber?: string;
  supportEmail?: string;
  supportPhone?: string;
  whatsappNumber?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  twitterUrl?: string;
  pmsPricePerLitre: number;
  agoPricePerLitre: number;
  atkPricePerLitre: number;
  lgpPricePerLitre: number;
  depotCapacityLitres: number;
  lowStockThreshold: number;
  urgentDeliveryFee: number;
  emergencyDeliveryFee: number;
  platformCommissionPct: number;
  minOrderLitres: number;
  maxOrderLitres: number;
  standardLeadTimeHours: number;
  urgentLeadTimeHours: number;
  annualMembershipFee: number;
  monthlyLevy: number;
  loadingSurcharge: number;
  bulkDealerYearlyFee: number;
  bankName?: string;
  bankAccountName?: string;
  bankAccountNumber?: string;
  opayNumber?: string;
  truckRates?: Record<string, number>;
  paystackPublicKey?: string;
  enablePaystack: boolean;
  enableBankTransfer: boolean;
  enableCash: boolean;
  enableWallet: boolean;
  enableOpay: boolean;
  notifyNewSupplyRequests: boolean;
  notifyNewPurchaseOrders: boolean;
  notifyLowStock: boolean;
  notifyTruckRegistrations: boolean;
  allowNewRegistrations: boolean;
  depotCodeTtlHours: number;
  mongoDbConnected: boolean;
  updatedAt: string;
}

// ─── Notification ─────────────────────────────────────────────────────────────

export interface Notification {
  _id: string;
  recipientEmail: string;
  recipientRole: UserRole;
  title: string;
  message: string;
  actionRequired?: string;
  action?: string;
  read: boolean;
  reference?: string;
  createdAt: string;
}

// ─── Daily Sales ──────────────────────────────────────────────────────────────

export interface SaleEntry {
  product: Product;
  openingStockLtrs: number;
  closingStockLtrs: number;
  litresSold: number;
  pricePerLitre: number;
  revenue: number;
  pumpNumber?: string;
}

export interface DailySales {
  _id: string;
  stationId: string;
  stationName: string;
  recordedBy: string;
  saleDate: string;
  sales: SaleEntry[];
  totalRevenue: number;
  notes?: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Session ──────────────────────────────────────────────────────────────────

export interface Session {
  _id: string;
  userEmail: string;
  userId: string;
  token: string;
  role: UserRole;
  ipAddress?: string;
  userAgent?: string;
  expiresAt: string;
  lastActiveAt: string;
  isValid: boolean;
  createdAt: string;
}

// ─── AI Feedback ──────────────────────────────────────────────────────────────

export interface AIFeedback {
  _id: string;
  route: string;
  recordId: string;
  aiRecommendation: string;
  adminDecision: string;
  adminOverrode: boolean;
  reasonNote?: string;
  aiScore?: number;
  aiConfidenceGate?: string;
  adminEmail?: string;
  createdAt: string;
}

// ─── Allocation ───────────────────────────────────────────────────────────────

export type AllocationStatus = "active" | "exhausted" | "expired" | "revoked";

export interface Allocation {
  _id: string;
  allocationId: string;
  dealerEmail: string;
  dealerName: string;
  product: Product;
  volumeLitres: number;
  usedLitres: number;
  depot: string;
  validFrom: string;
  validTo: string;
  status: AllocationStatus;
  notes?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}
