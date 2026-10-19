# ==============================================================================
# ClauseVader - Automated Lambda Container Deployment Script
# Builds the Docker container, pushes to AWS ECR, and deploys to AWS Lambda
# ==============================================================================

$ErrorActionPreference = "Stop"

$AWS_REGION = "ap-south-2"
$AWS_ACCOUNT_ID = "575172595786"
$ECR_REPO_NAME = "clausevader-backend"
$LAMBDA_FUNCTION_NAME = "clausevader-backend"
$ECR_URI = "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO_NAME"
$IMAGE_TAG = "latest"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "🚀 ClauseVader Lambda Container Deployment Pipeline" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "Region:       $AWS_REGION"
Write-Host "Registry URI: $ECR_URI:$IMAGE_TAG"
Write-Host ""

# ------------------------------------------------------------------------------
# 1. Check if Docker Daemon is running
# ------------------------------------------------------------------------------
Write-Host "🔍 [1/5] Checking Docker daemon status..." -ForegroundColor Yellow
try {
    $dockerVersion = docker info --format "{{.ServerVersion}}" 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Docker is not running!" -ForegroundColor Red
        Write-Host "Please start 'Docker Desktop' from your Windows Start Menu and re-run this script." -ForegroundColor Yellow
        exit 1
    }
    Write-Host "✅ Docker is running (Engine Version: $dockerVersion)" -ForegroundColor Green
} catch {
    Write-Host "❌ Error verifying Docker: $_" -ForegroundColor Red
    exit 1
}

# ------------------------------------------------------------------------------
# 2. Authenticate Docker with AWS ECR
# ------------------------------------------------------------------------------
Write-Host "`n🔑 [2/5] Authenticating Docker with Amazon ECR..." -ForegroundColor Yellow
$loginPassword = aws ecr get-login-password --region $AWS_REGION
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to retrieve ECR login password from AWS CLI." -ForegroundColor Red
    exit 1
}

$loginPassword | docker login --username AWS --password-stdin "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com"
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Docker login to ECR failed." -ForegroundColor Red
    exit 1
}
Write-Host "✅ Successfully authenticated with Amazon ECR." -ForegroundColor Green

# ------------------------------------------------------------------------------
# 3. Build Docker Image for linux/amd64 (Lambda Architecture)
# ------------------------------------------------------------------------------
Write-Host "`n🔨 [3/5] Building Docker container image (linux/amd64)..." -ForegroundColor Yellow
docker build --platform linux/amd64 -t "$ECR_REPO_NAME:$IMAGE_TAG" -f Dockerfile.lambda .
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Docker build failed." -ForegroundColor Red
    exit 1
}
Write-Host "✅ Docker image built successfully." -ForegroundColor Green

# ------------------------------------------------------------------------------
# 4. Tag and Push Image to Amazon ECR
# ------------------------------------------------------------------------------
Write-Host "`n📦 [4/5] Tagging and pushing image to Amazon ECR..." -ForegroundColor Yellow
docker tag "$ECR_REPO_NAME:$IMAGE_TAG" "$ECR_URI:$IMAGE_TAG"
docker push "$ECR_URI:$IMAGE_TAG"
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to push image to Amazon ECR." -ForegroundColor Red
    exit 1
}
Write-Host "✅ Image pushed to $ECR_URI:$IMAGE_TAG." -ForegroundColor Green

# ------------------------------------------------------------------------------
# 5. Deploy / Update AWS Lambda Function
# ------------------------------------------------------------------------------
Write-Host "`n⚡ [5/5] Updating AWS Lambda Function..." -ForegroundColor Yellow

# Check existing function package type
$pkgType = aws lambda get-function-configuration --function-name $LAMBDA_FUNCTION_NAME --region $AWS_REGION --query "PackageType" --output text 2>$null

if ($pkgType -eq "Image") {
    Write-Host "Updating code for existing Image-based Lambda function..." -ForegroundColor Cyan
    aws lambda update-function-code `
        --function-name $LAMBDA_FUNCTION_NAME `
        --image-uri "$ECR_URI:$IMAGE_TAG" `
        --region $AWS_REGION | Out-Null
} else {
    Write-Host "Function is currently PackageType=Zip. Recreating as PackageType=Image to support Docker container..." -ForegroundColor Cyan
    
    $roleArn = "arn:aws:iam::$AWS_ACCOUNT_ID:role/clausevader-lambda-role"
    
    # Capture existing environment variables from the running Lambda function
    Write-Host "Extracting active environment variables from current function..." -ForegroundColor Cyan
    $rawEnvJson = aws lambda get-function-configuration --function-name $LAMBDA_FUNCTION_NAME --region $AWS_REGION --query "Environment.Variables" --output json
    $envVariablesParam = "Variables=$($rawEnvJson -replace '\s+', '')"

    # Delete the zip-based function
    aws lambda delete-function --function-name $LAMBDA_FUNCTION_NAME --region $AWS_REGION
    Start-Sleep -Seconds 3

    # Recreate as container image function
    aws lambda create-function `
        --function-name $LAMBDA_FUNCTION_NAME `
        --package-type Image `
        --code ImageUri="$ECR_URI:$IMAGE_TAG" `
        --role $roleArn `
        --timeout 300 `
        --memory-size 512 `
        --region $AWS_REGION `
        --environment $envVariablesParam | Out-Null

    # Re-grant API Gateway permission to invoke Lambda
    aws lambda add-permission `
        --function-name $LAMBDA_FUNCTION_NAME `
        --statement-id "apigateway-access" `
        --action "lambda:InvokeFunction" `
        --principal "apigateway.amazonaws.com" `
        --source-arn "arn:aws:execute-api:$AWS_REGION:$AWS_ACCOUNT_ID:sco67rfosl/*/*" `
        --region $AWS_REGION | Out-Null
}

Write-Host "`n🎉 [SUCCESS] ClauseVader backend is now running as a Docker Container on AWS Lambda!" -ForegroundColor Green
Write-Host "API Gateway URL: https://sco67rfosl.execute-api.ap-south-2.amazonaws.com" -ForegroundColor Cyan
