const NotificationService = require('../../services/common/NotificationService');

exports.getMyNotifications = async (req, res) => {
  try {
    const { notifications, unreadCount } = await NotificationService.getMyNotifications(req.user.id);
    res.json({ success: true, data: notifications, unreadCount });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const notification = await NotificationService.markAsRead(req.params.id, req.user.id);
    res.json({ success: true, data: notification });
  } catch (error) {
    const statusCode = error.message.includes('not found') ? 404 : 
                      error.message.includes('authorized') ? 401 : 500;
    res.status(statusCode).json({ success: false, message: error.message });
  }
};

exports.markAllAsRead = async (req, res) => {
  try {
    await NotificationService.markAllAsRead(req.user.id);
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

exports.createNotification = async (data) => {
    return await NotificationService.createNotification(data);
};
