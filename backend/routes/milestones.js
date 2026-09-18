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
 * Helper to get live configurable milestones from Firestore systemSettings
 */
export async function getLiveMilestonesConfig(db) {
  try {
    const doc = await db.collection('systemSettings').doc('milestones').get();
    if (doc && doc.exists && doc.data()) {
      const data = doc.data();
      return {
        teamRewards: Array.isArray(data.teamRewards) && data.teamRewards.length > 0 ? data.teamRewards : TEAM_REWARDS,
        teamMilestones: Array.isArray(data.teamMilestones) && data.teamMilestones.length > 0 ? data.teamMilestones : TEAM_MILESTONES,
      };
    }
  } catch (err) {
    console.warn('Failed to load systemSettings/milestones:', err.message);
  }
  return { teamRewards: TEAM_REWARDS, teamMilestones: TEAM_MILESTONES };
}

/**
 * Helper to get user's direct downlines and partition by package eligibility
 */
async function getDirectDownlines(db, uid, user) {
  let downlineDocs = [];
  const cleanUsername = (user.username || user.displayName || user.name || '').trim().replace(/^@/, '');
  const referralCode = cleanUsername || user.referralCode || '';
  const queryCodes = Array.from(new Set([uid, referralCode, cleanUsername, `@${cleanUsername}`].filter(Boolean)));

  for (const code of queryCodes) {
    try {
      const snap = await db.collection('users').where('referredBy', '==', code).get();
      if (snap && !snap.empty) {
        const existingIds = new Set(downlineDocs.map((d) => d.id));
        snap.docs.forEach((d) => {
          if (!existingIds.has(d.id) && d.id !== uid) {
            downlineDocs.push(d);
          }
        });
      }
    } catch (e) {}
  }

  let eligibleCount = 0;
  const list = downlineDocs.map((doc) => {
    const d = doc.data() || {};
    const pkg = (d.currentPackage || '').trim();
    const hasPackage = Boolean(pkg && pkg !== 'None' && pkg !== 'No Package');
    const isEligible = Boolean(d.isEligible || hasPackage);
    if (isEligible) eligibleCount++;
    return {
      id: doc.id,
      name: d.name || d.displayName || d.username || 'Member',
      username: d.username || d.displayName || d.name || 'member',
      email: d.email || 'hidden@taemryflux.com',
      package: hasPackage ? pkg : 'None',
      lifetimeAds: Number(d.lifetimeAds) || 0,
      joinedDate: d.createdAt || new Date().toISOString(),
      isEligible,
      status: isEligible ? 'Eligible' : 'Ineligible',
    };
  });

  return { totalCount: downlineDocs.length, eligibleCount, list };
}

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

    // Get live direct downlines and strictly filter for eligible referrals (package purchased)
    const { totalCount, eligibleCount, list: directReferrals } = await getDirectDownlines(db, uid, user);

    // Only package-activated (eligible) referrals count toward team rewards progression
    const referralCount = eligibleCount;

    const { teamRewards: activeRewards, teamMilestones: activeMilestones } = await getLiveMilestonesConfig(db);

    const teamAdsCount = user.teamAdsCount !== undefined ? Number(user.teamAdsCount) : 0;
    const claimedTeamRewards = Array.isArray(user.claimedTeamRewards) ? user.claimedTeamRewards : [];
    const claimedTeamMilestones = Array.isArray(user.claimedTeamMilestones) ? user.claimedTeamMilestones : [];

    const teamRewardsStatus = calculateTeamRewardsStatus(referralCount, claimedTeamRewards, activeRewards);
    const teamAdsStatus = calculateMilestoneStatus(teamAdsCount, activeMilestones, claimedTeamMilestones);

    return res.json({
      success: true,
      teamRewards: teamRewardsStatus,
      rewardsList: activeRewards,
      teamMilestones: activeMilestones,
      claimedTeamRewards,
      eligibleReferralsCount: eligibleCount,
      totalReferralsCount: totalCount,
      directReferrals,
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
    const { teamRewards: activeRewards, teamMilestones: activeMilestones } = await getLiveMilestonesConfig(db);

    if (type === 'team-reward' || referralsRequired || rewardId || type === 'personal') {
      // Find actual eligible referral count (only members with active package)
      const { eligibleCount, totalCount } = await getDirectDownlines(db, uid, user);
      const currentRefs = eligibleCount;

      const claimedRewards = Array.isArray(user.claimedTeamRewards) ? [...user.claimedTeamRewards] : [];
      const claimedSet = new Set(claimedRewards.map(String));

      let target = null;
      if (referralsRequired) {
        target = activeRewards.find((r) => r.referrals === Number(referralsRequired));
      } else if (rewardId) {
        target = activeRewards.find((r) => r.id === rewardId);
      } else {
        // Find next eligible unclaimed reward
        target = activeRewards.find((r) => currentRefs >= r.referrals && !claimedSet.has(String(r.referrals)) && !claimedSet.has(r.id));
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
          message: `You need ${target.referrals} eligible direct referrals (with active package) from your link to claim this reward. Current eligible: ${currentRefs} (Total: ${totalCount}).`,
          currentReferrals: currentRefs,
          totalReferrals: totalCount,
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

    // 2. Team Ads Milestone support - LOCKED per user instruction
    if (type === 'team') {
      return res.status(403).json({
        error: 'Team Ads Rewards Locked',
        message: 'Team ads milestone rewards are currently locked by administration.',
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
