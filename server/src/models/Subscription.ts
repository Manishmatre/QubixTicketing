import mongoose, { Document, Schema } from 'mongoose';

export interface ISubscription extends Document {
  organizationId: mongoose.Types.ObjectId;
  planId: mongoose.Types.ObjectId;
  planCode: string;
  billingInterval: 'monthly' | 'yearly';
  status: 'active' | 'trialing' | 'past_due' | 'canceled';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  amountPaid: number;
  currency: string;
  invoices: Array<{
    invoiceId: string;
    amount: number;
    currency: string;
    status: 'paid' | 'pending' | 'failed';
    date: Date;
    receiptUrl?: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionSchema = new Schema<ISubscription>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, unique: true, index: true },
    planId: { type: Schema.Types.ObjectId, ref: 'Plan', required: true },
    planCode: { type: String, required: true },
    billingInterval: { type: String, enum: ['monthly', 'yearly'], default: 'monthly' },
    status: {
      type: String,
      enum: ['active', 'trialing', 'past_due', 'canceled'],
      default: 'trialing',
      index: true,
    },
    currentPeriodStart: { type: Date, default: Date.now },
    currentPeriodEnd: { type: Date, default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
    cancelAtPeriodEnd: { type: Boolean, default: false },
    amountPaid: { type: Number, default: 0 },
    currency: { type: String, default: 'USD' },
    invoices: [
      {
        invoiceId: { type: String, required: true },
        amount: { type: Number, required: true },
        currency: { type: String, default: 'USD' },
        status: { type: String, enum: ['paid', 'pending', 'failed'], default: 'paid' },
        date: { type: Date, default: Date.now },
        receiptUrl: { type: String },
      },
    ],
  },
  { timestamps: true }
);

export const Subscription = mongoose.model<ISubscription>('Subscription', SubscriptionSchema);

