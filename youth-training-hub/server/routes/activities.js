// Parent activity logging routes
import express from 'express';
import { query } from '../db/index.js';
import { authenticateToken, requireRole, verifyYouthOwnership } from '../middleware/auth.js';

const router = express.Router();

/**
 * POST /api/activities
 * Log a new activity for a youth (parent only)
 * Simple flow: activity name + date + time + duration
 *
 * Body: {
 *   youthCode: string,
 *   activity: string (free text),
 *   trainingDate: ISO date string,
 *   duration: number (minutes)
 * }
 */
router.post('/', authenticateToken, requireRole('parent'), async (req, res) => {
  try {
    const { youthCode, activity, trainingDate, duration } = req.body;
    const { userId } = req.user;

    // Validate input
    if (!youthCode || !activity || !trainingDate || !duration) {
      return res.status(400).json({
        error: 'All fields are required: youthCode, activity, trainingDate, duration'
      });
    }

    if (duration <= 0 || duration > 480) {
      return res.status(400).json({
        error: 'Duration must be between 1 and 480 minutes'
      });
    }

    // Verify parent owns the youth
    const ownerQuery = `
      SELECT id, name
      FROM youths
      WHERE UPPER(code) = UPPER($1) AND parent_user_id = $2
    `;
    const ownerResult = await query(ownerQuery, [youthCode, userId]);

    if (ownerResult.rows.length === 0) {
      return res.status(403).json({
        error: 'You do not have permission to log activities for this youth'
      });
    }

    const youth = ownerResult.rows[0];

    // Create activity
    const insertQuery = `
      INSERT INTO parent_activities (
        youth_code,
        activity,
        training_date,
        duration,
        parent_user_id
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, training_date, recorded_at
    `;
    const result = await query(insertQuery, [
      youthCode.toUpperCase(),
      activity.trim(),
      trainingDate,
      duration,
      userId
    ]);
    const activityRecord = result.rows[0];

    res.status(201).json({
      activity: {
        id: activityRecord.id,
        youthCode: youthCode.toUpperCase(),
        youthName: youth.name,
        activity: activity.trim(),
        trainingDate: activityRecord.training_date,
        duration,
        recordedAt: activityRecord.recorded_at
      },
      message: 'Activity logged successfully'
    });

  } catch (error) {
    console.error('Create activity error:', error);
    res.status(500).json({ error: 'Failed to log activity' });
  }
});

/**
 * GET /api/activities/youth/:youthCode
 * Get all activities for a youth (parent only)
 */
router.get('/youth/:youthCode', authenticateToken, verifyYouthOwnership, async (req, res) => {
  try {
    const { youthCode } = req.params;
    const { startDate, endDate } = req.query;

    let activitiesQuery = `
      SELECT
        id,
        activity,
        training_date,
        duration,
        recorded_at
      FROM parent_activities
      WHERE UPPER(youth_code) = UPPER($1)
    `;
    const queryParams = [youthCode];

    // Add date filtering if provided
    if (startDate) {
      queryParams.push(startDate);
      activitiesQuery += ` AND training_date >= $${queryParams.length}`;
    }

    if (endDate) {
      queryParams.push(endDate);
      activitiesQuery += ` AND training_date <= $${queryParams.length}`;
    }

    activitiesQuery += ` ORDER BY training_date DESC`;

    const result = await query(activitiesQuery, queryParams);

    // Group activities by sport/activity type
    const activityStats = {};
    result.rows.forEach(row => {
      const activityName = row.activity;
      if (!activityStats[activityName]) {
        activityStats[activityName] = {
          count: 0,
          totalMinutes: 0
        };
      }
      activityStats[activityName].count++;
      activityStats[activityName].totalMinutes += row.duration;
    });

    res.json({
      activities: result.rows.map(row => ({
        id: row.id,
        activity: row.activity,
        trainingDate: row.training_date,
        duration: row.duration,
        recordedAt: row.recorded_at
      })),
      statistics: {
        totalActivities: result.rows.length,
        totalMinutes: result.rows.reduce((sum, row) => sum + row.duration, 0),
        totalHours: Math.round((result.rows.reduce((sum, row) => sum + row.duration, 0) / 60) * 10) / 10,
        activityBreakdown: Object.entries(activityStats).map(([activity, stats]) => ({
          activity,
          count: stats.count,
          totalMinutes: stats.totalMinutes,
          totalHours: Math.round((stats.totalMinutes / 60) * 10) / 10
        })).sort((a, b) => b.count - a.count)
      }
    });

  } catch (error) {
    console.error('Get activities error:', error);
    res.status(500).json({ error: 'Failed to get activities' });
  }
});

/**
 * GET /api/activities/parent
 * Get all activities logged by the authenticated parent
 */
router.get('/parent', authenticateToken, requireRole('parent'), async (req, res) => {
  try {
    const { userId } = req.user;
    const { limit = 20 } = req.query;

    const activitiesQuery = `
      SELECT
        pa.id,
        pa.youth_code,
        pa.activity,
        pa.training_date,
        pa.duration,
        pa.recorded_at,
        y.name as youth_name
      FROM parent_activities pa
      JOIN youths y ON y.code = pa.youth_code
      WHERE pa.parent_user_id = $1
      ORDER BY pa.training_date DESC
      LIMIT $2
    `;
    const result = await query(activitiesQuery, [userId, parseInt(limit)]);

    res.json({
      activities: result.rows.map(row => ({
        id: row.id,
        youthCode: row.youth_code,
        youthName: row.youth_name,
        activity: row.activity,
        trainingDate: row.training_date,
        duration: row.duration,
        recordedAt: row.recorded_at
      }))
    });

  } catch (error) {
    console.error('Get parent activities error:', error);
    res.status(500).json({ error: 'Failed to get activities' });
  }
});

/**
 * GET /api/activities/:activityId
 * Get activity details
 */
router.get('/:activityId', authenticateToken, async (req, res) => {
  try {
    const { activityId } = req.params;
    const { userId, role } = req.user;

    // Get activity details
    const activityQuery = `
      SELECT
        pa.id,
        pa.youth_code,
        pa.activity,
        pa.training_date,
        pa.duration,
        pa.recorded_at,
        pa.parent_user_id,
        y.name as youth_name,
        u.name as parent_name
      FROM parent_activities pa
      JOIN youths y ON y.code = pa.youth_code
      JOIN users u ON u.id = pa.parent_user_id
      WHERE pa.id = $1
    `;
    const result = await query(activityQuery, [activityId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    const activity = result.rows[0];

    // Verify access
    if (role === 'parent' && activity.parent_user_id !== userId) {
      return res.status(403).json({ error: 'Unauthorized to view this activity' });
    }

    res.json({
      activity: {
        id: activity.id,
        youthCode: activity.youth_code,
        youthName: activity.youth_name,
        parentName: activity.parent_name,
        activity: activity.activity,
        trainingDate: activity.training_date,
        duration: activity.duration,
        recordedAt: activity.recorded_at
      }
    });

  } catch (error) {
    console.error('Get activity error:', error);
    res.status(500).json({ error: 'Failed to get activity details' });
  }
});

/**
 * PUT /api/activities/:activityId
 * Update activity details (parent only)
 *
 * Body: {
 *   activity?: string,
 *   trainingDate?: ISO date string,
 *   duration?: number
 * }
 */
router.put('/:activityId', authenticateToken, requireRole('parent'), async (req, res) => {
  try {
    const { activityId } = req.params;
    const { activity, trainingDate, duration } = req.body;
    const { userId } = req.user;

    // Verify parent owns the activity
    const ownerQuery = `
      SELECT 1
      FROM parent_activities
      WHERE id = $1 AND parent_user_id = $2
    `;
    const ownerResult = await query(ownerQuery, [activityId, userId]);

    if (ownerResult.rows.length === 0) {
      return res.status(403).json({
        error: 'You do not have permission to update this activity'
      });
    }

    // Build update query
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (activity) {
      updates.push(`activity = $${paramCount++}`);
      values.push(activity.trim());
    }

    if (trainingDate) {
      updates.push(`training_date = $${paramCount++}`);
      values.push(trainingDate);
    }

    if (duration !== undefined) {
      if (duration <= 0 || duration > 480) {
        return res.status(400).json({
          error: 'Duration must be between 1 and 480 minutes'
        });
      }
      updates.push(`duration = $${paramCount++}`);
      values.push(duration);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(activityId);

    const updateQuery = `
      UPDATE parent_activities
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, activity, training_date, duration
    `;
    const result = await query(updateQuery, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    const updatedActivity = result.rows[0];

    res.json({
      activity: {
        id: updatedActivity.id,
        activity: updatedActivity.activity,
        trainingDate: updatedActivity.training_date,
        duration: updatedActivity.duration
      }
    });

  } catch (error) {
    console.error('Update activity error:', error);
    res.status(500).json({ error: 'Failed to update activity' });
  }
});

/**
 * DELETE /api/activities/:activityId
 * Delete an activity (parent only)
 */
router.delete('/:activityId', authenticateToken, requireRole('parent'), async (req, res) => {
  try {
    const { activityId } = req.params;
    const { userId } = req.user;

    // Verify parent owns the activity
    const ownerQuery = `
      SELECT activity, training_date
      FROM parent_activities
      WHERE id = $1 AND parent_user_id = $2
    `;
    const ownerResult = await query(ownerQuery, [activityId, userId]);

    if (ownerResult.rows.length === 0) {
      return res.status(403).json({
        error: 'You do not have permission to delete this activity'
      });
    }

    // Delete activity
    const deleteQuery = `
      DELETE FROM parent_activities
      WHERE id = $1
    `;
    await query(deleteQuery, [activityId]);

    res.json({
      message: 'Activity deleted successfully'
    });

  } catch (error) {
    console.error('Delete activity error:', error);
    res.status(500).json({ error: 'Failed to delete activity' });
  }
});

/**
 * GET /api/activities/suggestions/:youthCode
 * Get activity name suggestions based on previously logged activities
 */
router.get('/suggestions/:youthCode', authenticateToken, verifyYouthOwnership, async (req, res) => {
  try {
    const { youthCode } = req.params;

    // Get unique activity names for this youth
    const suggestionsQuery = `
      SELECT DISTINCT activity, COUNT(*) as frequency
      FROM parent_activities
      WHERE UPPER(youth_code) = UPPER($1)
      GROUP BY activity
      ORDER BY frequency DESC, activity ASC
      LIMIT 10
    `;
    const result = await query(suggestionsQuery, [youthCode]);

    // Add common sports if not already present
    const commonSports = [
      'Swimming', 'Dance', 'Martial Arts', 'Tennis', 'Basketball',
      'Gymnastics', 'Athletics', 'Hockey', 'Cycling', 'Yoga'
    ];

    const existingActivities = result.rows.map(r => r.activity.toLowerCase());
    const suggestions = result.rows.map(r => r.activity);

    commonSports.forEach(sport => {
      if (!existingActivities.includes(sport.toLowerCase()) && suggestions.length < 15) {
        suggestions.push(sport);
      }
    });

    res.json({ suggestions });

  } catch (error) {
    console.error('Get suggestions error:', error);
    res.status(500).json({ error: 'Failed to get activity suggestions' });
  }
});

export default router;