import mongoose, { Schema, Document } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export interface IMessage extends Document {
  messageId: string;
  senderId: string;
  text?: string;
  reactions?: { [emoji: string]: string[] }; // { "👍": ["user1", "user2"] }
  createdAt: Date;
  tripId: string;
}

// senderID is the userID from prisma.

const MessageSchema = new Schema<IMessage>(
  {
    messageId: {
      type: String,
      required: true,
      unique: true,
      default: () => uuidv4(),
    },
    tripId: { type: String, required: true, index: true },
    senderId: { type: String, required: true },
    text: { type: String },
    reactions: { type: Map, of: [String], default: {} },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

export default mongoose.model<IMessage>('Message', MessageSchema);
