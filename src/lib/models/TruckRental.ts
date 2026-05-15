import { Schema, model, models, type InferSchemaType } from "mongoose";

const TruckRentalSchema = new Schema(
  {
    rentalId:        { type: String, required: true, unique: true }, // RENTAL-xxx

    truckId:         { type: Schema.Types.ObjectId }, // FK → trucks._id — assigned by admin on confirm
    truckRegNumber:  { type: String },               // denormalised — assigned by admin on confirm
    truckOwnerEmail: { type: String },               // FK → users.email — assigned by admin on confirm

    rentedBy:        { type: String, required: true },               // FK → users.email
    linkedRequestId: { type: Schema.Types.ObjectId },                // FK → supply_requests._id
    linkedOrderId:   { type: Schema.Types.ObjectId },                // FK → purchase_orders._id

    product:         { type: String, enum: ["PMS", "AGO", "ATK"], required: true },
    quantityLitres:  { type: Number, required: true, min: 1 },
    pickupDepot:     { type: String, required: true },               // FK → depots.name
    deliveryAddress: { type: String },
    deliveryState:   { type: String },

    startDate:       { type: Date, required: true },
    endDate:         { type: Date, required: true },                  // estimated return
    actualReturnDate:{ type: Date },

    dailyRateLocked: { type: Number, required: true, min: 0 },       // ₦ rate at booking time
    totalDays:       { type: Number, required: true, min: 1 },
    totalAmount:     { type: Number, required: true, min: 0 },       // ₦

    status: {
      type: String,
      enum: ["Requested", "Confirmed", "Active", "Completed", "Cancelled"],
      default: "Requested",
    },
    paymentStatus: {
      type: String,
      enum: ["Unpaid", "Paid"],
      default: "Unpaid",
    },
    transactionId: { type: Schema.Types.ObjectId },                  // FK → transactions._id
  },
  { timestamps: true }
);

TruckRentalSchema.index({ rentedBy: 1, createdAt: -1 });
TruckRentalSchema.index({ truckId: 1, status: 1 });
TruckRentalSchema.index({ truckOwnerEmail: 1 });
TruckRentalSchema.index({ status: 1 });

export type TruckRentalDoc = InferSchemaType<typeof TruckRentalSchema>;
export const TruckRental = models.TruckRental ?? model("TruckRental", TruckRentalSchema);
