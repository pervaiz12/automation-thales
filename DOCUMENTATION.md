# Movie Content Upload Service - Complete Documentation

## 📝 Table of Contents
1. [Introduction](#-introduction)
2. [Prerequisites](#-prerequisites)
3. [Setup Instructions](#-setup-instructions)
4. [Configuration](#-configuration)
5. [API Endpoints](#-api-endpoints)
6. [Testing with Postman](#-testing-with-postman)
7. [Troubleshooting](#-troubleshooting)
8. [Azure Portal Setup](#-azure-portal-setup)
9. [Security Considerations](#-security-considerations)

## 🌟 Introduction
This service allows you to upload movie content bundles to Azure Blob Storage with version control. Each bundle can contain multiple files organized in a directory structure.

## 🛠 Prerequisites
- Node.js 16.x or later
- Azure Storage Account
- npm or yarn
- Postman (for API testing)

## 🚀 Setup Instructions

### 1. Clone the Repository
```bash
git clone <repository-url>
cd airline-dashboards
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment
1. Create a `.env` file in the project root
2. Add your Azure Storage connection string:

```env
# Azure Storage Configuration
AZURE_STORAGE_CONNECTION_STRING=Your_Connection_String_Here
AZURE_STORAGE_CONTAINER=content

# Server Configuration
PORT=3000
NODE_ENV=development
```

### 4. Get Azure Storage Connection String
1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to your Storage Account
3. Under "Security + networking", select "Access keys"
4. Click "Show keys"
5. Copy the "Connection string"

## ⚙️ Configuration

### Environment Variables
| Variable | Description | Example |
|----------|-------------|---------|
| `AZURE_STORAGE_CONNECTION_STRING` | Azure Storage connection string | `DefaultEndpointsProtocol=...` |
| `AZURE_STORAGE_CONTAINER` | Container name (default: content) | `content` |
| `PORT` | Server port (default: 3000) | `3000` |
| `NODE_ENV` | Environment mode | `development` or `production` |

## 🌐 API Endpoints

### 1. Upload Movie Bundle
- **URL**: `POST /api/upload-bundle`
- **Request Body**:
  ```json
  {
    "localPath": "./path/to/movie-bundle",
    "version": "1.0"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "message": "Bundle uploaded successfully",
    "data": {
      "bundleId": "uuid-here",
      "version": "1.0",
      "fileCount": 3,
      "totalSize": 1234567,
      "files": [
        {
          "blobUrl": "https://...",
          "size": 12345
        }
      ]
    }
  }
  ```

### 2. Health Check
- **URL**: `GET /health`
- **Response**:
  ```json
  {
    "status": "ok",
    "timestamp": "2025-08-31T17:00:00.000Z"
  }
  ```

## 🧪 Testing with Postman

1. **Setup Request**
   - Method: `POST`
   - URL: `http://localhost:3000/api/upload-bundle`
   - Headers:
     - `Content-Type: application/json`
   - Body (raw JSON):
     ```json
     {
       "localPath": "./ThalesFlytEdge_Data/ALineofFire-movie",
       "version": "1.0"
     }
     ```

2. **Expected Response**
   - Status: `200 OK`
   - Body: JSON with upload details

## 🔧 Troubleshooting

### Common Issues
1. **Invalid Connection String**
   - Ensure the connection string is complete and properly formatted
   - It should start with `DefaultEndpointsProtocol=`

2. **Container Doesn't Exist**
   - The service will automatically create the container if it has the correct permissions
   - Verify the container name in `.env` matches your Azure Storage container

3. **File Not Found**
   - Ensure the `localPath` is correct and accessible
   - Use relative paths from the project root

## 🔗 Azure Portal Setup

### 1. Create Storage Account
1. Go to Azure Portal
2. Click "Create a resource"
3. Search for "Storage account"
4. Click "Create"
5. Fill in the required details
6. Click "Review + create"

### 2. Get Connection String
1. Go to your Storage Account
2. Under "Security + networking", select "Access keys"
3. Copy the connection string

### 3. Create Container
1. In your Storage Account
2. Under "Data storage", select "Containers"
3. Click "+ Container"
4. Name it `content`
5. Set public access level (recommended: Private)

## 🔒 Security Considerations

1. **Environment Variables**
   - Never commit `.env` to version control
   - Add `.env` to `.gitignore`

2. **Azure Storage**
   - Use private containers for sensitive data
   - Rotate storage account keys regularly
   - Use SAS tokens for temporary access if needed

3. **API Security**
   - In production, implement authentication
   - Use HTTPS
   - Set up CORS properly

## 📜 License
[MIT](LICENSE)

## 🤝 Support
For issues and feature requests, please open an issue on the GitHub repository.
