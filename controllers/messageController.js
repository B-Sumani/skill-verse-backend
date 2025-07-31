const Message = require('../models/Message');
const User = require('../models/User');

/**
 * Content filtering utility functions
 */
const contentFilter = {
  // Phone number patterns (various formats)
  phonePatterns: [
    /(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g, // US/Canada: (123) 456-7890, 123-456-7890, 123.456.7890
    /(\+?44[-.\s]?)?\(?([0-9]{4,5})\)?[-.\s]?([0-9]{3,4})[-.\s]?([0-9]{3,4})/g, // UK: 07123 456789, 07123-456789
    /(\+?91[-.\s]?)?([0-9]{5})[-.\s]?([0-9]{5})/g, // India: 98765 43210, 98765-43210
    /(\+?[0-9]{1,3}[-.\s]?)?([0-9]{3,4})[-.\s]?([0-9]{3,4})[-.\s]?([0-9]{3,4})/g, // International
    /[0-9]{10,15}/g, // Any sequence of 10-15 digits
  ],

  // Email patterns
  emailPatterns: [
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, // Standard email format
  ],

  // Social media handles
  socialMediaPatterns: [
    /@[a-zA-Z0-9._]{3,30}/g, // Twitter/Instagram handles
    /(?:https?:\/\/)?(?:www\.)?(?:facebook\.com|twitter\.com|instagram\.com|linkedin\.com|tiktok\.com)\/[a-zA-Z0-9._-]+/gi, // Social media URLs
  ],

  // Personal website URLs
  websitePatterns: [
    /(?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?/g, // General URLs
  ],

  // Check if content contains restricted information
  containsRestrictedContent: (content) => {
    const violations = [];

    // Check for phone numbers
    contentFilter.phonePatterns.forEach((pattern, index) => {
      const matches = content.match(pattern);
      if (matches) {
        violations.push({
          type: 'phone_number',
          pattern: index,
          matches: matches,
          message: 'Phone numbers are not allowed in messages'
        });
      }
    });

    // Check for email addresses
    contentFilter.emailPatterns.forEach((pattern, index) => {
      const matches = content.match(pattern);
      if (matches) {
        violations.push({
          type: 'email_address',
          pattern: index,
          matches: matches,
          message: 'Email addresses are not allowed in messages'
        });
      }
    });

    // Check for social media handles
    contentFilter.socialMediaPatterns.forEach((pattern, index) => {
      const matches = content.match(pattern);
      if (matches) {
        violations.push({
          type: 'social_media',
          pattern: index,
          matches: matches,
          message: 'Social media handles are not allowed in messages'
        });
      }
    });

    // Check for personal websites (but allow common educational/tech sites)
    const allowedDomains = [
      'github.com', 'stackoverflow.com', 'medium.com', 'dev.to', 'codepen.io',
      'jsfiddle.net', 'replit.com', 'codesandbox.io', 'glitch.com', 'heroku.com',
      'netlify.com', 'vercel.com', 'aws.amazon.com', 'google.com', 'microsoft.com',
      'apple.com', 'mozilla.org', 'w3.org', 'mdn.io', 'css-tricks.com',
      'smashingmagazine.com', 'sitepoint.com', 'tutsplus.com', 'udemy.com',
      'coursera.org', 'edx.org', 'khanacademy.org', 'freecodecamp.org'
    ];

    const websiteMatches = content.match(contentFilter.websitePatterns[0]);
    if (websiteMatches) {
      const restrictedUrls = websiteMatches.filter(url => {
        const domain = url.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
        return !allowedDomains.some(allowed => domain.includes(allowed));
      });

      if (restrictedUrls.length > 0) {
        violations.push({
          type: 'personal_website',
          matches: restrictedUrls,
          message: 'Personal website URLs are not allowed in messages'
        });
      }
    }

    return violations;
  },

  // Sanitize content by replacing restricted information with placeholders
  sanitizeContent: (content) => {
    let sanitized = content;

    // Replace phone numbers
    contentFilter.phonePatterns.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '[PHONE NUMBER REMOVED]');
    });

    // Replace email addresses
    contentFilter.emailPatterns.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '[EMAIL REMOVED]');
    });

    // Replace social media handles
    contentFilter.socialMediaPatterns.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '[SOCIAL MEDIA HANDLE REMOVED]');
    });

    // Replace personal websites (but keep allowed domains)
    const allowedDomains = [
      'github.com', 'stackoverflow.com', 'medium.com', 'dev.to', 'codepen.io',
      'jsfiddle.net', 'replit.com', 'codesandbox.io', 'glitch.com', 'heroku.com',
      'netlify.com', 'vercel.com', 'aws.amazon.com', 'google.com', 'microsoft.com',
      'apple.com', 'mozilla.org', 'w3.org', 'mdn.io', 'css-tricks.com',
      'smashingmagazine.com', 'sitepoint.com', 'tutsplus.com', 'udemy.com',
      'coursera.org', 'edx.org', 'khanacademy.org', 'freecodecamp.org'
    ];

    const websiteMatches = sanitized.match(contentFilter.websitePatterns[0]);
    if (websiteMatches) {
      websiteMatches.forEach(url => {
        const domain = url.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
        const isAllowed = allowedDomains.some(allowed => domain.includes(allowed));
        if (!isAllowed) {
          sanitized = sanitized.replace(url, '[PERSONAL WEBSITE REMOVED]');
        }
      });
    }

    return sanitized;
  }
};

/**
 * Send a message
 * @route POST /api/messages
 */


const sendMessage = async (req, res) => {
  try {
    const { receiverId, content, type = 'text' } = req.body;
    const senderId = req.user.userId;

    // Content filtering
    const contentViolations = contentFilter.containsRestrictedContent(content);
    if (contentViolations.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Message blocked for privacy protection',
        violations: contentViolations,
        sanitizedContent: contentFilter.sanitizeContent(content),
        code: 'CONTENT_FILTERED'
      });
    }

    // Validate required fields
    if (!receiverId || !content) {
      return res.status(400).json({
        success: false,
        message: 'Receiver ID and content are required'
      });
    }

    // Check if receiver exists
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({
        success: false,
        message: 'Receiver not found'
      });
    }

    // Check for restricted content
    const violations = contentFilter.containsRestrictedContent(content);
    
    if (violations.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Message contains restricted content',
        violations: violations,
        sanitizedContent: contentFilter.sanitizeContent(content)
      });
    }

    // Create the message
    const message = new Message({
      sender: senderId,
      recipient: receiverId,
      content,
      messageType: type,
      createdAt: new Date()
    });

    await message.save();

    // Populate sender and recipient details
    await message.populate('sender', 'username profile.firstName profile.lastName');
    await message.populate('recipient', 'username profile.firstName profile.lastName');

    // Send real-time notification via Socket.IO
    const io = req.app.get('io');
    if (io) {
      // Emit to the recipient's room
      io.to(`user-${receiverId}`).emit('message:received', {
        message: message,
        sender: message.sender,
        timestamp: message.createdAt
      });
      
      console.log(`💬 Message sent from ${senderId} to ${receiverId} via Socket.IO`);
    }

    res.status(201).json({
      success: true,
      data: { message },
      message: 'Message sent successfully'
    });

  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message'
    });
  }
};

/**
 * Get messages between two users
 * @route GET /api/messages/:userId
 */
const getMessages = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.userId;
    const { page = 1, limit = 50 } = req.query;

    // Validate user ID
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    // Check if the other user exists
    const otherUser = await User.findById(userId);
    if (!otherUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get messages between the two users
    const messages = await Message.find({
      $or: [
        { sender: currentUserId, recipient: userId },
        { sender: userId, recipient: currentUserId }
      ]
    })
    .populate('sender', 'username profile.firstName profile.lastName')
    .populate('recipient', 'username profile.firstName profile.lastName')
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .skip((parseInt(page) - 1) * parseInt(limit));

    // Get total count for pagination
    const total = await Message.countDocuments({
      $or: [
        { sender: currentUserId, recipient: userId },
        { sender: userId, recipient: currentUserId }
      ]
    });

    res.status(200).json({
      success: true,
      messages: messages.reverse(), // Show oldest first
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get messages'
    });
  }
};

/**
 * Get all conversations for current user
 * @route GET /api/messages
 */
const getConversations = async (req, res) => {
  try {
    const currentUserId = req.user.userId;
    const mongoose = require('mongoose');
    const currentUserObjectId = new mongoose.Types.ObjectId(currentUserId);

    console.log(`🔍 Getting conversations for user: ${currentUserId}`);

    // Get all unique conversations
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [
            { sender: currentUserObjectId },
            { recipient: currentUserObjectId }
          ]
        }
      },
      {
        $addFields: {
          otherUserId: {
            $cond: {
              if: { $eq: ['$sender', currentUserObjectId] },
              then: '$recipient',
              else: '$sender'
            }
          }
        }
      },
      {
        $group: {
          _id: '$otherUserId',
          lastMessage: { $last: '$$ROOT' },
          messageCount: { $sum: 1 },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$recipient', currentUserObjectId] },
                    { $eq: ['$isRead', false] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $sort: { 'lastMessage.createdAt': -1 }
      }
    ]);

    console.log(`📊 Found ${conversations.length} conversations from aggregation`);

    // Populate user details for each conversation
    const populatedConversations = await Promise.all(
      conversations.map(async (conversation) => {
        const user = await User.findById(conversation._id)
          .select('username profile.firstName profile.lastName profile.avatar isOnline lastLogin');
        
        console.log(`👤 Populated user for conversation: ${user?.username}`);
        
        return {
          ...conversation,
          user
        };
      })
    );

    console.log(`✅ Returning ${populatedConversations.length} populated conversations`);

    res.status(200).json({
      success: true,
      conversations: populatedConversations
    });

  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get conversations'
    });
  }
};

/**
 * Mark messages as read
 * @route PUT /api/messages/:userId/read
 */
const markAsRead = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.userId;

    // Mark all unread messages from this user as read
    await Message.updateMany(
      {
        sender: userId,
        recipient: currentUserId,
        isRead: false
      },
      {
        isRead: true,
        readAt: new Date()
      }
    );

    res.status(200).json({
      success: true,
      message: 'Messages marked as read'
    });

  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark messages as read'
    });
  }
};

/**
 * Delete a message
 * @route DELETE /api/messages/:messageId
 */
const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const currentUserId = req.user.userId;

    // Find the message
    const message = await Message.findById(messageId);
    
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Check if user is the sender (only sender can delete)
    if (message.senderId.toString() !== currentUserId) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own messages'
      });
    }

    await Message.findByIdAndDelete(messageId);

    res.status(200).json({
      success: true,
      message: 'Message deleted successfully'
    });

  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete message'
    });
  }
};

/**
 * Check content for violations (utility endpoint)
 * @route POST /api/messages/check-content
 */
const checkContent = async (req, res) => {
  try {
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Content is required'
      });
    }

    const violations = contentFilter.containsRestrictedContent(content);
    const sanitized = contentFilter.sanitizeContent(content);

    res.status(200).json({
      success: true,
      data: {
        hasViolations: violations.length > 0,
        violations,
        sanitizedContent: sanitized,
        originalContent: content
      }
    });

  } catch (error) {
    console.error('Check content error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check content'
    });
  }
};

module.exports = {
  sendMessage,
  getMessages,
  getConversations,
  markAsRead,
  deleteMessage,
  checkContent,
  contentFilter
}; 