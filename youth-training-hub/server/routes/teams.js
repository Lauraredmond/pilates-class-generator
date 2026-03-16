// Team management routes for coaches
import express from 'express';
import { query, transaction } from '../db/index.js';
import { authenticateToken, requireRole, verifyTeamOwnership } from '../middleware/auth.js';

const router = express.Router();

/**
 * POST /api/teams
 * Create a new team (coach only)
 *
 * Body: {
 *   name: string,
 *   sport: 'rugby' | 'soccer' | 'gaa',
 *   level?: string
 * }
 */
router.post('/', authenticateToken, requireRole('coach'), async (req, res) => {
  try {
    const { name, sport, level } = req.body;
    const { userId } = req.user;

    // Validate input
    if (!name || !sport) {
      return res.status(400).json({ error: 'Name and sport are required' });
    }

    if (!['rugby', 'soccer', 'gaa'].includes(sport)) {
      return res.status(400).json({ error: 'Sport must be rugby, soccer, or gaa' });
    }

    // Create team
    const insertQuery = `
      INSERT INTO teams (name, sport, level, coach_user_id)
      VALUES ($1, $2, $3, $4)
      RETURNING id, name, sport, level
    `;
    const result = await query(insertQuery, [name, sport, level || null, userId]);
    const team = result.rows[0];

    res.status(201).json({
      team: {
        id: team.id,
        name: team.name,
        sport: team.sport,
        level: team.level,
        playerCount: 0
      }
    });

  } catch (error) {
    console.error('Create team error:', error);
    res.status(500).json({ error: 'Failed to create team' });
  }
});

/**
 * GET /api/teams
 * Get all teams for authenticated coach
 */
router.get('/', authenticateToken, requireRole('coach'), async (req, res) => {
  try {
    const { userId } = req.user;

    const teamsQuery = `
      SELECT
        t.id,
        t.name,
        t.sport,
        t.level,
        t.created_at,
        COUNT(DISTINCT tyl.youth_code) as player_count,
        COUNT(DISTINCT cs.id) as session_count
      FROM teams t
      LEFT JOIN team_youth_links tyl ON tyl.team_id = t.id
      LEFT JOIN coach_sessions cs ON cs.team_id = t.id
      WHERE t.coach_user_id = $1
      GROUP BY t.id, t.name, t.sport, t.level, t.created_at
      ORDER BY t.created_at DESC
    `;
    const result = await query(teamsQuery, [userId]);

    res.json({
      teams: result.rows.map(row => ({
        id: row.id,
        name: row.name,
        sport: row.sport,
        level: row.level,
        createdAt: row.created_at,
        playerCount: parseInt(row.player_count),
        sessionCount: parseInt(row.session_count)
      }))
    });

  } catch (error) {
    console.error('Get teams error:', error);
    res.status(500).json({ error: 'Failed to get teams' });
  }
});

/**
 * GET /api/teams/:teamId
 * Get team details with roster
 */
router.get('/:teamId', authenticateToken, verifyTeamOwnership, async (req, res) => {
  try {
    const { teamId } = req.params;

    // Get team details
    const teamQuery = `
      SELECT
        t.id,
        t.name,
        t.sport,
        t.level,
        t.created_at,
        u.name as coach_name
      FROM teams t
      JOIN users u ON u.id = t.coach_user_id
      WHERE t.id = $1
    `;
    const teamResult = await query(teamQuery, [teamId]);

    if (teamResult.rows.length === 0) {
      return res.status(404).json({ error: 'Team not found' });
    }

    const team = teamResult.rows[0];

    // Get roster (linked youth players)
    const rosterQuery = `
      SELECT
        y.id,
        y.name,
        y.code,
        tyl.linked_at,
        COUNT(DISTINCT sa.session_id) as sessions_attended
      FROM team_youth_links tyl
      JOIN youths y ON y.code = tyl.youth_code
      LEFT JOIN session_attendance sa ON sa.youth_code = y.code
      LEFT JOIN coach_sessions cs ON cs.id = sa.session_id AND cs.team_id = $1
      WHERE tyl.team_id = $1
      GROUP BY y.id, y.name, y.code, tyl.linked_at
      ORDER BY y.name
    `;
    const rosterResult = await query(rosterQuery, [teamId]);

    // Get recent sessions
    const sessionsQuery = `
      SELECT
        cs.id,
        cs.training_date,
        cs.template_name,
        COUNT(DISTINCT sa.youth_code) as attendee_count,
        COALESCE(
          (SELECT SUM(duration) FROM session_drills WHERE session_id = cs.id),
          0
        ) as total_duration
      FROM coach_sessions cs
      LEFT JOIN session_attendance sa ON sa.session_id = cs.id
      WHERE cs.team_id = $1
      GROUP BY cs.id, cs.training_date, cs.template_name
      ORDER BY cs.training_date DESC
      LIMIT 5
    `;
    const sessionsResult = await query(sessionsQuery, [teamId]);

    res.json({
      team: {
        id: team.id,
        name: team.name,
        sport: team.sport,
        level: team.level,
        coachName: team.coach_name,
        createdAt: team.created_at
      },
      roster: rosterResult.rows.map(player => ({
        id: player.id,
        name: player.name,
        code: player.code,
        linkedAt: player.linked_at,
        sessionsAttended: parseInt(player.sessions_attended)
      })),
      recentSessions: sessionsResult.rows.map(session => ({
        id: session.id,
        trainingDate: session.training_date,
        templateName: session.template_name,
        attendeeCount: parseInt(session.attendee_count),
        totalDuration: parseInt(session.total_duration)
      }))
    });

  } catch (error) {
    console.error('Get team error:', error);
    res.status(500).json({ error: 'Failed to get team details' });
  }
});

/**
 * POST /api/teams/:teamId/link
 * Link a youth to team using their code
 * Rate-limited to prevent code guessing
 *
 * Body: {
 *   youthCode: string
 * }
 */
router.post('/:teamId/link', authenticateToken, verifyTeamOwnership, async (req, res) => {
  try {
    const { teamId } = req.params;
    const { youthCode } = req.body;
    const { userId } = req.user;

    // Validate input
    if (!youthCode || youthCode.length !== 6) {
      return res.status(400).json({ error: 'Valid 6-character youth code required' });
    }

    // Log the attempt
    const attemptQuery = `
      INSERT INTO code_attempts (user_id, attempted_code, success)
      VALUES ($1, $2, false)
    `;
    await query(attemptQuery, [userId, youthCode.toUpperCase()]);

    // Check if youth exists
    const youthQuery = `
      SELECT id, name, code
      FROM youths
      WHERE UPPER(code) = UPPER($1)
    `;
    const youthResult = await query(youthQuery, [youthCode]);

    if (youthResult.rows.length === 0) {
      return res.status(404).json({ error: 'Invalid youth code' });
    }

    const youth = youthResult.rows[0];

    // Check if already linked
    const existingLinkQuery = `
      SELECT 1
      FROM team_youth_links
      WHERE team_id = $1 AND youth_code = $2
    `;
    const existingLink = await query(existingLinkQuery, [teamId, youth.code]);

    if (existingLink.rows.length > 0) {
      return res.status(409).json({ error: 'Youth already linked to this team' });
    }

    // Create link
    const linkQuery = `
      INSERT INTO team_youth_links (team_id, youth_code)
      VALUES ($1, $2)
      RETURNING linked_at
    `;
    const linkResult = await query(linkQuery, [teamId, youth.code]);

    // Update successful attempt
    const successQuery = `
      UPDATE code_attempts
      SET success = true
      WHERE user_id = $1
        AND attempted_code = $2
        AND success = false
      ORDER BY attempted_at DESC
      LIMIT 1
    `;
    await query(successQuery, [userId, youthCode.toUpperCase()]);

    res.status(201).json({
      youth: {
        id: youth.id,
        name: youth.name,
        code: youth.code,
        linkedAt: linkResult.rows[0].linked_at
      },
      message: `${youth.name} successfully linked to team`
    });

  } catch (error) {
    console.error('Link youth error:', error);
    res.status(500).json({ error: 'Failed to link youth to team' });
  }
});

/**
 * DELETE /api/teams/:teamId/unlink/:youthCode
 * Remove a youth from team roster
 */
router.delete('/:teamId/unlink/:youthCode', authenticateToken, verifyTeamOwnership, async (req, res) => {
  try {
    const { teamId, youthCode } = req.params;

    // Remove link
    const deleteQuery = `
      DELETE FROM team_youth_links
      WHERE team_id = $1 AND UPPER(youth_code) = UPPER($2)
      RETURNING youth_code
    `;
    const result = await query(deleteQuery, [teamId, youthCode]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Youth not linked to this team' });
    }

    // Get youth name for response
    const youthQuery = `
      SELECT name FROM youths WHERE UPPER(code) = UPPER($1)
    `;
    const youthResult = await query(youthQuery, [youthCode]);

    res.json({
      message: `${youthResult.rows[0]?.name || 'Youth'} removed from team roster`
    });

  } catch (error) {
    console.error('Unlink youth error:', error);
    res.status(500).json({ error: 'Failed to unlink youth from team' });
  }
});

/**
 * PUT /api/teams/:teamId
 * Update team details
 *
 * Body: {
 *   name?: string,
 *   level?: string
 * }
 */
router.put('/:teamId', authenticateToken, verifyTeamOwnership, async (req, res) => {
  try {
    const { teamId } = req.params;
    const { name, level } = req.body;

    // Build update query dynamically
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (name) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }

    if (level !== undefined) {
      updates.push(`level = $${paramCount++}`);
      values.push(level);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(teamId);

    const updateQuery = `
      UPDATE teams
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, name, sport, level
    `;
    const result = await query(updateQuery, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Team not found' });
    }

    const team = result.rows[0];

    res.json({
      team: {
        id: team.id,
        name: team.name,
        sport: team.sport,
        level: team.level
      }
    });

  } catch (error) {
    console.error('Update team error:', error);
    res.status(500).json({ error: 'Failed to update team' });
  }
});

/**
 * DELETE /api/teams/:teamId
 * Delete team and all associated sessions
 */
router.delete('/:teamId', authenticateToken, verifyTeamOwnership, async (req, res) => {
  try {
    const { teamId } = req.params;

    // Delete team (cascades to links and sessions)
    const deleteQuery = `
      DELETE FROM teams
      WHERE id = $1
      RETURNING name
    `;
    const result = await query(deleteQuery, [teamId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Team not found' });
    }

    res.json({
      message: `Team ${result.rows[0].name} and all associated data deleted successfully`
    });

  } catch (error) {
    console.error('Delete team error:', error);
    res.status(500).json({ error: 'Failed to delete team' });
  }
});

export default router;