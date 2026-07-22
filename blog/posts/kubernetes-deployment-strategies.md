---
title: Kubernetes Deployment Strategies: Blue-Green vs Canary vs Rolling
date: 2026-07-20
tags: kubernetes, devops, deployment, best-practices
---

# Kubernetes Deployment Strategies: Blue-Green vs Canary vs Rolling

Deploying new versions of your application to Kubernetes requires careful planning to ensure zero downtime and fast rollback if something goes wrong. Let's explore three proven deployment strategies and when to use each.

## The Challenge

In production, rolling out a new version of your app means:
- Migrating traffic from old pods to new ones
- Ensuring no requests are dropped
- Being able to rollback instantly if issues arise
- Minimizing user impact

Kubernetes provides built-in primitives for all three strategies—you just need to choose the right one.

## Rolling Deployment (Default)

A rolling deployment gradually replaces old pods with new ones. It's the default Kubernetes behavior when you update a Deployment.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-server
spec:
  replicas: 5
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1          # 1 extra pod during update
      maxUnavailable: 1    # 1 pod can be down at a time
  template:
    spec:
      containers:
      - name: api
        image: myapp:v2
```

**Pros:**
- Built-in, no extra tooling needed
- Resource-efficient (old and new pods coexist briefly)
- Progressive traffic shift

**Cons:**
- Both versions run simultaneously (harder to test)
- Slower rollback (requires rolling back)
- Database migrations must be backward-compatible

**Best for:** Stateless services with backward-compatible changes.

## Blue-Green Deployment

Blue-green runs two *complete* production environments—blue (current) and green (new). Once green passes validation, you switch all traffic at once.

```yaml
# Green environment (new version)
apiVersion: v1
kind: Service
metadata:
  name: api-service
spec:
  selector:
    version: green  # Switch here to flip traffic
  ports:
  - port: 80
    targetPort: 8080
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-green
spec:
  replicas: 5
  template:
    metadata:
      labels:
        version: green
    spec:
      containers:
      - name: api
        image: myapp:v2
```

**Pros:**
- Instant traffic switch (no gradual shift)
- Full rollback with one label change
- Can run comprehensive tests on green before switching
- No simultaneous versions in production

**Cons:**
- Requires 2x resources during deployment
- Entire green must be ready before switch
- Database schema changes are risky

**Best for:** High-stakes deployments, big feature releases, teams with strict QA.

## Canary Deployment

Canary sends a small percentage of traffic to the new version first. If metrics look good, gradually increase traffic. If issues appear, rollback with minimal impact.

```yaml
# Using a canary controller or Flagger
apiVersion: flagger.app/v1beta1
kind: Canary
metadata:
  name: api-canary
spec:
  targetRef:
    name: api
  service:
    port: 80
  analysis:
    interval: 1m
    threshold: 5        # max 5% error rate
    maxWeight: 50       # max 50% traffic
    stepWeight: 10      # 10% per step
  metrics:
  - name: request-success-rate
    thresholdRange:
      min: 99
  - name: request-duration
    thresholdRange:
      max: 500
```

**Pros:**
- Catches bugs on real traffic (small blast radius)
- Automatic rollback if metrics fail
- Works with any infrastructure
- Fastest time to fully deploy (if green)

**Cons:**
- More complex setup (need metrics/canary controller)
- Both versions running simultaneously
- Requires solid observability

**Best for:** High-traffic services where you want real-world validation before full rollout.

## Comparison Table

| Feature | Rolling | Blue-Green | Canary |
|---------|---------|-----------|--------|
| Resource Overhead | Low | High (2x) | Medium |
| Traffic Switch Speed | Gradual | Instant | Phased |
| Rollback Speed | Slow | Instant | Instant |
| Testing Before Switch | None | Full | Partial |
| Resource Cost | $ | $$$ | $$ |
| Complexity | Low | Medium | High |

## Recommendations by Scenario

**Use Rolling if:**
- Deploying hourly (internal tools)
- Changes are small and frequent
- You trust your test coverage

**Use Blue-Green if:**
- Database schema changes required
- Deploying during business hours
- You need guaranteed instant rollback
- You have the budget for 2x resources

**Use Canary if:**
- Service is high-traffic or business-critical
- You want to catch bugs on real traffic
- You have good observability (Prometheus, Datadog, etc.)
- You're running on a managed platform (GKE, EKS)

## In Practice

Most teams end up using a **combination**:
1. Use rolling updates for internal services
2. Use canary for customer-facing APIs (with auto-rollback)
3. Use blue-green for major releases (10x+ version bump)

The key is matching the strategy to your risk tolerance and infrastructure maturity.

---

**Next:** Read about [Helm best practices](/blog) or [Kubernetes resource requests](/blog).
