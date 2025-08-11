# Google Cloud Quick Start Guide for Dreamer AI Website

## Prerequisites Checklist

- [ ] Google Cloud account (tekniquesmr@gmail.com)
- [ ] Billing enabled on your GCP account
- [ ] `gcloud` CLI installed ([Install Guide](https://cloud.google.com/sdk/docs/install))
- [ ] Docker installed ([Install Guide](https://docs.docker.com/get-docker/))
- [ ] Domain `dreamerai.io` from GoDaddy
- [ ] API Keys ready:
  - [ ] OpenAI API Key
  - [ ] Anthropic API Key
  - [ ] ElevenLabs API Key (for ConvAI widget)
  - [ ] HeyGen API Key (for video integration)

## Step 1: Initial Setup (5 minutes)

1. **Login to Google Cloud**
   ```bash
   gcloud auth login
   ```

2. **Create environment file**
   ```bash
   cp .env.gcp.example .env.gcp
   # Edit .env.gcp with your values
   ```

3. **Get your billing account ID**
   ```bash
   gcloud beta billing accounts list
   # Copy the ACCOUNT_ID for the next step
   ```

4. **Set environment variables**
   ```bash
   source .env.gcp
   export GCP_BILLING_ACCOUNT_ID=YOUR_BILLING_ACCOUNT_ID
   ```

## Step 2: Deploy Everything (15-20 minutes)

1. **Make scripts executable**
   ```bash
   chmod +x scripts/*.sh
   ```

2. **Run the deployment script**
   ```bash
   ./scripts/gcp-deploy.sh
   ```
   This will:
   - Create a new GCP project
   - Set up all required services
   - Build and deploy your application
   - Configure database and Redis

3. **Set up HTTPS and Load Balancer**
   ```bash
   ./scripts/gcp-setup-lb.sh
   ```
   This will:
   - Create a static IP address
   - Set up HTTPS with managed SSL certificate
   - Configure load balancing

## Step 3: Configure DNS (5 minutes)

1. **Get your static IP**
   ```bash
   gcloud compute addresses describe dreamer-ai-ip --global
   ```

2. **Update GoDaddy DNS**
   - Login to GoDaddy
   - Go to DNS Management for `dreamerai.io`
   - Update/Add these records:
     ```
     Type  | Name | Value           | TTL
     ------|------|----------------|-----
     A     | @    | YOUR_STATIC_IP | 600
     A     | www  | YOUR_STATIC_IP | 600
     ```

## Step 4: Verify Deployment

1. **Check services status**
   ```bash
   ./scripts/gcp-monitor.sh status
   ```

2. **Test your website** (after DNS propagation, 5-30 minutes)
   - https://dreamerai.io
   - https://www.dreamerai.io

3. **Monitor SSL certificate**
   ```bash
   gcloud compute ssl-certificates describe dreamer-ssl-cert --global
   ```
   Wait for status to change from `PROVISIONING` to `ACTIVE` (10-15 minutes)

## Step 5: Set Up CI/CD (Optional)

1. **Connect GitHub repository**
   ```bash
   gcloud source repos create dreamer-ai-website
   # Or connect existing GitHub repo
   ```

2. **Create build trigger**
   ```bash
   gcloud builds triggers create github \
     --repo-name=dreamer-ai-website \
     --repo-owner=YOUR_GITHUB_USERNAME \
     --branch-pattern="^main$" \
     --build-config=cloudbuild.yaml
   ```

## Monitoring & Management

### View logs
```bash
# Frontend logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=dreamer-frontend" --limit 20

# Backend logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=dreamer-backend" --limit 20
```

### Monitor costs
```bash
./scripts/gcp-monitor.sh costs
```

### Full system check
```bash
./scripts/gcp-monitor.sh full
```

## Troubleshooting

### SSL Certificate Not Working
- DNS propagation can take up to 48 hours
- Check certificate status: `gcloud compute ssl-certificates describe dreamer-ssl-cert --global`

### Services Not Accessible
- Check Cloud Run logs for errors
- Verify service account permissions
- Ensure APIs are enabled

### High Costs
- Run cost optimization: `./scripts/gcp-monitor.sh optimize`
- Set minimum instances to 0 for development

## Clean Up (If Needed)

To remove all resources:
```bash
./scripts/gcp-cleanup.sh
```

## Support

For issues:
1. Check logs: `./scripts/gcp-monitor.sh`
2. Review the full guide: `GOOGLE_CLOUD_DEPLOYMENT_GUIDE.md`
3. Check GCP Console: https://console.cloud.google.com

## Next Steps

1. Set up monitoring alerts in Cloud Console
2. Configure backup automation
3. Implement staging environment
4. Add custom domain email (optional)