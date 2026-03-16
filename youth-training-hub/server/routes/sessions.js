// Coach session management routes
import express from 'express';
import { query, transaction } from '../db/index.js';
import { authenticateToken, requireRole, verifyTeamOwnership } from '../middleware/auth.js';

const router = express.Router();

/**
 * POST /api/sessions
 * Log a new training session with drills and attendance
 *
 * Body: {
 *   teamId: string,
 *   trainingDate: ISO date string,
 *   templateName?: string,
 *   drills: Array<{
 *     drillId: string,
 *     name: string,
 *     duration: number,
 *     notes?: string
 *   }>,
 *   attendees: Array<string>, // youth codes
 *   notes?: string
 * }
 */
router.post('/', authenticateToken, requireRole('coach'), async (req, res) => {
  try {
    const { teamId, trainingDate, templateName, drills, attendees, notes } = req.body;
    const { userId } = req.user;

    // Validate input
    if (!teamId || !trainingDate || !drills || !Array.isArray(drills) || !attendees || !Array.isArray(attendees)) {
      return res.status(400).json({
        error: 'teamId, trainingDate, drills array, and attendees array are required'
      });
    }

    if (drills.length === 0) {
      return res.status(400).json({ error: 'At least one drill is required' });
    }

    // Verify coach owns the team
    const teamQuery = `
      SELECT id, name, sport
      FROM teams
      WHERE id = $1 AND coach_user_id = $2
    `;
    const teamResult = await query(teamQuery, [teamId, userId]);

    if (teamResult.rows.length === 0) {
      return res.status(403).json({ error: 'You do not have permission to log sessions for this team' });
    }

    const team = teamResult.rows[0];

    // Verify all attendees are linked to the team
    if (attendees.length > 0) {
      const linkedQuery = `
        SELECT youth_code
        FROM team_youth_links
        WHERE team_id = $1
          AND UPPER(youth_code) IN (${attendees.map((_, i) => `UPPER($${i + 2})`).join(',')})
      `;
      const linkedResult = await query(linkedQuery, [teamId, ...attendees]);
      const linkedCodes = linkedResult.rows.map(r => r.youth_code.toUpperCase());

      const unlinkedCodes = attendees.filter(code =>
        !linkedCodes.includes(code.toUpperCase())
      );

      if (unlinkedCodes.length > 0) {
        return res.status(400).json({
          error: `The following youth codes are not linked to this team: ${unlinkedCodes.join(', ')}`
        });
      }
    }

    // Use transaction to ensure atomicity
    const result = await transaction(async (client) => {
      // Create session
      const sessionQuery = `
        INSERT INTO coach_sessions (
          team_id,
          training_date,
          template_name,
          notes,
          sport,
          team_name
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, training_date, recorded_at
      `;
      const sessionResult = await client.query(sessionQuery, [
        teamId,
        trainingDate,
        templateName || null,
        notes || null,
        team.sport,
        team.name
      ]);
      const session = sessionResult.rows[0];

      // Insert drills
      for (let i = 0; i < drills.length; i++) {
        const drill = drills[i];
        const drillQuery = `
          INSERT INTO session_drills (
            session_id,
            drill_id,
            name,
            duration,
            notes,
            position
          )
          VALUES ($1, $2, $3, $4, $5, $6)
        `;
        await client.query(drillQuery, [
          session.id,
          drill.drillId || `custom-${i}`,
          drill.name,
          drill.duration,
          drill.notes || null,
          i
        ]);
      }

      // Record attendance
      for (const youthCode of attendees) {
        const attendanceQuery = `
          INSERT INTO session_attendance (session_id, youth_code)
          VALUES ($1, $2)
        `;
        await client.query(attendanceQuery, [session.id, youthCode.toUpperCase()]);
      }

      return session;
    });

    res.status(201).json({
      session: {
        id: result.id,
        teamId,
        teamName: team.name,
        sport: team.sport,
        trainingDate: result.training_date,
        recordedAt: result.recorded_at,
        templateName: templateName || null,
        notes: notes || null,
        drillCount: drills.length,
        totalDuration: drills.reduce((sum, d) => sum + d.duration, 0),
        attendeeCount: attendees.length
      },
      message: 'Session logged successfully'
    });

  } catch (error) {
    console.error('Create session error:', error);
    res.status(500).json({ error: 'Failed to create session' });
  }
});

/**
 * GET /api/sessions/team/:teamId
 * Get all sessions for a team
 */
router.get('/team/:teamId', authenticateToken, async (req, res) => {
  try {
    const { teamId } = req.params;
    const { userId, role } = req.user;

    // Verify access - coach owns team or admin
    if (role === 'coach') {
      const ownerQuery = `
        SELECT 1 FROM teams WHERE id = $1 AND coach_user_id = $2
      `;
      const ownerResult = await query(ownerQuery, [teamId, userId]);
      if (ownerResult.rows.length === 0) {
        return res.status(403).json({ error: 'Unauthorized to view this team\'s sessions' });
      }
    } else if (role !== 'admin') {
      return res.status(403).json({ error: 'Only coaches and admins can view team sessions' });
    }

    const sessionsQuery = `
      SELECT
        cs.id,
        cs.training_date,
        cs.recorded_at,
        cs.template_name,
        cs.notes,
        cs.sport,
        cs.team_name,
        COUNT(DISTINCT sa.youth_code) as attendee_count,
        COUNT(DISTINCT sd.id) as drill_count,
        COALESCE(SUM(sd.duration), 0) as total_duration,
        ARRAY_AGG(DISTINCT sa.youth_code) as attendees
      FROM coach_sessions cs
      LEFT JOIN session_attendance sa ON sa.session_id = cs.id
      LEFT JOIN session_drills sd ON sd.session_id = cs.id
      WHERE cs.team_id = $1
      GROUP BY cs.id, cs.training_date, cs.recorded_at, cs.template_name, cs.notes, cs.sport, cs.team_name
      ORDER BY cs.training_date DESC
    `;
    const result = await query(sessionsQuery, [teamId]);

    res.json({
      sessions: result.rows.map(row => ({
        id: row.id,
        trainingDate: row.training_date,
        recordedAt: row.recorded_at,
        templateName: row.template_name,
        notes: row.notes,
        sport: row.sport,
        teamName: row.team_name,
        attendeeCount: parseInt(row.attendee_count),
        drillCount: parseInt(row.drill_count),
        totalDuration: parseInt(row.total_duration),
        attendees: row.attendees || []
      }))
    });

  } catch (error) {
    console.error('Get team sessions error:', error);
    res.status(500).json({ error: 'Failed to get team sessions' });
  }
});

/**
 * GET /api/sessions/:sessionId
 * Get detailed session information including drills
 */
router.get('/:sessionId', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { userId, role } = req.user;

    // Get session details
    const sessionQuery = `
      SELECT
        cs.id,
        cs.team_id,
        cs.training_date,
        cs.recorded_at,
        cs.template_name,
        cs.notes,
        cs.sport,
        cs.team_name,
        t.coach_user_id
      FROM coach_sessions cs
      JOIN teams t ON t.id = cs.team_id
      WHERE cs.id = $1
    `;
    const sessionResult = await query(sessionQuery, [sessionId]);

    if (sessionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const session = sessionResult.rows[0];

    // Verify access
    if (role === 'coach' && session.coach_user_id !== userId) {
      return res.status(403).json({ error: 'Unauthorized to view this session' });
    } else if (role === 'parent') {
      // Parents can only see sessions their children attended
      const parentAccessQuery = `
        SELECT 1
        FROM session_attendance sa
        JOIN youths y ON y.code = sa.youth_code
        WHERE sa.session_id = $1 AND y.parent_user_id = $2
        LIMIT 1
      `;
      const parentAccess = await query(parentAccessQuery, [sessionId, userId]);
      if (parentAccess.rows.length === 0) {
        return res.status(403).json({ error: 'Unauthorized to view this session' });
      }
    }

    // Get drills
    const drillsQuery = `
      SELECT
        drill_id,
        name,
        duration,
        notes,
        position
      FROM session_drills
      WHERE session_id = $1
      ORDER BY position
    `;
    const drillsResult = await query(drillsQuery, [sessionId]);

    // Get attendees with names
    const attendeesQuery = `
      SELECT
        y.id,
        y.name,
        y.code
      FROM session_attendance sa
      JOIN youths y ON y.code = sa.youth_code
      WHERE sa.session_id = $1
      ORDER BY y.name
    `;
    const attendeesResult = await query(attendeesQuery, [sessionId]);

    res.json({
      session: {
        id: session.id,
        teamId: session.team_id,
        teamName: session.team_name,
        sport: session.sport,
        trainingDate: session.training_date,
        recordedAt: session.recorded_at,
        templateName: session.template_name,
        notes: session.notes
      },
      drills: drillsResult.rows.map(drill => ({
        drillId: drill.drill_id,
        name: drill.name,
        duration: drill.duration,
        notes: drill.notes,
        position: drill.position
      })),
      attendees: attendeesResult.rows.map(attendee => ({
        id: attendee.id,
        name: attendee.name,
        code: attendee.code
      })),
      statistics: {
        drillCount: drillsResult.rows.length,
        totalDuration: drillsResult.rows.reduce((sum, d) => sum + d.duration, 0),
        attendeeCount: attendeesResult.rows.length
      }
    });

  } catch (error) {
    console.error('Get session error:', error);
    res.status(500).json({ error: 'Failed to get session details' });
  }
});

/**
 * PUT /api/sessions/:sessionId
 * Update session details (not drills or attendance - those require delete/recreate)
 *
 * Body: {
 *   trainingDate?: ISO date string,
 *   notes?: string
 * }
 */
router.put('/:sessionId', authenticateToken, requireRole('coach'), async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { trainingDate, notes } = req.body;
    const { userId } = req.user;

    // Verify coach owns the session's team
    const ownerQuery = `
      SELECT 1
      FROM coach_sessions cs
      JOIN teams t ON t.id = cs.team_id
      WHERE cs.id = $1 AND t.coach_user_id = $2
    `;
    const ownerResult = await query(ownerQuery, [sessionId, userId]);

    if (ownerResult.rows.length === 0) {
      return res.status(403).json({ error: 'You do not have permission to update this session' });
    }

    // Build update query
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (trainingDate) {
      updates.push(`training_date = $${paramCount++}`);
      values.push(trainingDate);
    }

    if (notes !== undefined) {
      updates.push(`notes = $${paramCount++}`);
      values.push(notes);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(sessionId);

    const updateQuery = `
      UPDATE coach_sessions
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, training_date, notes
    `;
    const result = await query(updateQuery, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const session = result.rows[0];

    res.json({
      session: {
        id: session.id,
        trainingDate: session.training_date,
        notes: session.notes
      }
    });

  } catch (error) {
    console.error('Update session error:', error);
    res.status(500).json({ error: 'Failed to update session' });
  }
});

/**
 * DELETE /api/sessions/:sessionId
 * Delete a session and all associated data
 */
router.delete('/:sessionId', authenticateToken, requireRole('coach'), async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { userId } = req.user;

    // Verify coach owns the session's team
    const ownerQuery = `
      SELECT cs.template_name, cs.training_date
      FROM coach_sessions cs
      JOIN teams t ON t.id = cs.team_id
      WHERE cs.id = $1 AND t.coach_user_id = $2
    `;
    const ownerResult = await query(ownerQuery, [sessionId, userId]);

    if (ownerResult.rows.length === 0) {
      return res.status(403).json({ error: 'You do not have permission to delete this session' });
    }

    // Delete session (cascades to drills and attendance)
    const deleteQuery = `
      DELETE FROM coach_sessions
      WHERE id = $1
    `;
    await query(deleteQuery, [sessionId]);

    res.json({
      message: 'Session deleted successfully'
    });

  } catch (error) {
    console.error('Delete session error:', error);
    res.status(500).json({ error: 'Failed to delete session' });
  }
});

/**
 * GET /api/sessions/coach/recent
 * Get recent sessions across all teams for the authenticated coach
 */
router.get('/coach/recent', authenticateToken, requireRole('coach'), async (req, res) => {
  try {
    const { userId } = req.user;
    const { limit = 10 } = req.query;

    const sessionsQuery = `
      SELECT
        cs.id,
        cs.training_date,
        cs.template_name,
        cs.sport,
        cs.team_name,
        t.id as team_id,
        COUNT(DISTINCT sa.youth_code) as attendee_count,
        COALESCE(SUM(sd.duration), 0) as total_duration
      FROM coach_sessions cs
      JOIN teams t ON t.id = cs.team_id
      LEFT JOIN session_attendance sa ON sa.session_id = cs.id
      LEFT JOIN session_drills sd ON sd.session_id = cs.id
      WHERE t.coach_user_id = $1
      GROUP BY cs.id, cs.training_date, cs.template_name, cs.sport, cs.team_name, t.id
      ORDER BY cs.training_date DESC
      LIMIT $2
    `;
    const result = await query(sessionsQuery, [userId, parseInt(limit)]);

    res.json({
      sessions: result.rows.map(row => ({
        id: row.id,
        trainingDate: row.training_date,
        templateName: row.template_name,
        sport: row.sport,
        teamName: row.team_name,
        teamId: row.team_id,
        attendeeCount: parseInt(row.attendee_count),
        totalDuration: parseInt(row.total_duration)
      }))
    });

  } catch (error) {
    console.error('Get recent sessions error:', error);
    res.status(500).json({ error: 'Failed to get recent sessions' });
  }
});

export default router;