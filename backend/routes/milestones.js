/**
 * TAEMRY FLUX - Milestone System API Routes
 * Handles Personal and Team milestone progression status and reward claims.
 */

import express from 'express';
import { getDb } from '../firebaseAdmin.js';
import { verifyToken } from '../middleware/auth.js';
import {
  PERSONAL_MILESTONES,
  TEAM_MILESTONES,
  calculateMilestoneStatus,
} from '../milestoneLogic.js';

const router = express.Router();

/**
 * GET /api/milestones/status
 * Protected: Returns progress status and claimed milestones for personal and team tracks.
 */
router.get('/status', verifyToken, async (req, res) => {
  try {
    const uid = req.user.uid;
    const db = getDb();
    const userRef = db.collection('users').doc(uid);
    const doc = await userRef.get();

    let user = doc.exists ? doc.data() : {};

    const lifetimeAds = user.lifetimeAds !== undefined ? Number(user.lifetimeAds) : 0;
    const teamAdsCount = user.teamAdsCount !== undefined ? Number(user.teamAdsCount) : 0;
    const claimedPersonal = Array.isArray(user.claimedPersonalMilestones) ? user.claimedPersonalMilestones : [];
    const claimedTeam = Array.isArray(user.claimedTeamMilestones) ? user.claimedTeamMilestones : [];

    const personalStatus = calculateMilestoneStatus(lifetimeAds, PERSONAL_MILESTONES, claimedPersonal);
    const teamStatus = calculateMilestoneStatus(teamAdsCount, TEAM_MILESTONES, claimedTeam);

    return res.json({
      success: true,
      personal: personalStatus,
      team: teamStatus,
      claimedPersonalMilestones: claimedPersonal,
      claimedTeamMilestones: claimedTeam,
      personalMilestonesList: PERSONAL_MILESTONES,
      teamMilestonesList: TEAM_MILESTONES,
    });
  } catch (error) {
    console.error('Error in GET /api/milestones/status:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve milestone status.',
      details: error.message,
    });
  }
});

/**
 * POST /api/milestones/claim
 * Protected: Validates eligibility and credits milestone bonus to wallet.
 */
router.post('/claim', verifyToken, async (req, res) => {
  try {
    const { type, milestoneAds } = req.body || {};
    const uid = req.user.uid;

    if (!type || (type !== 'personal' && type !== 'team')) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid milestone type. Must be "personal" or "team".',
      });
    }

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
    const isPersonal = type === 'personal';
    const currentAds = isPersonal ? (Number(user.lifetimeAds) || 0) : (Number(user.teamAdsCount) || 0);
    const milestonesList = isPersonal ? PERSONAL_MILESTONES : TEAM_MILESTONES;
    const claimedField = isPersonal ? 'claimedPersonalMilestones' : 'claimedTeamMilestones';
    const claimedArray = Array.isArray(user[claimedField]) ? [...user[claimedField]] : [];
    const claimedSet = new Set(claimedArray.map(Number));

    // Determine target milestone to claim
    let targetMilestone = null;

    if (milestoneAds) {
      const parsedAds = Number(milestoneAds);
      targetMilestone = milestonesList.find((m) => m.ads === parsedAds);
      if (!targetMilestone) {
        return res.status(400).json({
          error: 'Invalid Milestone',
          message: `Milestone of ${parsedAds} ads does not exist in the ${type} ladder.`,
        });
      }
    } else {
      // Find lowest achieved milestone that has not been claimed yet
      targetMilestone = milestonesList.find((m) => currentAds >= m.ads && !claimedSet.has(m.ads));
    }

    if (!targetMilestone) {
      return res.status(400).json({
        error: 'No Unclaimed Milestone',
        message: `You do not have any unclaimed ${type} milestones at this time.`,
      });
    }

    // Check if user has enough ads for this milestone
    if (currentAds < targetMilestone.ads) {
      return res.status(400).json({
        error: 'Milestone Not Reached',
        message: `You need ${targetMilestone.ads.toLocaleString()} ads to claim this bonus. Current: ${currentAds.toLocaleString()}.`,
        currentAds,
        requiredAds: targetMilestone.ads,
      });
    }

    // Check if already claimed
    if (claimedSet.has(targetMilestone.ads)) {
      return res.status(400).json({
        error: 'Already Claimed',
        message: `You have already claimed the ${targetMilestone.ads.toLocaleString()} ads milestone bonus.`,
      });
    }

    // Process reward bonus
    const bonus = Number(targetMilestone.bonus);
    const newBalance = +((Number(user.walletBalance) || 0) + bonus).toFixed(4);
    const newTotalEarned = +((Number(user.totalEarned) || 0) + bonus).toFixed(4);
    const updatedClaimed = [...claimedArray, targetMilestone.ads];
    const timestamp = new Date().toISOString();

    // Update user record in Firestore
    await userRef.update({
      walletBalance: newBalance,
      totalEarned: newTotalEarned,
      [claimedField]: updatedClaimed,
    });

    // Record transaction
    await db.collection('transactions').add({
      uid,
      type: 'milestone_claim',
      milestoneType: type,
      milestoneAds: targetMilestone.ads,
      bonusAmount: bonus,
      previousBalance: user.walletBalance,
      newBalance,
      createdAt: timestamp,
      description: `Claimed ${type} milestone (${targetMilestone.ads.toLocaleString()} ads) for $${bonus.toFixed(2)} bonus`,
    });

    return res.json({
      success: true,
      bonus,
      newBalance,
      claimedMilestone: targetMilestone.ads,
      claimedArray: updatedClaimed,
      message: `Successfully claimed $${bonus.toFixed(2)} bonus for ${targetMilestone.ads.toLocaleString()} ads!`,
    });
  } catch (error) {
    console.error('Error in POST /api/milestones/claim:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to claim milestone.',
      details: error.message,
    });
  }
});

export default router;
