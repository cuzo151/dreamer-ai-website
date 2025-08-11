# DevOps Deployment Guide - Dreamer AI Solutions

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Prerequisites](#prerequisites)
3. [Local Development](#local-development)
4. [CI/CD Pipeline](#cicd-pipeline)
5. [Deployment Process](#deployment-process)
6. [Monitoring Setup](#monitoring-setup)
7. [Troubleshooting](#troubleshooting)

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                          CloudFront CDN                          │
└─────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Application Load Balancer                 │
│                              (with WAF)                          │
└─────────────────────────────────────────────────────────────────┘
                    │                              │
                    ▼                              ▼
        ┌───────────────────────┐      ┌───────────────────────┐
        │   Frontend Service    │      │   Backend Service     │
        │   (Nginx + React)     │      │   (Node.js + Express) │
        │   Port: 8080          │      │   Port: 3000          │
        └───────────────────────┘      └───────────────────────┘
                                               │         │
                                               ▼         ▼
                                    ┌──────────────┐ ┌────────┐
                                    │  PostgreSQL  │ │  Redis │
                                    │   Database   │ │  Cache │
                                    └──────────────┘ └────────┘
```

## Prerequisites

### Required Tools
- AWS CLI v2.x
- kubectl v1.28+
- Helm v3.x
- Terraform v1.5+
- Docker v24.x
- Node.js v18+
- Git

### AWS Services Required
- EKS (Elastic Kubernetes Service)
- RDS (PostgreSQL)
- ElastiCache (Redis)
- S3
- CloudFront
- Route53
- Certificate Manager
- WAF
- CloudWatch

## Local Development

### 1. Clone Repository
```bash
git clone https://github.com/dreamer-ai/dreamer-ai-website.git
cd dreamer-ai-website
```

### 2. Setup Development Environment
```bash
# Run the setup script
./scripts/setup-dev.sh

# Or manually:
# Install dependencies
cd frontend && npm install && cd ..
cd backend && npm install && cd ..

# Start services with Docker Compose
docker-compose up -d
```

### 3. Environment Variables
Create `.env` file in the root directory:
```env
# Backend
DATABASE_URL=postgresql://user:pass@localhost:5432/dreamerai
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-jwt-secret
OPENAI_API_KEY=your-openai-key
ANTHROPIC_API_KEY=your-anthropic-key

# Frontend
REACT_APP_API_URL=http://localhost:3000
```

## CI/CD Pipeline

### GitHub Actions Workflow

The CI/CD pipeline is triggered on:
- Push to `main` or `develop` branches
- Pull requests to `main`
- Manual workflow dispatch

### Pipeline Stages

1. **Code Quality**
   - ESLint
   - Security audit
   - SonarCloud scan

2. **Testing**
   - Frontend unit tests
   - Backend integration tests
   - E2E tests

3. **Build & Push**
   - Build Docker images
   - Push to GitHub Container Registry

4. **Deploy**
   - Development (automatic on develop branch)
   - Staging (automatic on main branch)
   - Production (manual approval required)

### Setting up GitHub Secrets

```bash
# Required secrets:
gh secret set AWS_ACCESS_KEY_ID --body "your-aws-access-key"
gh secret set AWS_SECRET_ACCESS_KEY --body "your-aws-secret-key"
gh secret set SONAR_TOKEN --body "your-sonar-token"
gh secret set SLACK_WEBHOOK --body "your-slack-webhook"
gh secret set DEV_KUBECONFIG --body "$(cat ~/.kube/config | base64)"
gh secret set STAGING_KUBECONFIG --body "$(cat ~/.kube/config | base64)"
gh secret set PROD_KUBECONFIG --body "$(cat ~/.kube/config | base64)"
```

## Deployment Process

### 1. Infrastructure Setup (First Time)

```bash
# Navigate to Terraform directory
cd terraform

# Initialize Terraform
terraform init

# Create workspaces
terraform workspace new dev
terraform workspace new staging
terraform workspace new prod

# Deploy infrastructure (example for production)
terraform workspace select prod
terraform plan -var-file=environments/prod/terraform.tfvars
terraform apply -var-file=environments/prod/terraform.tfvars
```

### 2. Kubernetes Cluster Setup

```bash
# Update kubeconfig
aws eks update-kubeconfig --name dreamer-ai-prod-cluster --region us-east-1

# Install Ingress Controller
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm install ingress-nginx ingress-nginx/ingress-nginx \
  --namespace ingress-nginx \
  --create-namespace \
  --set controller.service.annotations."service\.beta\.kubernetes\.io/aws-load-balancer-type"="nlb"

# Install cert-manager
helm repo add jetstack https://charts.jetstack.io
helm install cert-manager jetstack/cert-manager \
  --namespace cert-manager \
  --create-namespace \
  --set installCRDs=true

# Apply cert-manager issuers
kubectl apply -f k8s/cert-manager/
```

### 3. Deploy Application

```bash
# Create namespaces
kubectl create namespace production
kubectl create namespace staging
kubectl create namespace development

# Create secrets
kubectl create secret generic backend-secrets \
  --from-literal=database-url="$DATABASE_URL" \
  --from-literal=jwt-secret="$JWT_SECRET" \
  --from-literal=openai-api-key="$OPENAI_API_KEY" \
  --from-literal=anthropic-api-key="$ANTHROPIC_API_KEY" \
  --from-literal=redis-url="$REDIS_URL" \
  -n production

# Apply Kubernetes manifests
kubectl apply -f k8s/base/ -n production
```

### 4. Blue-Green Deployment

```bash
# Deploy to blue environment
kubectl set image deployment/frontend-deployment-blue \
  frontend=ghcr.io/dreamer-ai/frontend:v2.0.0 \
  -n production

kubectl set image deployment/backend-deployment-blue \
  backend=ghcr.io/dreamer-ai/backend:v2.0.0 \
  -n production

# Wait for rollout
kubectl rollout status deployment/frontend-deployment-blue -n production
kubectl rollout status deployment/backend-deployment-blue -n production

# Switch traffic to blue
kubectl patch service frontend-service -n production \
  -p '{"spec":{"selector":{"version":"blue"}}}'
kubectl patch service backend-service -n production \
  -p '{"spec":{"selector":{"version":"blue"}}}'

# After verification, update green for next deployment
kubectl set image deployment/frontend-deployment-green \
  frontend=ghcr.io/dreamer-ai/frontend:v2.0.0 \
  -n production
```

## Monitoring Setup

### 1. Deploy Prometheus Stack

```bash
# Add Prometheus Helm repository
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts

# Install kube-prometheus-stack
helm install prometheus prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --create-namespace \
  --values k8s/monitoring/prometheus-values.yaml
```

### 2. Deploy Grafana Dashboards

```bash
# Apply custom dashboards
kubectl apply -f k8s/monitoring/grafana-dashboards.yaml -n monitoring
```

### 3. Configure CloudWatch

```bash
# Deploy CloudWatch agent
kubectl apply -f https://raw.githubusercontent.com/aws-samples/amazon-cloudwatch-container-insights/latest/k8s-deployment-manifest-templates/deployment-mode/daemonset/container-insights-monitoring/cloudwatch-namespace.yaml

kubectl apply -f https://raw.githubusercontent.com/aws-samples/amazon-cloudwatch-container-insights/latest/k8s-deployment-manifest-templates/deployment-mode/daemonset/container-insights-monitoring/cwagent/cwagent-serviceaccount.yaml
```

### 4. Setup Alerts

```bash
# Apply Prometheus alert rules
kubectl apply -f k8s/monitoring/prometheus-rules.yaml -n monitoring

# Configure AlertManager
kubectl apply -f k8s/monitoring/alertmanager-config.yaml -n monitoring
```

## Troubleshooting

### Common Issues

#### 1. Pod CrashLoopBackOff
```bash
# Check pod logs
kubectl logs <pod-name> -n production --previous

# Describe pod for events
kubectl describe pod <pod-name> -n production

# Check resource limits
kubectl top pods -n production
```

#### 2. Database Connection Issues
```bash
# Test database connectivity
kubectl run -it --rm debug --image=postgres:15 --restart=Never -- \
  psql -h postgresql.production.svc.cluster.local -U dreameradmin -d dreamerai

# Check secrets
kubectl get secret backend-secrets -n production -o yaml
```

#### 3. Ingress Not Working
```bash
# Check ingress status
kubectl get ingress -n production
kubectl describe ingress dreamer-ai-ingress -n production

# Check certificate status
kubectl get certificate -n production
kubectl describe certificate dreamer-ai-tls -n production
```

#### 4. High Memory/CPU Usage
```bash
# Check node resources
kubectl top nodes

# Check pod resources
kubectl top pods -n production

# Scale deployment if needed
kubectl scale deployment backend-deployment --replicas=5 -n production
```

### Rollback Procedures

#### Application Rollback
```bash
# Rollback deployment
kubectl rollout undo deployment/frontend-deployment -n production
kubectl rollout undo deployment/backend-deployment -n production

# Check rollout history
kubectl rollout history deployment/frontend-deployment -n production
```

#### Database Rollback
```bash
# Restore from snapshot
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier dreamer-ai-prod-restored \
  --db-snapshot-identifier manual-snapshot-2025-01-25
```

### Performance Optimization

#### 1. Enable HPA
```bash
kubectl apply -f k8s/base/hpa.yaml -n production
```

#### 2. Cache Optimization
```bash
# Check Redis performance
kubectl exec -it redis-0 -n production -- redis-cli
> INFO stats
> INFO memory
```

#### 3. Database Optimization
```bash
# Connect to database
kubectl exec -it postgresql-0 -n production -- psql -U dreameradmin -d dreamerai

-- Check slow queries
SELECT query, calls, mean_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Update statistics
ANALYZE;
```

## Security Best Practices

1. **Secrets Management**
   - Use AWS Secrets Manager or HashiCorp Vault
   - Rotate secrets regularly
   - Never commit secrets to Git

2. **Network Policies**
   - Apply strict network policies
   - Use service mesh for enhanced security

3. **Container Security**
   - Scan images for vulnerabilities
   - Use minimal base images
   - Run as non-root user

4. **Access Control**
   - Implement RBAC
   - Use service accounts
   - Enable audit logging

## Maintenance Windows

- **Development**: No maintenance window
- **Staging**: Sundays 00:00-04:00 UTC
- **Production**: Sundays 02:00-04:00 UTC

## Support

- **Slack**: #devops-support
- **Email**: devops@dreamer-ai.com
- **On-Call**: PagerDuty integration
- **Documentation**: https://wiki.dreamer-ai.com/devops