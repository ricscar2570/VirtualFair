#!/bin/bash

# Nome dello stack CloudFormation
STACK_NAME="VirtualFairStack"

# Nome del bucket S3 per il frontend
FRONTEND_BUCKET="virtualfair-frontend-bucket"

# Percorso al file CloudFormation
TEMPLATE_FILE="infrastructure/infrastructure.yaml"

# Percorso alla directory del frontend
FRONTEND_DIR="../frontend"

# Variabili per logging e output
echo "Starting deployment of VirtualFair..."

# 1. Creazione dello stack CloudFormation
echo "Deploying CloudFormation stack..."
aws cloudformation deploy \
    --template-file $TEMPLATE_FILE \
    --stack-name $STACK_NAME \
    --capabilities CAPABILITY_NAMED_IAM

if [ $? -ne 0 ]; then
    echo "Error: Failed to deploy CloudFormation stack."
    exit 1
fi
echo "CloudFormation stack deployed successfully."

# 2. Creazione del bucket S3 per il frontend (se non esiste)
echo "Checking if S3 bucket exists..."
aws s3api head-bucket --bucket $FRONTEND_BUCKET 2>/dev/null
if [ $? -ne 0 ]; then
    echo "Creating S3 bucket: $FRONTEND_BUCKET..."
    aws s3api create-bucket --bucket $FRONTEND_BUCKET --region us-east-1 \
        --create-bucket-configuration LocationConstraint=us-east-1
    if [ $? -ne 0 ]; then
        echo "Error: Failed to create S3 bucket."
        exit 1
    fi
fi
echo "S3 bucket ready: $FRONTEND_BUCKET."

# 3. Sincronizzazione dei file del frontend su S3
echo "Uploading frontend files to S3..."
aws s3 sync $FRONTEND_DIR s3://$FRONTEND_BUCKET --delete

if [ $? -ne 0 ]; then
    echo "Error: Failed to upload frontend files to S3."
    exit 1
fi
echo "Frontend files uploaded successfully."

# 4. Configurazione del bucket S3 per l'hosting statico
echo "Configuring S3 bucket for static website hosting..."
aws s3 website s3://$FRONTEND_BUCKET/ --index-document index.html --error-document error.html

if [ $? -ne 0 ]; then
    echo "Error: Failed to configure S3 bucket for static hosting."
    exit 1
fi
echo "S3 bucket configured for static website hosting."

# 5. Recupero dell'URL del sito
WEBSITE_URL="http://${FRONTEND_BUCKET}.s3-website-us-east-1.amazonaws.com"
echo "Deployment complete. Your website is available at: $WEBSITE_URL"
