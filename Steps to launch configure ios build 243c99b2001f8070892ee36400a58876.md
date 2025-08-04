# Steps to launch configure ios build

https://lovable.dev/projects/951e3171-ca15-422e-aa52-a6d4774e9ee7?messageId=aimsg_01k1k2nnvheh7vep1yp4bb5ptp

I'll guide you through each step in detail to set up the iOS deployment workflow successfully. Let me first examine the current workflow configuration to understand what we're working with.

Perfect! Now I can see exactly what the workflow needs. Let me guide you through each step with detailed explanations. The workflow is missing the `MATCH_GIT_URL` configuration, so I'll include that in the setup.

# Complete Step-by-Step Guide for iOS Deployment Workflow

## Prerequisites

- You need an **Apple Developer Account** ($99/year). You will need to wait 24 to 48 hours after enrolling to be able to connect to the app store connect
- Your project needs to be **connected to GitHub** (export your Lovable project to GitHub first)
- You need **macOS access** for initial certificate setup (can be local Mac, rented Mac, or use GitHub Codespaces)

## Step 1: Create App Store Connect API Key (Recommended Authentication)

**Why this step?** App Store Connect API keys are more secure and reliable than using Apple ID/password. They don't require 2FA handling and won't expire like passwords might.

### 1.1 Access App Store Connect ✅

1. Go to [App Store Connect](https://appstoreconnect.apple.com/)
2. Sign in with your Apple Developer account
3. Navigate to **"Users and Access"** in the top navigation

### 1.2 Create API Key ✅

1. Click on **"Keys"** tab (you'll see it in the left sidebar under "Integrations")
2. Click the **"+"** button to create a new key
3. **Name**: Give it a descriptive name like "GitHub Actions iOS Deploy"
4. **Access**: Select **"Developer"** (this gives necessary permissions for TestFlight uploads)
5. Click **"Generate"**

### 1.3 Download and Save Key Information ✅

1. **Download the .p8 file** immediately (you can only download it once!)
2. **Copy the Key ID** (looks like `ABC123DEF4`)
    1. UFR5PUZLM5
3. **Copy the Issuer ID** (looks like `12345678-1234-1234-1234-123456789012`)  
    1. 6c4c4ab6-f341-4372-ad7b-42a0f45f7a71

### 1.4 Convert .p8 File to Base64 ✅

**Why Base64?** GitHub Secrets can't store binary files, so we need to encode the certificate as text.

On macOS/Linux:

```bash
base64 -i /path/to/your/AuthKey_ABC123DEF4.p8 | pbcopy

```

On Windows (PowerShell):

```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("C:\\path\\to\\AuthKey_ABC123DEF4.p8")) | clip

```

Save this Base64 string - you'll need it for the `APP_STORE_CONNECT_API_KEY_CONTENT` secret.

## Step 2: Get Your Apple Developer Team Information

### 2.1 Find Your Team ID

1. Go to [Apple Developer Portal](https://developer.apple.com/account/)
2. Sign in and click on **"Membership"** in the sidebar
3. Your **Team ID** will be displayed (looks like `ABC123DEF4`)
    1. P2M7WHN774

### 2.2 Find Your App Store Connect Team ID

1. In App Store Connect, go to **"Users and Access"**
2. Look for **"Provider"** information - this is your App Store Connect Team ID
3. If you only see one team, it's usually the same as your Developer Team ID

## Step 3: Set Up Fastlane Match (Certificate Management)

**Why Match?** Fastlane Match stores all your iOS certificates and provisioning profiles in a Git repository, making them accessible to your CI/CD pipeline. This is essential because iOS apps need to be code-signed with certificates that are tied to your Apple Developer account.

### 3.1 Create a Private Git Repository for Certificates

**⚠️ IMPORTANT:** This repository will contain sensitive certificate information and MUST be private.

1. Go to GitHub and create a **new private repository**
2. Name it something like `ios-certificates` or `certificates`
3. ✅ Make sure it's set to **Private**
4. Don't add README, .gitignore, or license (keep it empty)
5. Copy the repository URL (e.g., `https://github.com/yourusername/ios-certificates.git`)
    1. https://github.com/alimazid/certificates

### 3.2 Create GitHub Personal Access Token

**Why a token?** The workflow needs to access your private certificates repository, so it needs authentication.

1. Go to GitHub → **Settings** (your profile settings, not repository settings)
2. Scroll down to **"Developer settings"** in the left sidebar
3. Click **"Personal access tokens"** → **"Fine-grained tokens"** (recommended) or **"Tokens (classic)"**
4. Click **"Generate new token"**
5. **Name**: "iOS Certificates Access"
6. **Expiration**: Set to 1 year or "No expiration" (for simplicity)
7. **Permissions**: Select **"Contents"** and **"Metadata"** for your certificates repository
8. Click **"Generate token"**
9. **⚠️ COPY THE TOKEN IMMEDIATELY** - you won't see it again!

### 3.3 Create Base64 Encoded Git Authorization

**Why Base64 encoding?** The workflow needs to authenticate with GitHub using basic authentication, which requires encoding credentials.

Replace `your-github-username` and `your-token` with your actual values:

On macOS/Linux:

```bash
echo -n "your-github-username:your-token" | base64

```

On Windows (PowerShell):

```powershell
[Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes("your-github-username:your-token"))

```

Save this Base64 string - you'll need it for `MATCH_GIT_BASIC_AUTHORIZATION`.

### 3.4 Initialize Fastlane Match Locally (Critical Step)

**Why locally first?** You need to generate the initial certificates and provisioning profiles on a Mac before the CI can use them.

1. **Install Fastlane** (on a Mac):

```bash
sudo gem install fastlane

```

1. **Clone your project** and navigate to it:

```bash
git clone <https://github.com/yourusername/your-project.git>
cd your-project

```

1. **Initialize Fastlane Match**:

```bash
fastlane match init

```

When prompted, enter your certificates repository URL: `https://github.com/yourusername/ios-certificates.git`

1. **Generate Development Certificates**:

```bash
fastlane match development --app_identifier app.lovable.951e3171ca15422eaa52a6d4774e9ee7

```

1. **Generate App Store Certificates**:

```bash
fastlane match appstore --app_identifier app.lovable.951e3171ca15422eaa52a6d4774e9ee7

```

**During this process:**

- You'll be asked to create a passphrase for encryption - **remember this!** You'll need it for `MATCH_PASSWORD`
- You might need to sign into your Apple Developer account
- Fastlane will create certificates and push them to your certificates repository

## Step 4: Create Your App in App Store Connect

**Why this step?** Even for TestFlight builds, your app needs to exist in App Store Connect.

1. Go to [App Store Connect](https://appstoreconnect.apple.com/)
2. Click **"My Apps"**
3. Click the **"+"** button and select **"New App"**
4. **Platform**: iOS
5. **Name**: Your app name (e.g., "FinPal Pocket Planner")
6. **Primary Language**: English (or your preferred language)
7. **Bundle ID**: Select **"app.lovable.951e3171ca15422eaa52a6d4774e9ee7"** (it should appear if certificates were created correctly)
8. **SKU**: Can be anything unique, like "finpal-2024"
9. Click **"Create"**

## Step 5: Set Up GitHub Repository Secrets

**Why secrets?** These contain sensitive information that shouldn't be in your code but needs to be available to the workflow.

1. Go to your **GitHub repository** (the one with your Lovable project)
2. Click **"Settings"** (repository settings, not your profile)
3. In the left sidebar, click **"Secrets and variables"** → **"Actions"**
4. Click **"New repository secret"** for each of the following:

### Required Secrets:

**Apple Developer Account:**

- `APPLE_ID`: Your Apple ID email address
- `APPLE_PASSWORD`: Your Apple ID password
- `APPLE_APP_SPECIFIC_PASSWORD`: [Generate this](https://appleid.apple.com/account/manage) → Sign-In and Security → App-Specific Passwords
- `APPLE_TEAM_ID`: Your Team ID from Step 2.1
- `APP_STORE_CONNECT_TEAM_ID`: Your App Store Connect Team ID from Step 2.2

**App Store Connect API (from Step 1):**

- `APP_STORE_CONNECT_API_KEY_ID`: The Key ID you copied
- `APP_STORE_CONNECT_API_ISSUER_ID`: The Issuer ID you copied
- `APP_STORE_CONNECT_API_KEY_CONTENT`: The Base64 encoded .p8 file content

**Fastlane Match (from Step 3):**

- `MATCH_GIT_URL`: Your certificates repository URL (e.g., `https://github.com/yourusername/ios-certificates.git`)
- `MATCH_PASSWORD`: The passphrase you created during `fastlane match init`
- `MATCH_GIT_BASIC_AUTHORIZATION`: The Base64 encoded GitHub credentials

**Optional:**

- `SLACK_WEBHOOK_URL`: If you want Slack notifications (optional)

## Step 6: Update the Workflow Configuration

The current workflow is missing the `MATCH_GIT_URL` parameter. Here's what needs to be added to the Fastfile configuration in the workflow:

The `match()` call in the workflow needs to include:

```ruby
match(
  type: "appstore",
  readonly: true,
  app_identifier: "app.lovable.951e3171ca15422eaa52a6d4774e9ee7",
  git_url: ENV["MATCH_GIT_URL"],
  git_basic_authorization: ENV["MATCH_GIT_BASIC_AUTHORIZATION"]
)

```

## Step 7: Test the Workflow

1. **Push to a feature branch** first to test the build without deployment:

```bash
git checkout -b test-ios-build
git push origin test-ios-build

```

Create a pull request - this will trigger the build-only workflow.

1. **If the build succeeds**, merge to main to trigger the full deployment to TestFlight.

## Step 8: Monitor and Troubleshoot

1. **Check GitHub Actions**: Go to your repository → "Actions" tab to see workflow runs
2. **Check TestFlight**: If deployment succeeds, your build will appear in App Store Connect → TestFlight
3. **View detailed logs**: Click on any failed workflow run to see exactly what went wrong

## Common Issues and Solutions:

1. **"No value found for 'git_url'"**: Make sure `MATCH_GIT_URL` secret is set
2. **"Error cloning certificates git repo"**: Verify `MATCH_GIT_BASIC_AUTHORIZATION` is correct
3. **"Certificate not found"**: Run the local `fastlane match` commands first
4. **"Bundle identifier mismatch"**: Ensure you used the exact Bundle ID throughout

Would you like me to explain any of these steps in more detail, or do you have questions about any specific part of the setup?