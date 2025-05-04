# Daily Runners - Railway Deployment Guide

This guide explains how to deploy the Daily Runners application on Railway.app.

## Prerequisites

Before deploying, you'll need:

1. A Railway account (https://railway.app)
2. An Intercom account with an API token and Admin ID
3. An ImgBB account with an API key

## Deployment Steps

### 1. Fork or Clone the Repository

Make sure you have the latest version of the codebase on your local machine.

### 2. Create a New Project on Railway

- Go to [Railway Dashboard](https://railway.app/dashboard)
- Click "New Project"
- Select "Deploy from GitHub repo"
- Connect your GitHub account if not already connected
- Select the repository

### 3. Configure Environment Variables

In the Railway dashboard, navigate to your project's Variables tab and add the following environment variables:

Required variables:
```
INTERCOM_TOKEN=your_intercom_token_here
INTERCOM_ADMIN_ID=your_intercom_admin_id_here
IMGBB_API_KEY=your_imgbb_api_key_here
```

Optional variables:
```
PORT=3000
TEST_USER_IDS=test_user_id_1,test_user_id_2,test_user_id_3
LOG_LEVEL=info
```

### 4. Deploy the Service

- Railway will automatically detect the Procfile and deploy your application
- The deployment will use the `npm start` command defined in the Procfile

### 5. Set Up a Domain (Optional)

- Go to the "Settings" tab of your project
- Navigate to "Domains"
- Generate a Railway subdomain or connect a custom domain

### 6. Monitor Logs

- In the Railway dashboard, go to the "Deployments" tab
- Click on the latest deployment
- Go to the "Logs" tab to view your application logs

## Testing the Deployment

After deployment, you can test if the service is running correctly by:

1. Visiting the root URL (/) to see the status page
2. Triggering a manual run by visiting the /run endpoint

## Troubleshooting

If you encounter issues:

1. Check the logs in the Railway dashboard
2. Verify your environment variables are set correctly
3. Make sure your Intercom and ImgBB API keys are valid

## Railway-specific Tips

- Railway automatically handles restarts and scaling
- The service is configured to restart on failure (up to 3 times) as defined in railway.json
- Health checks are configured to ensure your service stays responsive

For additional help, refer to the [Railway documentation](https://docs.railway.app/). 