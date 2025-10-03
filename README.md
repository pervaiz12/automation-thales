# Movie Content Upload Service

A Node.js service for uploading movie content bundles to Azure Blob Storage.

## Features

- Upload movie content bundles with nested directory structure
- Version control for content bundles
- Automatic content type detection
- Comprehensive error handling and logging
- RESTful API with validation
- Environment-based configuration

## Prerequisites

- Node.js 16.x or later
- Azure Storage Account with Blob Storage
- npm or yarn

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd movie-upload-service
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   - Copy `.env.example` to `.env`
   - Update the Azure Storage connection string and other settings

## Configuration

Edit the `.env` file with your configuration:

```
# Azure Storage Configuration
AZURE_STORAGE_CONNECTION_STRING=your_connection_string_here
AZURE_STORAGE_CONTAINER=content

# Server Configuration
PORT=3000
NODE_ENV=development
LOG_LEVEL=info
```

## Usage

1. Start the server:
   ```bash
   npm start
   # or for development with auto-reload
   npm run dev
   ```

2. Send a POST request to upload a movie bundle:
   ```bash
   curl -X POST http://localhost:3000/api/upload-bundle \
     -H "Content-Type: application/json" \
     -d '{"localPath": "./path/to/movie/bundle", "version": "1.0.0"}'
   ```

## API Endpoints

### Upload Movie Bundle

- **URL**: `/api/upload-bundle`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "localPath": "./path/to/movie/bundle",
    "version": "1.0.0"
  }
  ```
- **Success Response** (200):
  ```json
  {
    "success": true,
    "message": "Bundle uploaded successfully",
    "data": {
      "bundleId": "550e8400-e29b-41d4-a716-446655440000",
      "version": "1.0.0",
      "fileCount": 3,
      "totalSize": 5242880,
      "files": [
        {
          "blobUrl": "https://yourstorage.blob.core.windows.net/content/550e8400-e29b-41d4-a716-446655440000/1.0.0/assets/backdrop_4k.jpg",
          "size": 4194304
        },
        {
          "blobUrl": "https://yourstorage.blob.core.windows.net/content/550e8400-e29b-41d4-a716-446655440000/1.0.0/assets/poster_hd.jpg",
          "size": 1048576
        }
      ]
    }
  }
  ```

## Error Handling

The API returns appropriate HTTP status codes along with error details in the response body.

## Logging

Logs are stored in the `logs/` directory:
- `error.log`: Error logs
- `combined.log`: All logs

In development mode, logs are also output to the console.

## Testing

Run tests with:
```bash
npm test
```

## Deployment

1. Set `NODE_ENV=production` in your environment
2. Configure your Azure Storage connection string
3. Use a process manager like PM2 to keep the service running:
   ```bash
   npm install -g pm2
   pm2 start src/app.js --name "movie-upload-service"
   ```

## Security Considerations

- Keep your Azure Storage connection string secure
- Use HTTPS in production
- Implement authentication/authorization for production use
- Set appropriate CORS policies
- Validate all user inputs

## License

[MIT](LICENSE)
