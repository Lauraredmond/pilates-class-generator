// Timeline Route - MOST CRITICAL ENDPOINT
// Aggregates all training events for a youth from both coach sessions and parent activities

import express from 'express';
import { query } from '../db/index.js';
import { authenticateToken, authorizeTimelineAccess } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/timeline/:youthCode
 * Get complete timeline for a youth
 * Combines coach sessions (where youth attended) and parent activities
 *
 * Query params:
 * - weekStart: ISO date for start of week (optional, for weekly view)
 * - weekEnd: ISO date for end of week (optional, for weekly view)
 */
router.get('/:youthCode', authenticateToken, authorizeTimelineAccess, async (req, res) => {
  try {
    const { youthCode } = req.params;
    const { weekStart, weekEnd } = req.query;

    // Build the base query for timeline aggregation
    let timelineQuery = `
      -- Coach sessions where youth attended
      SELECT
        'coach' as source,
        cs.id,
        cs.training_date,
        cs.sport::VARCHAR as sport,
        cs.team_name as label,
        cs.template_name as detail,
        COALESCE(
          (SELECT SUM(duration) FROM session_drills WHERE session_id = cs.id),
          0
        ) as duration_mins,
        cs.recorded_at,
        COALESCE(
          (SELECT JSON_AGG(
            JSON_BUILD_OBJECT(
              'id', sd.drill_id,
              'name', sd.name,
              'duration', sd.duration,
              'notes', sd.notes
            ) ORDER BY sd.position
          ) FROM session_drills sd WHERE sd.session_id = cs.id),
          '[]'::json
        ) as drills
      FROM coach_sessions cs
      JOIN session_attendance sa ON sa.session_id = cs.id
      WHERE sa.youth_code = $1
    `;

    const queryParams = [youthCode.toUpperCase()];

    // Add date filtering if week bounds provided
    if (weekStart && weekEnd) {
      timelineQuery += ` AND cs.training_date >= $${queryParams.length + 1} AND cs.training_date < $${queryParams.length + 2}`;
      queryParams.push(weekStart, weekEnd);
    }

    timelineQuery += `
      UNION ALL

      -- Parent activities for this youth
      SELECT
        'parent' as source,
        pa.id,
        pa.training_date,
        pa.activity as sport,
        pa.activity as label,
        NULL as detail,
        pa.duration as duration_mins,
        pa.recorded_at,
        NULL as drills
      FROM parent_activities pa
      WHERE pa.youth_code = $1
    `;

    // Add date filtering for parent activities if week bounds provided
    if (weekStart && weekEnd) {
      timelineQuery += ` AND pa.training_date >= $${queryParams.indexOf(weekStart) + 1} AND pa.training_date < $${queryParams.indexOf(weekEnd) + 1}`;
    }

    // Sort by training date (when it happened, not when logged)
    timelineQuery += ` ORDER BY training_date DESC`;

    // Execute the timeline query
    const result = await query(timelineQuery, queryParams);

    // Get youth details
    const youthQuery = `
      SELECT id, name, code
      FROM youths
      WHERE UPPER(code) = UPPER($1)
    `;
    const youthResult = await query(youthQuery, [youthCode]);

    if (youthResult.rows.length === 0) {
      return res.status(404).json({ error: 'Youth not found' });
    }

    const youth = youthResult.rows[0];

    // Calculate statistics
    const events = result.rows;
    const totalSessions = events.length;
    const totalMinutes = events.reduce((sum, event) => sum + (event.duration_mins || 0), 0);
    const totalHours = Math.round((totalMinutes / 60) * 10) / 10;
    const uniqueSports = [...new Set(events.map(e => e.sport))];

    // Format response
    res.json({
      youth: {
        id: youth.id,
        name: youth.name,
        code: youth.code
      },
      timeline: events.map(event => ({
        id: event.id,
        source: event.source,
        trainingDate: event.training_date,
        sport: event.sport,
        label: event.label,
        detail: event.detail,
        durationMins: event.duration_mins,
        recordedAt: event.recorded_at,
        drills: event.drills || null
      })),
      statistics: {
        totalSessions,
        totalHours,
        totalMinutes,
        sports: uniqueSports,
        sportCount: uniqueSports.length
      }
    });

  } catch (error) {
    console.error('Timeline fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch timeline' });
  }
});

/**
 * GET /api/timeline/:youthCode/week
 * Get timeline for a specific week with daily aggregation
 *
 * Query params:
 * - weekOffset: Number of weeks from current week (0 = this week, -1 = last week, etc.)
 */
router.get('/:youthCode/week', authenticateToken, authorizeTimelineAccess, async (req, res) => {
  try {
    const { youthCode } = req.params;
    const { weekOffset = 0 } = req.query;

    // Calculate week boundaries
    const today = new Date();
    const monday = new Date(today);
    const day = monday.getDay();
    const diff = monday.getDate() - day + (day === 0 ? -6 : 1);
    monday.setDate(diff);
    monday.setHours(0, 0, 0, 0);

    // Apply week offset
    monday.setDate(monday.getDate() + (weekOffset * 7));
    const sunday = new Date(monday);
    sunday.setDate(sunday.getDate() + 7);

    // Get events for the week
    const weekQuery = `
      WITH week_events AS (
        -- Coach sessions
        SELECT
          'coach' as source,
          cs.id,
          cs.training_date,
          cs.sport::VARCHAR as sport,
          cs.team_name as label,
          COALESCE(
            (SELECT SUM(duration) FROM session_drills WHERE session_id = cs.id),
            0
          ) as duration_mins,
          DATE(cs.training_date) as day_date
        FROM coach_sessions cs
        JOIN session_attendance sa ON sa.session_id = cs.id
        WHERE sa.youth_code = $1
          AND cs.training_date >= $2
          AND cs.training_date < $3

        UNION ALL

        -- Parent activities
        SELECT
          'parent' as source,
          pa.id,
          pa.training_date,
          pa.activity as sport,
          pa.activity as label,
          pa.duration as duration_mins,
          DATE(pa.training_date) as day_date
        FROM parent_activities pa
        WHERE pa.youth_code = $1
          AND pa.training_date >= $2
          AND pa.training_date < $3
      )
      SELECT
        day_date,
        JSON_AGG(
          JSON_BUILD_OBJECT(
            'id', id,
            'source', source,
            'trainingDate', training_date,
            'sport', sport,
            'label', label,
            'durationMins', duration_mins
          ) ORDER BY training_date
        ) as events,
        COUNT(*) as event_count,
        SUM(duration_mins) as total_mins
      FROM week_events
      GROUP BY day_date
      ORDER BY day_date;
    `;

    const result = await query(weekQuery, [
      youthCode.toUpperCase(),
      monday.toISOString(),
      sunday.toISOString()
    ]);

    // Create a map of all 7 days
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];

      const dayData = result.rows.find(row =>
        row.day_date.toISOString().split('T')[0] === dateStr
      );

      days.push({
        date: dateStr,
        dayName: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
        events: dayData?.events || [],
        eventCount: dayData?.event_count || 0,
        totalMins: dayData?.total_mins || 0,
        isToday: dateStr === new Date().toISOString().split('T')[0]
      });
    }

    // Week statistics
    const weekStats = {
      totalSessions: result.rows.reduce((sum, row) => sum + row.event_count, 0),
      totalMinutes: result.rows.reduce((sum, row) => sum + row.total_mins, 0),
      totalHours: Math.round((result.rows.reduce((sum, row) => sum + row.total_mins, 0) / 60) * 10) / 10,
      sports: [...new Set(result.rows.flatMap(row => row.events?.map(e => e.sport) || []))],
      weekStart: monday.toISOString().split('T')[0],
      weekEnd: sunday.toISOString().split('T')[0],
      weekOffset: parseInt(weekOffset)
    };

    res.json({
      youthCode,
      days,
      weekStats
    });

  } catch (error) {
    console.error('Week timeline fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch week timeline' });
  }
});

/**
 * GET /api/timeline/:youthCode/stats
 * Get all-time statistics for a youth
 */
router.get('/:youthCode/stats', authenticateToken, authorizeTimelineAccess, async (req, res) => {
  try {
    const { youthCode } = req.params;

    const statsQuery = `
      WITH all_events AS (
        -- Coach sessions
        SELECT
          cs.sport::VARCHAR as sport,
          COALESCE(
            (SELECT SUM(duration) FROM session_drills WHERE session_id = cs.id),
            0
          ) as duration_mins
        FROM coach_sessions cs
        JOIN session_attendance sa ON sa.session_id = cs.id
        WHERE sa.youth_code = $1

        UNION ALL

        -- Parent activities
        SELECT
          pa.activity as sport,
          pa.duration as duration_mins
        FROM parent_activities pa
        WHERE pa.youth_code = $1
      )
      SELECT
        sport,
        COUNT(*) as session_count,
        SUM(duration_mins) as total_mins,
        ROUND(SUM(duration_mins)::numeric / 60, 1) as total_hours
      FROM all_events
      GROUP BY sport
      ORDER BY session_count DESC;
    `;

    const result = await query(statsQuery, [youthCode.toUpperCase()]);

    const totalSessions = result.rows.reduce((sum, row) => sum + parseInt(row.session_count), 0);
    const totalMinutes = result.rows.reduce((sum, row) => sum + parseInt(row.total_mins), 0);
    const totalHours = Math.round((totalMinutes / 60) * 10) / 10;

    res.json({
      youthCode,
      allTimeStats: {
        totalSessions,
        totalMinutes,
        totalHours,
        sportCount: result.rows.length,
        sportBreakdown: result.rows.map(row => ({
          sport: row.sport,
          sessionCount: parseInt(row.session_count),
          totalMins: parseInt(row.total_mins),
          totalHours: parseFloat(row.total_hours)
        }))
      }
    });

  } catch (error) {
    console.error('Stats fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

export default router;