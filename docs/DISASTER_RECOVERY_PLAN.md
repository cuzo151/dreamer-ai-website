# Disaster Recovery Plan - Dreamer AI Solutions

## Table of Contents
1. [Overview](#overview)
2. [Recovery Objectives](#recovery-objectives)
3. [Disaster Scenarios](#disaster-scenarios)
4. [Backup Strategy](#backup-strategy)
5. [Recovery Procedures](#recovery-procedures)
6. [Testing and Maintenance](#testing-and-maintenance)
7. [Contact Information](#contact-information)

## Overview

This document outlines the disaster recovery (DR) procedures for the Dreamer AI Solutions platform. It provides step-by-step instructions for recovering from various disaster scenarios while minimizing downtime and data loss.

## Recovery Objectives

### Recovery Time Objective (RTO)
- **Production**: 4 hours
- **Staging**: 8 hours
- **Development**: 24 hours

### Recovery Point Objective (RPO)
- **Database**: 1 hour (point-in-time recovery)
- **Application State**: 15 minutes (Redis snapshots)
- **Static Assets**: 24 hours (S3 versioning)
- **Logs**: No loss (real-time streaming)

## Disaster Scenarios

### 1. Application Failure
- Single pod failure
- Complete deployment failure
- Kubernetes cluster failure

### 2. Data Loss
- Database corruption
- Accidental data deletion
- Redis cache loss

### 3. Infrastructure Failure
- AWS region outage
- Network connectivity issues
- Certificate expiration

### 4. Security Breach
- Compromised credentials
- Data breach
- DDoS attack

## Backup Strategy

### Database Backups

#### Automated Backups
```yaml
Schedule:
  - Full backup: Daily at 03:00 UTC
  - Incremental: Every hour
  - Transaction logs: Continuous

Retention:
  - Daily backups: 30 days
  - Weekly backups: 12 weeks
  - Monthly backups: 12 months

Storage:
  - Primary: AWS RDS automated backups
  - Secondary: S3 cross-region replication
  - Tertiary: Glacier for long-term archive
```

#### Manual Backup Script
```bash
#!/bin/bash
# backup-database.sh

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="dreamerai_backup_${TIMESTAMP}"

# Create backup
pg_dump $DATABASE_URL | gzip > /tmp/${BACKUP_NAME}.sql.gz

# Upload to S3
aws s3 cp /tmp/${BACKUP_NAME}.sql.gz s3://dreamer-ai-backups/postgres/${BACKUP_NAME}.sql.gz

# Verify backup
if [ $? -eq 0 ]; then
  echo "Backup successful: ${BACKUP_NAME}"
  # Clean up local file
  rm /tmp/${BACKUP_NAME}.sql.gz
else
  echo "Backup failed!"
  exit 1
fi
```

### Application State Backups

#### Kubernetes Resources
```bash
#!/bin/bash
# backup-k8s-resources.sh

NAMESPACES=("production" "staging" "development")
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

for NS in "${NAMESPACES[@]}"; do
  # Backup all resources
  kubectl get all,cm,secret,ing,pvc,pv -n $NS -o yaml > k8s_backup_${NS}_${TIMESTAMP}.yaml
  
  # Encrypt sensitive data
  gpg --encrypt --recipient devops@dreamer-ai.com k8s_backup_${NS}_${TIMESTAMP}.yaml
  
  # Upload to S3
  aws s3 cp k8s_backup_${NS}_${TIMESTAMP}.yaml.gpg s3://dreamer-ai-backups/k8s/
done
```

### Redis Backups
```bash
# Redis backup configuration
save 900 1      # After 900 sec if at least 1 key changed
save 300 10     # After 300 sec if at least 10 keys changed
save 60 10000   # After 60 sec if at least 10000 keys changed

# Backup script
redis-cli --rdb /backup/dump.rdb
aws s3 cp /backup/dump.rdb s3://dreamer-ai-backups/redis/dump_$(date +%Y%m%d_%H%M%S).rdb
```

## Recovery Procedures

### 1. Application Recovery

#### Pod Failure Recovery
```bash
# Check pod status
kubectl get pods -n production

# If pod is in CrashLoopBackOff, check logs
kubectl logs <pod-name> -n production --previous

# Force pod restart
kubectl delete pod <pod-name> -n production

# Scale deployment if needed
kubectl scale deployment frontend-deployment --replicas=5 -n production
```

#### Full Deployment Recovery
```bash
# Rollback to previous version
kubectl rollout undo deployment/frontend-deployment -n production
kubectl rollout undo deployment/backend-deployment -n production

# Check rollout status
kubectl rollout status deployment/frontend-deployment -n production
kubectl rollout status deployment/backend-deployment -n production

# If rollback fails, redeploy from known good image
kubectl set image deployment/frontend-deployment frontend=ghcr.io/dreamer-ai/frontend:v1.2.3 -n production
kubectl set image deployment/backend-deployment backend=ghcr.io/dreamer-ai/backend:v1.2.3 -n production
```

### 2. Database Recovery

#### Point-in-Time Recovery
```bash
#!/bin/bash
# restore-database.sh

# Stop application to prevent data corruption
kubectl scale deployment backend-deployment --replicas=0 -n production

# Create new RDS instance from snapshot
aws rds restore-db-instance-to-point-in-time \
  --source-db-instance-identifier dreamer-ai-prod-db \
  --target-db-instance-identifier dreamer-ai-prod-db-restored \
  --restore-time 2025-01-25T10:00:00.000Z

# Wait for instance to be available
aws rds wait db-instance-available \
  --db-instance-identifier dreamer-ai-prod-db-restored

# Update connection string in Kubernetes secret
kubectl create secret generic backend-secrets \
  --from-literal=database-url="postgresql://user:pass@dreamer-ai-prod-db-restored.region.rds.amazonaws.com:5432/dreamerai" \
  --dry-run=client -o yaml | kubectl apply -f - -n production

# Restart application
kubectl scale deployment backend-deployment --replicas=3 -n production
```

#### Manual Database Restore
```bash
# Download backup from S3
aws s3 cp s3://dreamer-ai-backups/postgres/dreamerai_backup_20250125_100000.sql.gz /tmp/

# Decompress
gunzip /tmp/dreamerai_backup_20250125_100000.sql.gz

# Restore to new database
createdb dreamerai_restored
psql dreamerai_restored < /tmp/dreamerai_backup_20250125_100000.sql

# Verify data integrity
psql dreamerai_restored -c "SELECT COUNT(*) FROM users;"
psql dreamerai_restored -c "SELECT COUNT(*) FROM conversations;"
```

### 3. Redis Recovery

```bash
# Stop Redis to prevent data corruption
kubectl scale statefulset redis --replicas=0 -n production

# Restore from backup
aws s3 cp s3://dreamer-ai-backups/redis/dump_20250125_100000.rdb /tmp/dump.rdb

# Copy to Redis pod
kubectl cp /tmp/dump.rdb production/redis-0:/data/dump.rdb

# Start Redis
kubectl scale statefulset redis --replicas=1 -n production

# Verify restoration
kubectl exec -it redis-0 -n production -- redis-cli ping
kubectl exec -it redis-0 -n production -- redis-cli dbsize
```

### 4. Full Cluster Recovery

```bash
#!/bin/bash
# full-cluster-recovery.sh

# 1. Create new EKS cluster
cd terraform/environments/prod
terraform init
terraform apply -auto-approve

# 2. Install cluster essentials
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm install ingress-nginx ingress-nginx/ingress-nginx -n ingress-nginx --create-namespace

helm repo add jetstack https://charts.jetstack.io
helm install cert-manager jetstack/cert-manager --namespace cert-manager --create-namespace --set installCRDs=true

# 3. Restore Kubernetes resources
aws s3 cp s3://dreamer-ai-backups/k8s/k8s_backup_production_latest.yaml.gpg /tmp/
gpg --decrypt /tmp/k8s_backup_production_latest.yaml.gpg | kubectl apply -f -

# 4. Update DNS to point to new cluster
NEW_INGRESS_IP=$(kubectl get service ingress-nginx-controller -n ingress-nginx -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
aws route53 change-resource-record-sets --hosted-zone-id Z123456 --change-batch '{
  "Changes": [{
    "Action": "UPSERT",
    "ResourceRecordSet": {
      "Name": "dreamer-ai.com",
      "Type": "A",
      "AliasTarget": {
        "HostedZoneId": "Z123456",
        "DNSName": "'$NEW_INGRESS_IP'",
        "EvaluateTargetHealth": true
      }
    }
  }]
}'

# 5. Verify services
curl https://dreamer-ai.com/health
curl https://api.dreamer-ai.com/health
```

### 5. Region Failover

```bash
#!/bin/bash
# region-failover.sh

PRIMARY_REGION="us-east-1"
DR_REGION="us-west-2"

# 1. Activate DR region resources
cd terraform/environments/prod-dr
terraform apply -auto-approve

# 2. Restore latest database backup to DR region
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier dreamer-ai-dr-db \
  --db-snapshot-identifier $(aws rds describe-db-snapshots \
    --region $DR_REGION \
    --query 'DBSnapshots[0].DBSnapshotIdentifier' \
    --output text)

# 3. Update Route53 weighted routing
aws route53 change-resource-record-sets --hosted-zone-id Z123456 --change-batch '{
  "Changes": [
    {
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "dreamer-ai.com",
        "Type": "A",
        "SetIdentifier": "Primary",
        "Weight": 0,
        "AliasTarget": {
          "HostedZoneId": "Z123456",
          "DNSName": "primary-alb.us-east-1.elb.amazonaws.com",
          "EvaluateTargetHealth": true
        }
      }
    },
    {
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "dreamer-ai.com",
        "Type": "A",
        "SetIdentifier": "DR",
        "Weight": 100,
        "AliasTarget": {
          "HostedZoneId": "Z789012",
          "DNSName": "dr-alb.us-west-2.elb.amazonaws.com",
          "EvaluateTargetHealth": true
        }
      }
    }
  ]
}'

# 4. Notify team
./notify-team.sh "Region failover completed to $DR_REGION"
```

## Testing and Maintenance

### Monthly DR Drills

```yaml
Schedule: First Saturday of each month, 10:00 UTC

Tests:
  - Database backup and restore
  - Redis backup and restore  
  - Single pod failure
  - Full deployment rollback
  - Certificate renewal

Quarterly Tests:
  - Full cluster recovery
  - Region failover
  - Security incident response
```

### Backup Verification

```bash
#!/bin/bash
# verify-backups.sh

# Test database backup
LATEST_BACKUP=$(aws s3 ls s3://dreamer-ai-backups/postgres/ | tail -1 | awk '{print $4}')
aws s3 cp s3://dreamer-ai-backups/postgres/$LATEST_BACKUP /tmp/
gunzip -t /tmp/$LATEST_BACKUP || exit 1

# Test Redis backup
LATEST_REDIS=$(aws s3 ls s3://dreamer-ai-backups/redis/ | tail -1 | awk '{print $4}')
aws s3 cp s3://dreamer-ai-backups/redis/$LATEST_REDIS /tmp/
redis-check-rdb /tmp/$LATEST_REDIS || exit 1

echo "All backups verified successfully"
```

## Contact Information

### Escalation Matrix

| Level | Role | Contact | Phone |
|-------|------|---------|-------|
| L1 | On-Call Engineer | oncall@dreamer-ai.com | +1-555-0100 |
| L2 | DevOps Lead | devops-lead@dreamer-ai.com | +1-555-0101 |
| L3 | CTO | cto@dreamer-ai.com | +1-555-0102 |

### External Contacts

| Service | Contact | Account # |
|---------|---------|-----------|
| AWS Support | https://console.aws.amazon.com/support | 123456789012 |
| Cloudflare | support@cloudflare.com | CF-12345 |
| PagerDuty | support@pagerduty.com | PD-67890 |

### Communication Channels

- **Primary**: Slack #incident-response
- **Secondary**: incidents@dreamer-ai.com
- **Emergency**: WhatsApp Group "DR Team"
- **Status Page**: https://status.dreamer-ai.com

## Appendix

### Recovery Checklist

- [ ] Identify disaster type and scope
- [ ] Activate incident response team
- [ ] Begin communication protocol
- [ ] Execute relevant recovery procedure
- [ ] Verify service restoration
- [ ] Update status page
- [ ] Conduct post-mortem
- [ ] Update DR documentation

### Tools and Scripts Location

- **GitHub**: https://github.com/dreamer-ai/dr-tools
- **S3**: s3://dreamer-ai-dr-tools/
- **Internal Wiki**: https://wiki.dreamer-ai.com/dr