# VirtualFair — Historical Virtual-Expo Prototype

> **Repository status:** preserved historical prototype.  
> VirtualFair represents an earlier virtual-fair concept and implementation with an ambitious feature set including AR, streaming, recommendations, translation and direct e-commerce.  
> It is **not the current production-hardening repository** for the newer B2B virtual/hybrid-event SaaS line. Current repository: `ricscar2570/aipavilion`.

The source remains preserved because it contains real backend/frontend implementation and useful product-history material. Do not delete it merely because the current product scope has changed.

---

# VirtualFair

![VirtualFair Logo](https://via.placeholder.com/150)

**VirtualFair** is a platform for creating and managing engaging virtual fairs. Designed for businesses, event organizers, and SMEs, VirtualFair leverages modern technologies to offer a unique, scalable experience.

---

## 🚀 Features

### 🎪 **Virtual Booths**
- Customizable booths with static and dynamic content.
- **Augmented Reality (AR)**: Display 3D models for immersive experiences.

### 📺 **Live Events**
- Real-time streaming powered by **AWS IVS**.
- Scalable infrastructure to support thousands of viewers.

### 🏆 **Gamification**
- Earn points, badges, and climb leaderboards.
- Increase attendee engagement with fun and rewarding activities.

### 🤖 **Personalized Recommendations**
- AI-driven content recommendations tailored to each attendee (Amazon Personalize).
- Enhance the user journey with targeted content.

### 🛒 **Integrated E-commerce**
- Enable direct product and service sales through virtual booths.
- Payment gateway integration with **Stripe**.

### 🌍 **Multilingual Support**
- Automatic translations powered by **Amazon Translate**.
- Expand your audience with multi-language interfaces.

### 📊 **Advanced Analytics**
- Real-time dashboards for exhibitors with key insights.
- Customizable reports based on user interactions.

---

## 🛠️ Architecture Overview

### **Backend**
- **AWS Lambda**: Serverless backend for processing requests.
- **DynamoDB**: NoSQL database for storing booth and user data.
- **API Gateway**: RESTful endpoints to bridge frontend and backend.

### **Frontend**
- **HTML5, CSS3, JavaScript**: Responsive and modern user interface.
- **Frameworks**: Designed with Bootstrap/TailwindCSS for aesthetics.

### **Scalability and Security**
- **Serverless Architecture**: Built to scale automatically on AWS.
- **AWS Cognito**: Secure user authentication.
- **CloudFront CDN**: Fast global content delivery.

---

## 📦 Deployment Guide

### **1. Prerequisites**
- **AWS CLI** configured with valid credentials.
- Access to AWS services: Lambda, DynamoDB, S3, IVS, Personalize, Translate.
- Python 3.9 or higher installed locally.

### **2. Backend Deployment**
1. **Setup DynamoDB Table**:
   ```bash
   aws dynamodb create-table --table-name StandAnalytics --attribute-definitions AttributeName=stand_id,AttributeType=S --key-schema AttributeName=stand_id,KeyType=HASH --billing-mode PAY_PER_REQUEST
   ```
2. **Deploy Lambda Functions**:
   ```bash
   zip save_feedback.zip save_feedback.py
   aws lambda create-function --function-name SaveFeedback --runtime python3.9 --role <role-arn> --handler save_feedback.lambda_handler --code S3Bucket=<bucket-name>,S3Key=save_feedback.zip
   ```

### **3. Frontend Deployment**
1. Sync files with S3:
   ```bash
   aws s3 sync ./frontend s3://<bucket-name>
   ```
2. Configure static website hosting:
   ```bash
   aws s3 website s3://<bucket-name>/ --index-document index.html --error-document error.html
   ```

---

## 🧪 Testing

### **1. Backend Testing**
- Use **Postman** to test API Gateway endpoints.
- Simulate user interactions to verify Lambda responses.

### **2. Frontend Testing**
- Verify booth display and live data updates.
- Check multilingual support.

### **3. Stress Testing**
- Simulate heavy traffic loads on DynamoDB and Lambda to confirm scalability.

---

## 💡 Use Cases
- **Trade Shows**: Host virtual exhibitions with interactive booths.
- **Conferences**: Organize online events with live streaming and networking.
- **Product Launches**: Showcase products with AR and e-commerce.

---

## 🛡️ License
This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

## 👩‍💻 Contributing
We welcome contributions to make VirtualFair even better! Please fork this repository, make your changes, and submit a pull request.

### Support
For any issues or questions, feel free to contact us at support@virtualfair.com.

---

## 📸 Screenshots

![Dashboard Screenshot](https://via.placeholder.com/800x400)
*Example of an exhibitor's dashboard.*
