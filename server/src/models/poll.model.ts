import mongoose, { Schema, Document } from 'mongoose';

export interface IPoll extends Document {
  chatId: string; // The trip ID from PostgreSQL
  senderId: string; // User ID from PostgreSQL
  question: string;
  options: { text: string; votes: string[] }[]; // User ID is stored as a vote
  createdAt: Date;
}

const PollSchema = new Schema<IPoll>(
  {
    chatId: { type: String, required: true },
    senderId: { type: String, required: true },
    question: { type: String, required: true },
    options: [
      {
        text: { type: String, required: true },
        votes: [{ type: String }],
      },
    ],
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

export default mongoose.model<IPoll>('Poll', PollSchema);
