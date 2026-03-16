// Timeline Aggregation Tests - CRITICAL TESTS (MUST EXIST)
// Tests the most important query in the system: combining coach sessions and parent activities

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// Test database connection
const testPool = new Pool({
  host: process.env.TEST_DB_HOST || 'localhost',
  port: process.env.TEST_DB_PORT || 5432,
  database: process.env.TEST_DB_NAME || 'youth_training_hub_test',
  user: process.env.TEST_DB_USER || 'postgres',
  password: process.env.TEST_DB_PASSWORD,
});

describe('Timeline Aggregation Tests', () => {
  let testUserId, testYouthCode, testTeamId, testSessionId, testActivityId;

  before(async () => {
    // Setup test data
    try {
      // Create test parent user
      const userResult = await testPool.query(`
        INSERT INTO users (email, password_hash, role, name)
        VALUES ('testparent@test.com', 'hash', 'parent', 'Test Parent')
        RETURNING id
      `);
      testUserId = userResult.rows[0].id;

      // Create test youth with code
      const youthResult = await testPool.query(`
        INSERT INTO youths (name, code, parent_user_id)
        VALUES ('Test Youth', 'TEST99', $1)
        RETURNING code
      `, [testUserId]);
      testYouthCode = youthResult.rows[0].code;

      // Create test coach user
      const coachResult = await testPool.query(`
        INSERT INTO users (email, password_hash, role, name)
        VALUES ('testcoach@test.com', 'hash', 'coach', 'Test Coach')
        RETURNING id
      `);
      const coachUserId = coachResult.rows[0].id;

      // Create test team
      const teamResult = await testPool.query(`
        INSERT INTO teams (name, sport, level, coach_user_id)
        VALUES ('Test Team', 'rugby', 'U16', $1)
        RETURNING id
      `, [coachUserId]);
      testTeamId = teamResult.rows[0].id;

      // Link youth to team
      await testPool.query(`
        INSERT INTO team_youth_links (team_id, youth_code)
        VALUES ($1, $2)
      `, [testTeamId, testYouthCode]);

    } catch (error) {
      console.error('Test setup error:', error);
      throw error;
    }
  });

  after(async () => {
    // Cleanup test data
    try {
      await testPool.query('DELETE FROM users WHERE email LIKE \'%@test.com\'');
      await testPool.end();
    } catch (error) {
      console.error('Test cleanup error:', error);
    }
  });

  describe('Timeline Query Aggregation', () => {
    it('should combine coach sessions and parent activities', async () => {
      // Create a coach session
      const sessionDate = new Date('2024-03-15T10:00:00Z');
      const sessionResult = await testPool.query(`
        INSERT INTO coach_sessions (team_id, training_date, template_name, sport, team_name)
        VALUES ($1, $2, 'Test Session', 'rugby', 'Test Team')
        RETURNING id
      `, [testTeamId, sessionDate]);
      testSessionId = sessionResult.rows[0].id;

      // Add drills to session
      await testPool.query(`
        INSERT INTO session_drills (session_id, drill_id, name, duration, position)
        VALUES ($1, 'r-wu-1', 'Warm Up', 10, 1),
               ($1, 'r-ph-1', 'Passing', 15, 2)
      `, [testSessionId]);

      // Mark youth attendance
      await testPool.query(`
        INSERT INTO session_attendance (session_id, youth_code)
        VALUES ($1, $2)
      `, [testSessionId, testYouthCode]);

      // Create a parent activity
      const activityDate = new Date('2024-03-16T14:00:00Z');
      const activityResult = await testPool.query(`
        INSERT INTO parent_activities (youth_code, activity, training_date, duration, parent_user_id)
        VALUES ($1, 'Swimming', $2, 60, $3)
        RETURNING id
      `, [testYouthCode, activityDate, testUserId]);
      testActivityId = activityResult.rows[0].id;

      // Execute the timeline query
      const timelineResult = await testPool.query(`
        SELECT
          source,
          training_date,
          sport,
          label,
          duration_mins
        FROM (
          -- Coach sessions
          SELECT
            'coach' as source,
            cs.training_date,
            cs.sport::VARCHAR as sport,
            cs.team_name as label,
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
            'parent' as source,
            pa.training_date,
            pa.activity as sport,
            pa.activity as label,
            pa.duration as duration_mins
          FROM parent_activities pa
          WHERE pa.youth_code = $1
        ) combined
        ORDER BY training_date DESC
      `, [testYouthCode]);

      // Assertions
      assert.strictEqual(timelineResult.rows.length, 2, 'Should have 2 events');

      // Check parent activity (more recent, should be first)
      const parentEvent = timelineResult.rows[0];
      assert.strictEqual(parentEvent.source, 'parent');
      assert.strictEqual(parentEvent.sport, 'Swimming');
      assert.strictEqual(parentEvent.duration_mins, 60);

      // Check coach session
      const coachEvent = timelineResult.rows[1];
      assert.strictEqual(coachEvent.source, 'coach');
      assert.strictEqual(coachEvent.sport, 'rugby');
      assert.strictEqual(coachEvent.label, 'Test Team');
      assert.strictEqual(coachEvent.duration_mins, 25); // 10 + 15 from drills
    });

    it('should only show sessions where youth attended', async () => {
      // Create another youth not attending
      const otherYouthResult = await testPool.query(`
        INSERT INTO youths (name, code, parent_user_id)
        VALUES ('Other Youth', 'OTHER9', $1)
        RETURNING code
      `, [testUserId]);
      const otherYouthCode = otherYouthResult.rows[0].code;

      // Create a session without the other youth attending
      const sessionResult = await testPool.query(`
        INSERT INTO coach_sessions (team_id, training_date, template_name, sport, team_name)
        VALUES ($1, NOW(), 'Another Session', 'rugby', 'Test Team')
        RETURNING id
      `, [testTeamId]);
      const newSessionId = sessionResult.rows[0].id;

      // Only mark original youth attendance
      await testPool.query(`
        INSERT INTO session_attendance (session_id, youth_code)
        VALUES ($1, $2)
      `, [newSessionId, testYouthCode]);

      // Query for other youth
      const timelineResult = await testPool.query(`
        SELECT * FROM (
          SELECT
            'coach' as source,
            cs.id
          FROM coach_sessions cs
          JOIN session_attendance sa ON sa.session_id = cs.id
          WHERE sa.youth_code = $1
        ) events
      `, [otherYouthCode]);

      // Should have no events for youth who didn't attend
      assert.strictEqual(timelineResult.rows.length, 0, 'Non-attending youth should see no sessions');
    });

    it('should sort by trainingDate, not recordedAt', async () => {
      // Create events with different training and recorded dates
      const oldTrainingDate = new Date('2024-01-01T10:00:00Z');
      const newTrainingDate = new Date('2024-03-20T10:00:00Z');

      // Activity logged today but for old training date
      await testPool.query(`
        INSERT INTO parent_activities (youth_code, activity, training_date, duration, recorded_at, parent_user_id)
        VALUES ($1, 'Old Activity', $2, 30, NOW(), $3)
      `, [testYouthCode, oldTrainingDate, testUserId]);

      // Activity logged yesterday but for recent training date
      await testPool.query(`
        INSERT INTO parent_activities (youth_code, activity, training_date, duration, recorded_at, parent_user_id)
        VALUES ($1, 'Recent Activity', $2, 45, NOW() - INTERVAL '1 day', $3)
      `, [testYouthCode, newTrainingDate, testUserId]);

      // Query timeline sorted by training_date
      const timelineResult = await testPool.query(`
        SELECT
          activity,
          training_date
        FROM parent_activities
        WHERE youth_code = $1
        ORDER BY training_date DESC
      `, [testYouthCode]);

      // Most recent training date should be first regardless of when it was recorded
      assert.strictEqual(timelineResult.rows[0].activity, 'Recent Activity');
      assert.strictEqual(timelineResult.rows[timelineResult.rows.length - 1].activity, 'Old Activity');
    });

    it('should handle weekly filtering correctly', async () => {
      // Create activities across different weeks
      const thisMonday = new Date();
      const day = thisMonday.getDay();
      const diff = thisMonday.getDate() - day + (day === 0 ? -6 : 1);
      thisMonday.setDate(diff);
      thisMonday.setHours(0, 0, 0, 0);

      const thisSunday = new Date(thisMonday);
      thisSunday.setDate(thisSunday.getDate() + 6);
      thisSunday.setHours(23, 59, 59, 999);

      // Activity this week
      const thisWeekDate = new Date(thisMonday);
      thisWeekDate.setDate(thisWeekDate.getDate() + 2); // Wednesday
      await testPool.query(`
        INSERT INTO parent_activities (youth_code, activity, training_date, duration, parent_user_id)
        VALUES ($1, 'This Week Activity', $2, 30, $3)
      `, [testYouthCode, thisWeekDate, testUserId]);

      // Activity last week
      const lastWeekDate = new Date(thisMonday);
      lastWeekDate.setDate(lastWeekDate.getDate() - 5);
      await testPool.query(`
        INSERT INTO parent_activities (youth_code, activity, training_date, duration, parent_user_id)
        VALUES ($1, 'Last Week Activity', $2, 30, $3)
      `, [testYouthCode, lastWeekDate, testUserId]);

      // Query for this week only
      const weekResult = await testPool.query(`
        SELECT activity
        FROM parent_activities
        WHERE youth_code = $1
          AND training_date >= $2
          AND training_date < $3
      `, [testYouthCode, thisMonday, thisSunday]);

      // Should only have this week's activity
      const thisWeekActivities = weekResult.rows.filter(r => r.activity === 'This Week Activity');
      const lastWeekActivities = weekResult.rows.filter(r => r.activity === 'Last Week Activity');

      assert.strictEqual(thisWeekActivities.length, 1, 'Should have this week activity');
      assert.strictEqual(lastWeekActivities.length, 0, 'Should not have last week activity');
    });

    it('should calculate duration correctly from drills', async () => {
      // Create session with multiple drills
      const sessionResult = await testPool.query(`
        INSERT INTO coach_sessions (team_id, training_date, template_name, sport, team_name)
        VALUES ($1, NOW(), 'Duration Test', 'soccer', 'Test Team')
        RETURNING id
      `, [testTeamId]);
      const sessionId = sessionResult.rows[0].id;

      // Add drills with different durations
      await testPool.query(`
        INSERT INTO session_drills (session_id, drill_id, name, duration, position)
        VALUES ($1, 's-wu-1', 'Warm Up', 10, 1),
               ($1, 's-pp-1', 'Passing', 15, 2),
               ($1, 's-gs-1', 'Game', 20, 3)
      `, [sessionId]);

      // Mark attendance
      await testPool.query(`
        INSERT INTO session_attendance (session_id, youth_code)
        VALUES ($1, $2)
      `, [sessionId, testYouthCode]);

      // Query to get duration
      const durationResult = await testPool.query(`
        SELECT
          COALESCE(
            (SELECT SUM(duration) FROM session_drills WHERE session_id = $1),
            0
          ) as total_duration
      `, [sessionId]);

      assert.strictEqual(durationResult.rows[0].total_duration, 45, 'Should sum all drill durations');
    });
  });

  describe('Timeline Statistics', () => {
    it('should calculate all-time statistics correctly', async () => {
      // Query for all-time stats
      const statsResult = await testPool.query(`
        WITH all_events AS (
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

          SELECT
            pa.activity as sport,
            pa.duration as duration_mins
          FROM parent_activities pa
          WHERE pa.youth_code = $1
        )
        SELECT
          COUNT(*) as total_sessions,
          SUM(duration_mins) as total_minutes,
          COUNT(DISTINCT sport) as sport_count
        FROM all_events
      `, [testYouthCode]);

      const stats = statsResult.rows[0];
      assert(stats.total_sessions > 0, 'Should have sessions');
      assert(stats.total_minutes > 0, 'Should have total minutes');
      assert(stats.sport_count >= 2, 'Should have at least 2 sports (rugby and swimming)');
    });
  });
});

console.log('Timeline tests defined. Run with: npm test');