const Notification = require('../../models/Notification');

class NotificationService {
  async getMyNotifications(userId) {
    const notifications = await Notification.find({ recipient: userId })
      .sort({ createdAt: -1 })
      .limit(10);
    
    const unreadCount = await Notification.countDocuments({ 
        recipient: userId, 
        isRead: false 
    });

    return { notifications, unreadCount };
  }

  async createNotification(data) {
    try {
        const notification = new Notification({
            recipient: data.recipient,
            title: data.title,
            message: data.message,
            type: data.type || 'info',
            icon: data.icon || 'notifications',
            route: data.route || ''
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
    if (notification.recipient.toString() !== userId) throw new Error('Not authorized');

    notification.isRead = true;
    await notification.save();
    return notification;
  }

  async markAllAsRead(userId) {
    await Notification.updateMany(
      { recipient: userId, isRead: false },
      { $set: { isRead: true } }
    );
    return true;
  }
}

module.exports = new NotificationService();
