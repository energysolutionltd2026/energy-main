// Central audit logger — writes directly to the database via API.
// Fire-and-forget: callers do not need to await this.

export type TransactionType =
  | "Supply Request"
  | "Truck Rental"
  | "Union Dues"
  | "Purchase Order"
  | "Supply Fulfillment"
  | "Daily Sales";

export interface PlatformTransaction {
  id: string;
  timestamp: string;
  date: string;
  type: TransactionType;
  user: string;
  userRole: "Customer" | "Bulk Dealer";
  product?: string;
  quantity?: string;
  totalAmount: string;
  status: "Completed" | "Pending" | "Failed";
  paymentMethod?: string;
  depot?: string;
  reference: string;
}

export function logTransaction(txn: Omit<PlatformTransaction, "id" | "timestamp" | "date">) {
  const now = new Date();
  const entry = {
    txnId:         `TXN-${now.getFullYear()}-${String(Date.now()).slice(-6)}`,
    type:          txn.type,
    user:          txn.user,
    userEmail:     txn.user,
    userRole:      txn.userRole,
    product:       txn.product,
    quantity:      txn.quantity,
    totalAmount:   Number(String(txn.totalAmount).replace(/[₦,\s]/g, "")) || 0,
    status:        txn.status,
    paymentMethod: txn.paymentMethod,
    depot:         txn.depot,
    reference:     txn.reference,
  };

  import("@/lib/db-client")
    .then(({ api }) => api.transactions.create(entry as any))
    .catch(() => null);
}
