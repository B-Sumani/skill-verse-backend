const User = require('../models/User');
const Session = require('../models/Session');

/**
 * Find users with similar skills and interests
 * @param {string} userId - User ID to find matches for
 * @param {number} limit - Maximum number of matches to return
 * @returns {Array} Array of matched users
 */
const findSkillMatches = async (userId, limit = 10) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const userSkills = user.profile.skills || [];
    const userInterests = user.profile.interests || [];

    // Find users with similar skills or interests
    const matches = await User.find({
      _id: { $ne: userId },
      isActive: true,
      $or: [
        { 'profile.skills': { $in: userSkills } },
        { 'profile.interests': { $in: userInterests } }
      ]
    })
    .select('username profile.skills profile.interests profile.bio')
    .limit(limit);

    return matches;
  } catch (error) {
    throw new Error(`Failed to find skill matches: ${error.message}`);
  }
};

/**
 * Find sessions that match user's interests
 * @param {string} userId - User ID to find sessions for
 * @param {number} limit - Maximum number of sessions to return
 * @returns {Array} Array of matching sessions
 */
const findSessionMatches = async (userId, limit = 10) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const userSkills = user.profile.skills || [];
    const userInterests = user.profile.interests || [];

    // Find sessions with tags matching user's skills or interests
    const matches = await Session.find({
      status: { $in: ['scheduled', 'active'] },
      participants: { $ne: userId },
      $or: [
        { tags: { $in: userSkills } },
        { tags: { $in: userInterests } }
      ]
    })
    .populate('creator', 'username profile.firstName profile.lastName')
    .limit(limit)
    .sort({ startTime: 1 });

    return matches;
  } catch (error) {
    throw new Error(`Failed to find session matches: ${error.message}`);
  }
};

/**
 * Calculate compatibility score between two users
 * @param {Object} user1 - First user object
 * @param {Object} user2 - Second user object
 * @returns {number} Compatibility score (0-100)
 */
const calculateCompatibility = (user1, user2) => {
  try {
    const skills1 = user1.profile?.skills || [];
    const skills2 = user2.profile?.skills || [];
    const interests1 = user1.profile?.interests || [];
    const interests2 = user2.profile?.interests || [];

    // Calculate skill overlap
    const skillOverlap = skills1.filter(skill => skills2.includes(skill)).length;
    const skillScore = (skillOverlap / Math.max(skills1.length, skills2.length)) * 50;

    // Calculate interest overlap
    const interestOverlap = interests1.filter(interest => interests2.includes(interest)).length;
    const interestScore = (interestOverlap / Math.max(interests1.length, interests2.length)) * 50;

    return Math.round(skillScore + interestScore);
  } catch (error) {
    return 0;
  }
};

/**
 * Get recommended sessions for a user
 * @param {string} userId - User ID
 * @param {number} limit - Maximum number of recommendations
 * @returns {Array} Array of recommended sessions
 */
const getRecommendedSessions = async (userId, limit = 5) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const userSkills = user.profile.skills || [];
    const userInterests = user.profile.interests || [];

    // Find sessions with high relevance
    const recommendations = await Session.find({
      status: { $in: ['scheduled', 'active'] },
      participants: { $ne: userId },
      $or: [
        { tags: { $in: userSkills } },
        { tags: { $in: userInterests } }
      ]
    })
    .populate('creator', 'username profile.firstName profile.lastName')
    .limit(limit)
    .sort({ startTime: 1 });

    return recommendations;
  } catch (error) {
    throw new Error(`Failed to get recommended sessions: ${error.message}`);
  }
};

module.exports = {
  findSkillMatches,
  findSessionMatches,
  calculateCompatibility,
  getRecommendedSessions
}; 