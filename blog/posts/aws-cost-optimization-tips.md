---
title: AWS Cost Optimization: 5 Strategies to Reduce Your Cloud Bill
date: 2026-07-15
tags: aws, cloud-architecture, cost-optimization
---

# AWS Cost Optimization: 5 Strategies to Reduce Your Cloud Bill

AWS is powerful, but it's easy to spend more than necessary. I've helped teams cut costs by 30-50% without sacrificing performance. Here are five proven strategies.

## 1. Right-Size Your EC2 Instances

Most teams overprovision EC2 instances "just in case." Use CloudWatch metrics to see what you're *actually* using.

```python
import boto3
from datetime import datetime, timedelta

cloudwatch = boto3.client('cloudwatch')

# Check CPU utilization over last 7 days
response = cloudwatch.get_metric_statistics(
    Namespace='AWS/EC2',
    MetricName='CPUUtilization',
    Dimensions=[{'Name': 'InstanceId', 'Value': 'i-1234567890abcdef0'}],
    StartTime=datetime.now() - timedelta(days=7),
    EndTime=datetime.now(),
    Period=3600,
    Statistics=['Average', 'Maximum']
)
```

**Reality check:**
- `t3.xlarge` running at 5% CPU? Downsize to `t3.medium`
- `m5.2xlarge` averaging 20% memory? Drop to `m5.large`
- Reserved Instances save **40-60%** vs on-demand

**Quick wins:**
- Turn off non-production instances outside business hours
- Use Savings Plans (1-3 year commitments) for baseline load
- Use Spot Instances for batch jobs, CI/CD (70% cheaper)

**Potential savings:** 20-40% on compute costs

## 2. Optimize RDS and Database Costs

Database costs often hide inefficiencies:

```sql
-- Find slow queries in RDS Performance Insights
SELECT 
    digest_text,
    SUM(call_count) as total_calls,
    SUM(sum_timer_wait)/1e12 as total_seconds
FROM performance_schema.events_statements_summary_by_digest
ORDER BY total_seconds DESC
LIMIT 10;
```

**Optimization tactics:**
- Switch `db.r5.2xlarge` → `db.r5.xlarge` if memory utilization is <40%
- Use RDS Read Replicas for read-heavy workloads
- Enable automated backups only for 7 days (not 35)
- Use Aurora MySQL/PostgreSQL (30% cheaper than MySQL for same throughput)
- Delete unused RDS snapshots

**Example savings:**
A client had `db.r5.4xlarge` (16 vCPU, 128GB RAM) running at 15% CPU, 25% memory. Downsizing to `db.r5.xlarge` saved **$8,000/month** with zero performance impact.

**Potential savings:** 30-50% on database costs

## 3. S3 Storage Tiers and Lifecycle Policies

S3 storage class choice matters enormously:

```python
import boto3

s3 = boto3.client('s3')

# List objects and their storage classes
response = s3.list_objects_v2(Bucket='my-bucket')
for obj in response.get('Contents', []):
    print(f"{obj['Key']}: {obj.get('StorageClass', 'STANDARD')}")
```

**Storage class pricing** (per GB/month, us-east-1):
- STANDARD: $0.023
- STANDARD-IA (Infrequent Access): $0.0125
- GLACIER (cold storage): $0.004

**Lifecycle rule example:**
```json
{
  "Rules": [
    {
      "Filter": {"Prefix": "logs/"},
      "Transitions": [
        {
          "Days": 30,
          "StorageClass": "STANDARD_IA"
        },
        {
          "Days": 90,
          "StorageClass": "GLACIER"
        }
      ],
      "Expiration": {
        "Days": 365
      }
    }
  ]
}
```

**Potential savings:** 40-70% on storage costs (especially for logs/backups)

## 4. Use VPC Endpoints Instead of NAT Gateways

NAT Gateways charge per hour + per GB processed ($0.045/GB). VPC Endpoints are free to create and don't charge per GB.

**Before (expensive):**
```
EC2 in Private Subnet 
  → NAT Gateway 
    → S3 (Internet)
```
Cost: $32.40/month (fixed) + data transfer

**After (cheap):**
```
EC2 in Private Subnet 
  → VPC S3 Endpoint 
    → S3 (no NAT needed)
```
Cost: $0 + no data transfer charges

**Services worth adding VPC Endpoints for:**
- S3 (most data usually)
- DynamoDB
- Secrets Manager
- SQS/SNS

**Potential savings:** $1,000-$5,000/month (if heavy S3 traffic)

## 5. Audit and Delete Unused Resources

Many teams pay for resources they forgot about:

```bash
# Find unused Elastic IPs (each costs $0.005/hour if unattached)
aws ec2 describe-addresses \
  --query 'Addresses[?AssociationId==null]' \
  --output table

# Find unattached volumes
aws ec2 describe-volumes \
  --query 'Volumes[?State==`available`]' \
  --output table

# Find unused RDS snapshots
aws rds describe-db-snapshots \
  --query 'DBSnapshots[?SnapshotCreateTime<`2025-01-01`]' \
  --output table
```

**Common waste:**
- Unattached EBS volumes: $0.10/GB/month
- Unattached Elastic IPs: $0.005/hour ($36/year each)
- Old RDS snapshots: $0.095/GB/month
- Idle Load Balancers: $16-32/month each

**Potential savings:** $500-$2,000/month (quick cleanup)

## Implementation Roadmap

**Week 1 (Quick wins):**
- Audit EC2 instances, downsize over-provisioned ones
- Delete unused Elastic IPs, unattached volumes, old snapshots
- Enable S3 Lifecycle policies on log buckets

**Week 2-3 (Medium effort):**
- Right-size RDS instances based on CloudWatch metrics
- Switch applicable workloads to Spot or Savings Plans
- Add VPC S3 endpoints (if heavy traffic)

**Month 2:**
- Review unused services (unused Lambda, old Fargate tasks)
- Consolidate resources (merge micro-services if possible)
- Set up budget alerts in AWS Cost Explorer

## Monitoring Going Forward

Set up automatic cost alerts:

```python
import boto3

ce = boto3.client('ce')

# Get daily cost breakdown
response = ce.get_cost_and_usage(
    TimePeriod={
        'Start': '2026-07-01',
        'End': '2026-07-31'
    },
    Granularity='DAILY',
    Metrics=['UnblendedCost'],
    GroupBy=[{'Type': 'DIMENSION', 'Key': 'SERVICE'}]
)
```

**Monthly cost audit checklist:**
- [ ] Check Cost Explorer for month-over-month changes
- [ ] Review CloudWatch Reserved Capacity recommendations
- [ ] Delete old RDS snapshots and backups
- [ ] Check for stranded Elastic IPs, unattached volumes
- [ ] Review CloudFront distribution hit ratios

## Bottom Line

Most teams can cut 30-40% from AWS bills by implementing these five strategies. Start with #1 (right-sizing EC2), which often has the biggest impact with least effort. Then tackle #3 (S3 lifecycle) and #4 (VPC endpoints) if you have storage or NAT costs.

The key is **measurement**—use CloudWatch and Cost Explorer to understand where money goes, then optimize accordingly.

---

**Related:** Read about [Terraform Cost Controls](/blog) or [RDS Performance Tuning](/blog).
