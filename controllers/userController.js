const User = require('../models/User');

/**
 * Get user profile
 * @route GET /api/users/profile
 */
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: { user }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get profile'
    });
  }
};

/**
 * Update user profile
 * @route PUT /api/users/profile
 */
const updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, bio, skills, interests, location, linkedin } = req.body;

    const user = await User.findById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update profile fields
    if (firstName) user.profile.firstName = firstName;
    if (lastName) user.profile.lastName = lastName;
    if (bio) user.profile.bio = bio;
    if (skills) user.profile.skills = skills;
    if (interests) user.profile.interests = interests;
    if (location) user.profile.location = location;
    if (linkedin) user.profile.linkedin = linkedin;

    await user.save();

    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: { user: userResponse }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
};

/**
 * Delete user profile
 * @route DELETE /api/users/profile
 */
const deleteProfile = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.user.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Profile deleted successfully'
    });
  } catch (error) {
    console.error('Delete profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete profile'
    });
  }
};

/**
 * Search users
 * @route GET /api/users/search
 */
const searchUsers = async (req, res) => {
  try {
    const {
      query,
      skills,
      interests,
      location,
      rating,
      availability,
      onlineOnly,
      verifiedOnly,
      sortBy = 'relevance',
      page = 1,
      limit = 20
    } = req.query;

    console.log('Search request from user:', req.user.userId);
    console.log('Search parameters:', req.query);

    // Build search query
    let searchQuery = {};

    // Exclude current user from search results
    searchQuery._id = { $ne: req.user.userId };

    // Text search
    if (query) {
      searchQuery.$or = [
        { username: { $regex: query, $options: 'i' } },
        { 'profile.firstName': { $regex: query, $options: 'i' } },
        { 'profile.lastName': { $regex: query, $options: 'i' } },
        { 'profile.skills': { $regex: query, $options: 'i' } },
        { 'profile.interests': { $regex: query, $options: 'i' } }
      ];
    }

    // Skills filter
    if (skills && skills.length > 0) {
      searchQuery['profile.skills'] = { $in: skills };
    }

    // Interests filter
    if (interests && interests.length > 0) {
      searchQuery['profile.interests'] = { $in: interests };
    }

    // Location filter
    if (location) {
      searchQuery['profile.location'] = { $regex: location, $options: 'i' };
    }

    // Rating filter
    if (rating && rating.length === 2) {
      const minRating = parseFloat(rating[0]);
      const maxRating = parseFloat(rating[1]);
      
      // If maxRating is 5 (default), don't filter by rating to include all users
      if (maxRating !== 5) {
        searchQuery['profile.rating'] = { $gte: minRating, $lte: maxRating };
      }
    }

    // Online only filter
    if (onlineOnly === 'true') {
      searchQuery['profile.isOnline'] = true;
    }

    // Verified only filter
    if (verifiedOnly === 'true') {
      searchQuery['profile.isVerified'] = true;
    }

    // Build sort options
    let sortOptions = {};
    switch (sortBy) {
      case 'rating':
        sortOptions['profile.rating'] = -1;
        break;
      case 'name':
        sortOptions['profile.firstName'] = 1;
        break;
      case 'recent':
        sortOptions.createdAt = -1;
        break;
      default:
        sortOptions.createdAt = -1;
    }

    // Execute query
    const users = await User.find(searchQuery)
      .select('-password')
      .sort(sortOptions)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    // Get total count for pagination
    const total = await User.countDocuments(searchQuery);

    console.log('Search query:', JSON.stringify(searchQuery, null, 2));
    console.log('Found users:', users.length);
    console.log('Total users in database:', await User.countDocuments({}));

    res.status(200).json({
      success: true,
      data: {
        users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search users'
    });
  }
};

/**
 * Get all users (for debugging)
 * @route GET /api/users/all
 */
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    
    console.log('All users in database:', users.length);
    users.forEach(user => {
      console.log(`- ${user.username} (${user.email}) - ID: ${user._id}`);
    });

    res.status(200).json({
      success: true,
      data: { users }
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get users'
    });
  }
};

/**
 * Get other user's profile
 * @route GET /api/users/:userId/profile
 */
const getOtherUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: { user }
    });
  } catch (error) {
    console.error('Get other user profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user profile'
    });
  }
};

/**
 * Send skill exchange request
 * @route POST /api/users/skill-exchange-request
 */
const sendSkillExchangeRequest = async (req, res) => {
  try {
    const { recipientId, message, skillsOffered, skillsWanted } = req.body;

    // Validate recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({
        success: false,
        message: 'Recipient not found'
      });
    }

    // TODO: Create session request in database
    // For now, just return success
    res.status(200).json({
      success: true,
      message: 'Skill exchange request sent successfully'
    });
  } catch (error) {
    console.error('Send skill exchange request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send skill exchange request'
    });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  deleteProfile,
  searchUsers,
  getOtherUserProfile,
  sendSkillExchangeRequest,
  getAllUsers
}; 