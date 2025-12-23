# Load Testing with k6

This directory contains k6 load test scripts for the Pilates Class Generator API.

## Quick Start

### Run Smoke Test (5 users, 8 minutes, database mode)
```bash
k6 run load-tests/smoke-test.js
```

### Run Against Different Environment
```bash
# Test dev environment
k6 run --env API_BASE_URL=https://pilates-dev-i0jb.onrender.com load-tests/smoke-test.js

# Test production
k6 run --env API_BASE_URL=https://pilates-class-generator-api3.onrender.com load-tests/smoke-test.js

# Test local dev server
k6 run --env API_BASE_URL=http://localhost:8000 load-tests/smoke-test.js
```

## Test Scripts

### `smoke-test.js` - Basic Functionality Validation
- **Purpose**: Verify basic API functionality under minimal load
- **Duration**: 8 minutes
- **Virtual Users**: 5
- **Cost**: $0 (database mode only - no AI)
- **What it tests**:
  - API availability
  - Response times < 5s
  - Error rate < 10%
  - Complete 6-section class structure
  - All required fields present

## Interpreting Results

### ✅ Good Results
```
✓ status is 200
✓ has data
✓ has movements
...
http_req_duration..............: avg=1.2s   p(95)=2.5s   max=4.1s
http_req_failed................: 0.00%
```

**What this means:**
- All requests succeeded
- 95% of requests completed in under 2.5s
- Backend is healthy and ready for beta testing

### ⚠️ Warning Signs
```
✓ status is 200..................: 92%
✗ response time < 5s.............: 85%
http_req_duration..............: avg=4.5s   p(95)=8.2s   max=15s
http_req_failed................: 8.00%
```

**What this means:**
- 8% of requests failed (above 10% threshold)
- Response times are slow (p95 > 5s)
- Backend may be overloaded or underprovisioned

### ❌ Critical Issues
```
✗ status is 200..................: 45%
http_req_failed................: 55.00%
```

**What this means:**
- More than half of requests failed
- Backend is likely down or severely overloaded
- Do NOT proceed with beta testing

## Common Bottlenecks to Watch For

### 1. OpenAI Rate Limits
- **Symptom**: 429 errors, "Rate limit exceeded"
- **Fix**: Reduce concurrent users or implement request queuing
- **Note**: Smoke test uses database mode to avoid this

### 2. Supabase Connection Pool
- **Symptom**: "Too many connections" errors
- **Fix**: Upgrade Supabase plan or optimize queries

### 3. Render RAM Limit (512MB)
- **Symptom**: 503 errors, slow response times
- **Fix**: Upgrade Render plan or optimize memory usage

### 4. Database Query Performance
- **Symptom**: Slow response times (>3s), CPU usage spikes
- **Fix**: Add database indexes, optimize queries

## Next Steps After Smoke Test

If smoke test passes:
1. ✅ Run stress test (25 users - beta tester target)
2. ✅ Run breaking point test (50-100 users)
3. ✅ Run endurance test (10 users, 1 hour)

## Cost Estimation

**Smoke Test (Database Mode):**
- OpenAI API: $0.00 (no AI calls)
- Render: Included in free tier
- Supabase: Included in free tier
- **Total**: $0.00

**If Testing AI Mode:**
- 5 users × 8 minutes × ~1 class/2 minutes = ~20 classes
- 20 classes × $0.25/class = ~$5.00
- **Use database mode for smoke tests to avoid costs**

## Troubleshooting

### Test fails with "connection refused"
```bash
# Check if backend is running
curl https://pilates-dev-i0jb.onrender.com/health
```

### All requests timeout
- Backend may be cold-starting on Render (first request can take 30-60s)
- Wait a minute and try again

### High error rate on first run
- Database connection pool may need warmup
- Run test again - second run should be better

## Advanced Usage

### Run with custom thresholds
```bash
k6 run --threshold http_req_duration=p(95)<3000 load-tests/smoke-test.js
```

### Export results to JSON
```bash
k6 run --out json=results.json load-tests/smoke-test.js
```

### Run with specific number of VUs
```bash
k6 run --vus 10 --duration 5m load-tests/smoke-test.js
```

## References

- [k6 Documentation](https://k6.io/docs/)
- [k6 Metrics Reference](https://k6.io/docs/using-k6/metrics/)
- [Performance Testing Best Practices](https://k6.io/docs/testing-guides/test-types/)
