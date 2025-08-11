# Enable Billing for Your Google Cloud Project

## Quick Steps to Enable Billing:

1. **Open the Billing Page**:
   - Go to: https://console.cloud.google.com/billing/linkedaccount?project=dreamer-ai-website
   - Or navigate to: Console → Billing → Link a billing account

2. **Create or Select a Billing Account**:
   - If you don't have one: Click "Create Account"
   - If you have one: Select it from the list

3. **Add Payment Method**:
   - Add a credit card or bank account
   - Google offers $300 free credits for new accounts!

4. **Link to Your Project**:
   - Select "dreamer-ai-website" project
   - Click "Link billing account"

## Free Tier Benefits:
- **$300 free credits** for 90 days (new accounts)
- **Always Free tier** includes:
  - 2 million Cloud Run requests/month
  - 1 f1-micro VM instance
  - 5GB Cloud Storage
  - 1GB Cloud SQL storage

## Estimated Monthly Costs (After Free Credits):
- Cloud Run: ~$10-20
- Cloud SQL: ~$45
- Redis: ~$15
- Load Balancer: ~$18
- **Total: ~$78-98/month**

## Cost Controls:
1. Set up budget alerts at $100/month
2. Use auto-scaling to minimize costs
3. Cloud Run scales to zero when not in use

Once billing is enabled, run the deployment script again:
```bash
./deploy-to-gcp.sh
```