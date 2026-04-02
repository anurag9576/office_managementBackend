const Announcement = require('../../models/Announcement');
const Employee = require('../../models/Employee');
const Notification = require('../../models/Notification');
const cloudinary = require('../../config/cloudinary');
const { deleteFromCloudinary } = require('../../utils/cloudinaryHelper');
const NotificationService = require('./NotificationService');

class AnnouncementService {
  async getAnnouncements() {
    const announcements = await Announcement.find({})
      .populate('author', 'firstName lastName role avatar')
      .populate('comments.user', 'firstName lastName avatar')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();
    
    return announcements.map(ann => {
        if (ann.content && ann.content.length > 1000) {
            ann.content = ann.content.substring(0, 1000) + '... (Read More)';
        }
        return ann;
    });
  }

  async createAnnouncement(data, authorId) {
    const { title, content, type, imageUrl, pollOptions } = data;
    let finalImageUrl = imageUrl;
    
    if (finalImageUrl && finalImageUrl.startsWith('data:image')) {
      const uploadResponse = await cloudinary.uploader.upload(finalImageUrl, {
        folder: 'office-management/announcements',
      });
      finalImageUrl = uploadResponse.secure_url;
    }

    const announcement = await Announcement.create({
      title,
      content,
      type,
      imageUrl: finalImageUrl,
      pollOptions: pollOptions || [],
      author: authorId,
    });

    // Notify All Employees
    const employees = await Employee.find({});
    employees.forEach(emp => {
      if (emp._id.toString() !== authorId.toString()) {
        NotificationService.createNotification({
          recipient: emp._id,
          title: 'New Announcement',
          message: title,
          type: 'info',
          icon: 'campaign',
          route: '/dashboard/announcement'
        });
      }
    });

    return announcement;
  }

  async toggleLike(announcementId, userId) {
    const announcement = await Announcement.findById(announcementId);
    if (!announcement) throw new Error('Announcement not found');

    const alreadyLiked = announcement.likes.find((like) => like.toString() === userId.toString());
    if (alreadyLiked) {
      announcement.likes = announcement.likes.filter((like) => like.toString() !== userId.toString());
    } else {
      announcement.likes.push(userId);
    }

    await announcement.save();
    return announcement.likes;
  }

  async addComment(announcementId, userId, text) {
    const announcement = await Announcement.findById(announcementId);
    if (!announcement) throw new Error('Announcement not found');

    announcement.comments.push({ user: userId, text });
    await announcement.save();
    return announcement.comments;
  }

  async deleteComment(announcementId, commentId, userId, role) {
    const announcement = await Announcement.findById(announcementId);
    if (!announcement) throw new Error('Announcement not found');

    const comment = announcement.comments.id(commentId);
    if (!comment) throw new Error('Comment not found');

    if (comment.user.toString() !== userId.toString() && role !== 'Admin') {
      throw new Error('Not authorized to delete this comment');
    }

    announcement.comments.pull(commentId);
    await announcement.save();
    return announcement.comments;
  }

  async updateAnnouncement(id, data, userRole) {
    const announcement = await Announcement.findById(id);
    if (!announcement) throw new Error('Announcement not found');

    const authorizedRoles = ['admin', 'hr manager', 'manager'];
    if (!authorizedRoles.includes(userRole.toLowerCase())) {
        throw new Error('Not authorized to update');
    }

    let updateData = { ...data };
    if (updateData.imageUrl && updateData.imageUrl !== announcement.imageUrl) {
      if (updateData.imageUrl.startsWith('data:image')) {
        const uploadResponse = await cloudinary.uploader.upload(updateData.imageUrl, {
          folder: 'office-management/announcements',
        });
        if (announcement.imageUrl) {
          await deleteFromCloudinary(announcement.imageUrl);
        }
        updateData.imageUrl = uploadResponse.secure_url;
      }
    }

    return await Announcement.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
  }

  async deleteAnnouncement(id, userRole) {
    const announcement = await Announcement.findById(id);
    if (!announcement) throw new Error('Announcement not found');

    const authorizedRoles = ['admin', 'hr manager', 'manager'];
    if (!authorizedRoles.includes(userRole.toLowerCase())) {
        throw new Error('Not authorized to delete');
    }

    // Related cleanup
    await Notification.deleteMany({
      title: 'New Announcement',
      message: announcement.title,
      route: '/dashboard/announcement'
    });

    if (announcement.imageUrl) {
      await deleteFromCloudinary(announcement.imageUrl);
    }

    await announcement.deleteOne();
    return true;
  }

  async votePoll(announcementId, userId, optionId) {
    const announcement = await Announcement.findById(announcementId);
    if (!announcement) throw new Error('Announcement not found');
    if (announcement.type !== 'Poll') throw new Error('This announcement is not a poll');

    let previousOptionId = null;
    announcement.pollOptions.forEach(opt => {
      if (opt.voters.some(voterId => voterId.toString() === userId.toString())) {
        previousOptionId = opt._id;
      }
    });

    if (previousOptionId) {
      if (previousOptionId.toString() === optionId) {
        throw new Error('You have already voted for this option');
      }
      const prevOption = announcement.pollOptions.id(previousOptionId);
      prevOption.votes = Math.max(0, prevOption.votes - 1);
      prevOption.voters = prevOption.voters.filter(vId => vId.toString() !== userId.toString());
    }

    const option = announcement.pollOptions.id(optionId);
    if (!option) throw new Error('Option not found');

    option.votes += 1;
    option.voters.push(userId);

    await announcement.save();
    return announcement;
  }
}

module.exports = new AnnouncementService();
