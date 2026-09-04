import mongoose from 'mongoose';
import { NOTIFICATION_TYPE, values } from '../config/constants.js';

const { Schema, model } = mongoose;

const notificationSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: values(NOTIFICATION_TYPE), required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    // Optional link back to the entity that triggered the notification.
    link: { type: String, default: '' },
    isRead: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

export const Notification = model('Notification', notificationSchema);
