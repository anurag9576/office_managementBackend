const Notification = require('../../models/Notification');

class NotificationService {
  async getMyNotifications(userId) {
    // 1. Fetch both personal and global notifications
    const notifications = await Notification.find({
      $or: [
        { recipient: userId },
        { isGlobal: true }
      ]
    })
    .sort({ createdAt: -1 })
    .limit(15);
    
    // 2. Process notifications to set the correct isRead status for the UI
    const processedNotifications = notifications.map(notif => {
      const plainNotif = notif.toObject();
      if (notif.isGlobal) {
        // For global ones, check if userId exists in the readBy array
        plainNotif.isRead = notif.readBy && notif.readBy.some(id => id.toString() === userId.toString());
      }
      return plainNotif;
    });

    // 3. Calculate total unread count
    // Personal unread
    const personalUnread = await Notification.countDocuments({ 
        recipient: userId, 
        isRead: false 
    });

    // Global unread: check global items where userId NOT in readBy
    const globalUnread = await Notification.countDocuments({ 
        isGlobal: true, 
        readBy: { $ne: userId } 
    });

    return { 
        notifications: processedNotifications, 
        unreadCount: personalUnread + globalUnread 
    };
  }

  async createNotification(data) {
    try {
        const notification = new Notification({
            recipient: data.recipient,
            isGlobal: data.isGlobal || false,
            title: data.title,
            message: data.message,
            type: data.type || 'info',
            icon: data.icon || 'notifications',
            route: data.route || '',
            readBy: []
        });
        await notification.save();
        return notification;
    } catch (error) {
        console.error('Error creating notification:', error);
    }
  }

  async markAsRead(id, userId) {
    const notification = await Notification.findById(id);
    if (!notification) throw new Error('Notification not found');

    if (notification.isGlobal) {
      // For global notifications, add userId to readBy array if not already there
      if (!notification.readBy.includes(userId)) {
        notification.readBy.push(userId);
        await notification.save();
      }
      return { ...notification.toObject(), isRead: true };
    } else {
      // Personal notification
      if (notification.recipient.toString() !== userId.toString()) throw new Error('Not authorized');
      notification.isRead = true;
      await notification.save();
      return notification;
    }
  }

  async markAllAsRead(userId) {
    // 1. Mark all personal as read
    await Notification.updateMany(
      { recipient: userId, isRead: false },
      { $set: { isRead: true } }
    );

    // 2. Add current user to 'readBy' for all GLOBAL notifications they haven't read
    await Notification.updateMany(
      { isGlobal: true, readBy: { $ne: userId } },
      { $addToSet: { readBy: userId } }
    );

    return true;
  }
}

module.exports = new NotificationService();
