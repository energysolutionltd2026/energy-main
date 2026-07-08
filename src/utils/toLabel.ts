const LABELS: Record<string, string> = {
  supply_request:    "Supply Request",
  truck_rental:      "Truck Rental",
  union_dues:        "Union Dues",
  purchase_order:    "Purchase Order",
  supply_fulfillment:"Supply Fulfillment",
  daily_sales:       "Daily Sales",
  bulk_dealer:       "Bulk Dealer",
  owned_truck:       "Owned Truck",
  rent_truck:        "Rent Truck",
  pending_review:    "Pending Review",
  in_transit:        "In Transit",
  in_progress:       "In Progress",
  one_time:          "One-time",
  bank_transfer:     "Bank Transfer",
  globalpay:         "GlobalPay",
  truck_owner:       "Truck Owner",
  station_manager:   "Station Manager",
};

export function toLabel(value: string): string {
  if (!value) return "";
  if (LABELS[value]) return LABELS[value];
  return value.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}
