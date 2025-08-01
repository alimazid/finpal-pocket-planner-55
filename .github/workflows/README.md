# GitHub Actions iOS Deployment

This workflow automates the iOS build and deployment process for your Capacitor app.

## Required Secrets

To use this workflow, you need to set up the following secrets in your GitHub repository settings:

### Apple Developer Account
- `APPLE_ID` - Your Apple ID email
- `APPLE_PASSWORD` - Your Apple ID password
- `APPLE_APP_SPECIFIC_PASSWORD` - App-specific password for your Apple ID
- `APPLE_TEAM_ID` - Your Apple Developer Team ID
- `APP_STORE_CONNECT_TEAM_ID` - Your App Store Connect Team ID

### App Store Connect API (Recommended)
- `APP_STORE_CONNECT_API_KEY_ID` - API Key ID from App Store Connect
- `APP_STORE_CONNECT_API_ISSUER_ID` - Issuer ID from App Store Connect
- `APP_STORE_CONNECT_API_KEY_CONTENT` - Base64 encoded .p8 file content

### Code Signing (Fastlane Match)
- `MATCH_PASSWORD` - Password for your match certificates repository

### Optional Notifications
- `SLACK_WEBHOOK_URL` - Slack webhook URL for build notifications

## Setup Instructions

1. **Create App Store Connect API Key**:
   - Go to App Store Connect → Users and Access → Keys
   - Create a new key with "Developer" access
   - Download the .p8 file and encode it as base64

2. **Set up Fastlane Match** (for code signing):
   ```bash
   fastlane match init
   ```

3. **Add secrets to GitHub**:
   - Go to your repo → Settings → Secrets and variables → Actions
   - Add all the required secrets listed above

4. **First deployment**:
   - The workflow will run on every push to `main` branch
   - Pull requests will only build (not deploy)
   - Check the Actions tab for build status

## Workflow Behavior

- **Pull Requests**: Builds the app to verify it compiles
- **Main Branch**: Builds and deploys to TestFlight
- **Develop Branch**: Builds and deploys to TestFlight (if you want staging)

## Manual Deployment

You can also trigger the workflow manually from the Actions tab in GitHub.

## Troubleshooting

- Check the Actions tab for detailed logs
- Ensure all secrets are properly set
- Verify your Apple Developer account has the necessary permissions
- Make sure your app bundle identifier matches: `app.lovable.951e3171ca15422eaa52a6d4774e9ee7`