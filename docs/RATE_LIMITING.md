# Rate Limiting Setup Guide

This document describes the rate limiting measures implemented in Openwhyd to prevent downtime caused by bursts of incoming HTTP calls.

## Overview

Openwhyd implements a **multi-layered defense strategy** against traffic bursts:

1. **Application-level rate limiting** (primary defense)
2. **Cloudflare rate limiting** (secondary defense, optional)

## Application-Level Rate Limiting

### Implementation

The application uses `express-rate-limit` to implement rate limiting at the application layer. This provides protection regardless of infrastructure configuration.

### Rate Limiting Tiers

Different endpoints have different rate limits based on their resource requirements:

#### 1. Global Rate Limiter (All Routes)

- **Limit**: 100 requests per minute per IP
- **Window**: 1 minute
- **Applies to**: All routes except static files
- **Purpose**: General protection against abuse

#### 2. API Rate Limiter (Database-Heavy Operations)

- **Limit**: 30 requests per minute per IP
- **Window**: 1 minute
- **Applies to**: All `/api/*` endpoints
- **Purpose**: Protect database from overload

#### 3. Authentication Rate Limiter (Login/Registration)

- **Limit**: 5 requests per 15 minutes per IP
- **Window**: 15 minutes
- **Applies to**: `/login`, `/register` endpoints
- **Purpose**: Prevent brute force attacks
- **Special**: Successful login attempts don't count against the limit

#### 4. Search Rate Limiter (Resource-Intensive)

- **Limit**: 20 requests per minute per IP
- **Window**: 1 minute
- **Applies to**: `/search` endpoints
- **Purpose**: Protect search infrastructure

### Configuration

Rate limiting configuration is centralized in `/app/lib/rate-limiting.js`. You can adjust the limits by modifying the following parameters:

```javascript
{
  windowMs: 60 * 1000,  // Time window in milliseconds
  limit: 100,            // Maximum requests per window
  message: { error: '...' }, // Error message
  standardHeaders: true, // Include rate limit headers in response
  legacyHeaders: false,  // Exclude legacy X-RateLimit-* headers
}
```

### Rate Limit Headers

When a rate limit is active, the following HTTP headers are included in responses:

- `RateLimit-Limit`: Total number of requests allowed in the window
- `RateLimit-Remaining`: Number of requests remaining in the current window
- `RateLimit-Reset`: Time when the rate limit window resets (Unix timestamp)

### Testing Rate Limits Locally

To test rate limiting locally:

```bash
# Start Openwhyd
npm start

# Test global rate limit (should allow 100 requests/minute)
for i in {1..105}; do curl -s http://localhost:8080/ -o /dev/null -w "%{http_code}\n"; done

# Test auth rate limit (should allow 5 requests/15min)
for i in {1..7}; do curl -s -X POST http://localhost:8080/login -o /dev/null -w "%{http_code}\n"; done

# Test API rate limit (should allow 30 requests/minute)
for i in {1..35}; do curl -s http://localhost:8080/api/user -o /dev/null -w "%{http_code}\n"; done
```

Expected behavior:

- First N requests return 200 (or endpoint-specific status)
- Subsequent requests return 429 (Too Many Requests)

---

## Cloudflare Rate Limiting (Optional)

### Why Cloudflare Rate Limiting?

Cloudflare rate limiting provides an **additional layer of protection** that:

1. **Blocks traffic before it reaches your server** - reducing server load even for rejected requests
2. **Protects against DDoS attacks** - Cloudflare's global network can handle large-scale attacks
3. **Provides better visibility** - Cloudflare's dashboard shows blocked requests and attack patterns
4. **Reduces bandwidth costs** - Blocked requests don't consume your bandwidth

### Is Cloudflare Rate Limiting Appropriate?

**Yes**, Cloudflare rate limiting is highly appropriate for Openwhyd because:

✅ **Complements application-level limits**: Provides defense-in-depth
✅ **Protects infrastructure**: Blocks malicious traffic before it reaches your server
✅ **Reduces resource consumption**: Server doesn't process rate-limited requests
✅ **Better for DDoS**: Cloudflare's network can handle much larger attacks
✅ **Improved visibility**: Centralized monitoring and alerting

**However**, keep in mind:

⚠️ **Cost**: Cloudflare's rate limiting requires a paid plan (Pro or above, ~$20/month)
⚠️ **Configuration overhead**: Requires careful tuning to avoid blocking legitimate users
⚠️ **Trust proxy**: Ensure `trust proxy` is configured correctly (already done in Openwhyd)

### Setting Up Cloudflare Rate Limiting

#### Prerequisites

1. Your domain must be using Cloudflare DNS (already the case for openwhyd.org)
2. You need a Cloudflare Pro plan or higher
3. You should have Cloudflare's proxy (orange cloud) enabled for your domain

#### Step 1: Access Rate Limiting Settings

1. Log in to your Cloudflare dashboard at https://dash.cloudflare.com/
2. Select your domain (openwhyd.org)
3. Go to **Security** → **WAF** → **Rate limiting rules**

#### Step 2: Create Rate Limiting Rules

Create the following rules to match your application-level limits:

##### Rule 1: Global Rate Limit

- **Name**: Global Rate Limit
- **Description**: Protect against general abuse
- **If incoming requests match**:
  - Field: `URI Path`
  - Operator: `does not start with`
  - Value: `/js/` `/css/` `/img/` `/public/`
- **Then take action**:
  - Action: `Block`
  - Duration: `1 minute`
- **For**: `100 requests` per `1 minute` per `IP Address`
- **Response**:
  - Type: `Custom`
  - Status code: `429`
  - Content: `{"error": "Rate limit exceeded. Please try again later."}`
  - Content-Type: `application/json`

##### Rule 2: API Rate Limit

- **Name**: API Rate Limit
- **Description**: Protect API endpoints
- **If incoming requests match**:
  - Field: `URI Path`
  - Operator: `starts with`
  - Value: `/api/`
- **Then take action**:
  - Action: `Block`
  - Duration: `1 minute`
- **For**: `30 requests` per `1 minute` per `IP Address`
- **Response**: Same as above

##### Rule 3: Authentication Rate Limit

- **Name**: Authentication Rate Limit
- **Description**: Prevent brute force attacks
- **If incoming requests match**:
  - Field: `URI Path`
  - Operator: `equals`
  - Value: `/login` OR `/register`
  - AND Method: `POST`
- **Then take action**:
  - Action: `Block`
  - Duration: `15 minutes`
- **For**: `5 requests` per `15 minutes` per `IP Address`
- **Response**: Same as above

##### Rule 4: Search Rate Limit

- **Name**: Search Rate Limit
- **Description**: Protect search endpoints
- **If incoming requests match**:
  - Field: `URI Path`
  - Operator: `starts with`
  - Value: `/search`
- **Then take action**:
  - Action: `Block`
  - Duration: `1 minute`
- **For**: `20 requests` per `1 minute` per `IP Address`
- **Response**: Same as above

#### Step 3: Alternative - Using Cloudflare Terraform Provider

If you prefer infrastructure-as-code, you can use Cloudflare's Terraform provider:

```hcl
# terraform/cloudflare_rate_limits.tf

resource "cloudflare_rate_limit" "global" {
  zone_id = var.cloudflare_zone_id

  threshold = 100
  period    = 60

  match {
    request {
      url_pattern = "*"
    }
  }

  action {
    mode    = "simulate" # Change to "ban" when ready
    timeout = 60

    response {
      content_type = "application/json"
      body         = jsonencode({
        error = "Rate limit exceeded. Please try again later."
      })
    }
  }

  disabled    = false
  description = "Global rate limit for openwhyd.org"
}

resource "cloudflare_rate_limit" "api" {
  zone_id = var.cloudflare_zone_id

  threshold = 30
  period    = 60

  match {
    request {
      url_pattern = "*/api/*"
    }
  }

  action {
    mode    = "simulate" # Change to "ban" when ready
    timeout = 60

    response {
      content_type = "application/json"
      body         = jsonencode({
        error = "API rate limit exceeded. Please try again later."
      })
    }
  }

  disabled    = false
  description = "API rate limit for openwhyd.org"
}

# Add more rules as needed...
```

#### Step 4: Test Cloudflare Rate Limiting

1. **Start with "Simulate" mode**: This logs blocked requests without actually blocking them
2. **Monitor for false positives**: Check Cloudflare's Firewall Events to see if legitimate users are affected
3. **Adjust thresholds if needed**: Based on your traffic patterns
4. **Enable blocking**: Once you're confident, switch from "Simulate" to "Block" mode

#### Step 5: Monitor and Tune

1. Go to **Analytics** → **Security** in your Cloudflare dashboard
2. Review blocked requests and adjust limits as needed
3. Set up alerts for unusual patterns
4. Review weekly to ensure the limits are appropriate

### Monitoring

#### Application-Level Monitoring

Monitor rate limit hits using your application logs:

```bash
# On your server
grep "Too many" /var/log/openwhyd/app.log | wc -l
```

Consider adding Datadog metrics for rate limit hits:

```javascript
// In rate-limiting.js
if (process.datadogTracer) {
  const { metrics } = require('dd-trace');
  // Increment counter when rate limit is hit
  metrics.increment('rate_limit.hit', { endpoint: 'global' });
}
```

#### Cloudflare Monitoring

1. **Firewall Events**: Real-time view of blocked requests
2. **Analytics**: Historical data and trends
3. **Alerts**: Configure alerts for unusual traffic patterns

### Best Practices

1. **Start conservative**: Begin with higher limits and reduce gradually based on observed traffic patterns
2. **Monitor false positives**: Ensure legitimate users aren't being blocked
3. **Use both layers**: Application-level + Cloudflare for defense-in-depth
4. **Document overrides**: If you need to whitelist specific IPs (e.g., monitoring services), document them
5. **Regular review**: Review and adjust limits based on traffic growth and attack patterns
6. **Coordinate limits**: Keep Cloudflare limits slightly higher than application limits to catch edge cases

### Cost Considerations

**Application-level rate limiting**: Free (already implemented)

**Cloudflare rate limiting**:

- Pro plan: $20/month + $0.05 per 10,000 requests above the first 10,000
- Business plan: $200/month + better limits
- Enterprise plan: Custom pricing + DDoS protection

For most scenarios, the Pro plan is sufficient.

### Troubleshooting

#### Issue: Legitimate users are being rate limited

**Solution**:

1. Check if they're behind a NAT/proxy that shares an IP with many users
2. Consider using Cloudflare's "Managed Challenge" action instead of "Block" for less critical endpoints
3. Increase the rate limit threshold for specific endpoints
4. Use Cloudflare's "Skip" action for trusted IP ranges

#### Issue: Rate limits aren't being enforced

**Solution**:

1. Verify `trust proxy` is set correctly in Application.js (already done)
2. Check that Cloudflare proxy (orange cloud) is enabled for your domain
3. Ensure rate limiting rules are not in "Simulate" mode
4. Verify the rules are not disabled

#### Issue: Server still experiences high load despite rate limiting

**Solution**:

1. Check for sophisticated attacks that stay just under the rate limits
2. Consider implementing additional protections (CAPTCHA, bot detection)
3. Review your server resources and consider scaling
4. Check if the attack is coming from many different IPs (distributed attack)

---

## Conclusion

With both application-level and Cloudflare rate limiting in place, Openwhyd is well-protected against traffic bursts and abuse. The multi-layered approach ensures:

- ✅ Protection even if Cloudflare is bypassed
- ✅ Reduced server load from blocked requests
- ✅ Better visibility into attack patterns
- ✅ Flexibility to adjust limits based on traffic patterns

Monitor the system regularly and adjust the limits as needed based on legitimate traffic growth and attack patterns.
