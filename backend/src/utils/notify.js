import { Notification } from '../models/index.js';

export async function notifyUser(userId, title, body = null) {
  await Notification.create({ user_id: userId, title, body, is_read: false });
}
