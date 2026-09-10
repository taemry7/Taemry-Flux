/**
 * TAEMRY FLUX - Team Rewards & Milestone System API Routes
 * Handles direct referral Team Rewards progression status and claiming.
 * Personal Ads milestones have been retired in favor of Team Rewards.
 */

import express from 'express';
import { getDb } from '../firebaseAdmin.js';
import { verifyToken } from '../middleware/auth.js';
import {
  TEAM_REWARDS,
  TEAM_MILESTONES,
  calculateTeamRewardsStatus,
  calculateMilestoneStatus,
} from '../milestoneLogic.js';

const router = express.Router();

/**
 * GET /api/milestones/status
 * Protected: Returns progress status and claimed rewards for Team Rewards ladder.
 */
router.get('/status', verifyToken, async (req, res) => {
  try {
    const uid = req.user.uid;
    const db = getDb();
    const userRef = db.collection('users').doc(uid);
    const doc = await userRef.get();

    let user = doc.exists ? doc.data() : {};

    // Get live direct referral count
    let referralCount = user.referralCount !== undefined ? Number(user.referralCount) : 0;
    try {
      const downlinesSnap = await db.collection('users').where('referredBy', '==', uid).get();
      if (downlinesSnap && !downlinesSnap.empty) {
        referralCount = Math.max(referralCount, downlinesSnap.size);
      }
    } catch (refErr) {
      // fallback to stored referralCount
    }

    const teamAdsCount = user.teamAdsCount !== undefined ? Number(user.teamAdsCount) : 0;
    const claimedTeamRewards = Array.isArray(user.claimedTeamRewards) ? user.claimedTeamRewards : [];
    const claimedTeamMilestones = Array.isArray(user.claimedTeamMilestones) ? user.claimedTeamMilestones : [];

    const teamRewardsStatus = calculateTeamRewardsStatus(referralCount, claimedTeamRewards);
    const teamAdsStatus = calculateMilestoneStatus(teamAdsCount, TEAM_MILESTONES, claimedTeamMilestones);

    return res.json({
      success: true,
      teamRewards: teamRewardsStatus,
      rewardsList: TEAM_REWARDS,
      claimedTeamRewards,
      // Backwards compatible fields
      team: teamAdsStatus,
      personal: null, // Personal ads retired
      claimedPersonalMilestones: [],
      claimedTeamMilestones,
    });
  } catch (error) {
    console.error('Error in GET /api/milestones/status:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve team rewards status.',
      details: error.message,
    });
  }
});

/**
 * POST /api/milestones/claim
 * Protected: Validates eligibility and credits Team Reward bonus to user wallet.
 */
router.post('/claim', verifyToken, async (req, res) => {
  try {
    const { type = 'team-reward', referralsRequired, rewardId, milestoneAds } = req.body || {};
    const uid = req.user.uid;

    const db = getDb();
    const userRef = db.collection('users').doc(uid);
    const doc = await userRef.get();

    if (!doc.exists) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User profile does not exist.',
      });
    }

    const user = doc.data();

    // 1. Check if claiming Team Reward (referral milestone)
    if (type === 'team-reward' || referralsRequired || rewardId || type === 'personal') {
      // Find actual referral count
      let currentRefs = user.referralCount !== undefined ? Number(user.referralCount) : 0;
      try {
        const downlinesSnap = await db.collection('users').where('referredBy', '==', uid).get();
        if (downlinesSnap && !downlinesSnap.empty) {
          currentRefs = Math.max(currentRefs, downlinesSnap.size);
        }
      } catch (e) {}

      const claimedRewards = Array.isArray(user.claimedTeamRewards) ? [...user.claimedTeamRewards] : [];
      const claimedSet = new Set(claimedRewards.map(String));

      let target = null;
      if (referralsRequired) {
        target = TEAM_REWARDS.find((r) => r.referrals === Number(referralsRequired));
      } else if (rewardId) {
        target = TEAM_REWARDS.find((r) => r.id === rewardId);
      } else {
        // Find next eligible unclaimed reward
        target = TEAM_REWARDS.find((r) => currentRefs >= r.referrals && !claimedSet.has(String(r.referrals)) && !claimedSet.has(r.id));
      }

      if (!target) {
        return res.status(400).json({
          error: 'No Reward Available',
          message: 'No unclaimed Team Reward is currently eligible for claiming.',
        });
      }

      if (claimedSet.has(String(target.referrals)) || claimedSet.has(target.id)) {
        return res.status(400).json({
          error: 'Already Claimed',
          message: `You have already claimed the ${target.label} bonus.`,
        });
      }

      if (currentRefs < target.referrals) {
        return res.status(400).json({
          error: 'Target Not Reached',
          message: `You need ${target.referrals} direct referrals from your link to claim this reward. Current: ${currentRefs}.`,
          currentReferrals: currentRefs,
          requiredReferrals: target.referrals,
        });
      }

      const bonus = Number(target.bonus);
      const newBalance = +((Number(user.walletBalance) || 0) + bonus).toFixed(4);
      const newTotalEarned = +((Number(user.totalEarned) || 0) + bonus).toFixed(4);
      const updatedClaimed = [...claimedRewards, String(target.referrals)];
      const timestamp = new Date().toISOString();

      await userRef.update({
        walletBalance: newBalance,
        totalEarned: newTotalEarned,
        referralCount: currentRefs,
        claimedTeamRewards: updatedClaimed,
      });

      // Record transaction
      await db.collection('transactions').add({
        uid,
        type: 'team_reward_claim',
        referralsRequired: target.referrals,
        bonusAmount: bonus,
        previousBalance: user.walletBalance,
        newBalance,
        createdAt: timestamp,
        description: `Claimed Team Reward (${target.label}) for $${bonus.toFixed(2)} cash bonus`,
      });

      return res.json({
        success: true,
        bonus,
        newBalance,
        claimedReward: target.referrals,
        claimedArray: updatedClaimed,
        message: `Successfully claimed $${bonus.toFixed(2)} Team Reward bonus for ${target.label}!`,
      });
    }

    // 2. Legacy Team Ads Milestone support
    if (type === 'team') {
      const currentAds = Number(user.teamAdsCount) || 0;
      const claimedArray = Array.isArray(user.claimedTeamMilestones) ? [...user.claimedTeamMilestones] : [];
      const claimedSet = new Set(claimedArray.map(Number));

      let targetMilestone = milestoneAds
        ? TEAM_MILESTONES.find((m) => m.ads === Number(milestoneAds))
        : TEAM_MILESTONES.find((m) => currentAds >= m.ads && !claimedSet.has(m.ads));

      if (!targetMilestone) {
        return res.status(400).json({
          error: 'No Unclaimed Milestone',
          message: 'You do not have any unclaimed team milestones at this time.',
        });
      }

      if (currentAds < targetMilestone.ads) {
        return res.status(400).json({
          error: 'Milestone Not Reached',
          message: `You need ${targetMilestone.ads.toLocaleString()} team ads. Current: ${currentAds.toLocaleString()}.`,
        });
      }

      if (claimedSet.has(targetMilestone.ads)) {
        return res.status(400).json({
          error: 'Already Claimed',
          message: `Already claimed ${targetMilestone.ads.toLocaleString()} team ads milestone.`,
        });
      }

      const bonus = Number(targetMilestone.bonus);
      const newBalance = +((Number(user.walletBalance) || 0) + bonus).toFixed(4);
      const newTotalEarned = +((Number(user.totalEarned) || 0) + bonus).toFixed(4);
      const updatedClaimed = [...claimedArray, targetMilestone.ads];

      await userRef.update({
        walletBalance: newBalance,
        totalEarned: newTotalEarned,
        claimedTeamMilestones: updatedClaimed,
      });

      await db.collection('transactions').add({
        uid,
        type: 'milestone_claim',
        milestoneType: 'team',
        milestoneAds: targetMilestone.ads,
        bonusAmount: bonus,
        previousBalance: user.walletBalance,
        newBalance,
        createdAt: new Date().toISOString(),
        description: `Claimed team ads milestone (${targetMilestone.ads.toLocaleString()} ads) for $${bonus.toFixed(2)} bonus`,
      });

      return res.json({
        success: true,
        bonus,
        newBalance,
        claimedMilestone: targetMilestone.ads,
        claimedArray: updatedClaimed,
        message: `Successfully claimed $${bonus.toFixed(2)} bonus for ${targetMilestone.ads.toLocaleString()} team ads!`,
      });
    }

    return res.status(400).json({
      error: 'Invalid Request',
      message: 'Invalid claim type specified.',
    });
  } catch (error) {
    console.error('Error in POST /api/milestones/claim:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to claim reward.',
      details: error.message,
    });
  }
});

export default router;
