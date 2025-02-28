import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage extends Document {
  chatId: string; // The trip ID from PostgreSQL
  senderId: string; // User ID from PostgreSQL
  text?: string;
  reactions?: { [emoji: string]: string[] }; // { "👍": ["user1", "user2"] }
  createdAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    chatId: { type: String, required: true },
    senderId: { type: String, required: true },
    text: { type: String },
    reactions: { type: Map, of: [String], default: {} },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

export default mongoose.model<IMessage>('Message', MessageSchema);
