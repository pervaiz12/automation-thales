# FlytEdge Bundle Management API Documentation

This API provides endpoints for managing Thales FlytEdge content bundles, including creation, versioning, and integration with Azure Blob Storage.

## Base URL
```
http://localhost:3000/api
```

## Authentication
Configure your FlytEdge API credentials in `.env`:
```
FLYTEDGE_API_KEY=your-api-key-here
FLYTEDGE_ORGANIZATION=your-organization-here
```

## Endpoints

### 1. Get Bundle Names
**GET** `/bundles/names`

Retrieves all available bundle names from the local `ThalesFlytEdge_Data` directory.

**Response:**
```json
{
  "success": true,
  "data": {
    "bundles": ["ALineofFire", "ANiceIndianBoy", "TheLifeofChuck"],
    "count": 3
  }
}
```

### 2. Get Bundle Metadata
**GET** `/bundles/:bundleName/metadata`

Retrieves metadata for a specific bundle from its feed JSON file.

**Parameters:**
- `bundleName` (string): Name of the bundle

**Response:**
```json
{
  "success": true,
  "data": {
    "name": "ALineofFire",
    "movieData": {
      "@type": "Movie",
      "name": [{"@language": "en", "@value": "A Line of Fire"}],
      "description": [...],
      "genre": ["Action", "Thriller"],
      "duration": "PT1H30M0S"
    },
    "feedPath": "/path/to/feed/file"
  }
}
```

### 3. Create New Bundle
**POST** `/bundles/create`

Creates a new bundle on FlytEdge platform.

**Request Body:**
```json
{
  "airline": "destination-airline",
  "service": "service-name",
  "name": "bundle-name",
  "version": "1.0.0",
  "description": "Bundle description"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Bundle created successfully",
  "data": {
    "containerUrl": "https://ifepdgpu...dows.net/thl",
    "containerPrefix": "content/2dc1....305/my-version/",
    "sasToken": "sv=2025-05-05&spr=https...",
    "expirationDate": "2025-06-10T00:19:58.622Z",
    "bundleId": "2dc1....305",
    "containerName": "my-organization",
    "blobSASUrl": "https://ifepdg..ws.net/thl/content/..."
  }
}
```

### 4. Create Bundle Version
**POST** `/bundles/create-version`

Creates a new version of an existing bundle.

**Request Body:** Same as create bundle

### 5. Create Bundle from Existing
**POST** `/bundles/create-from-existing`

Creates a new bundle by copying from an existing one.

**Request Body:**
```json
{
  "airline": "destination-airline",
  "service": "service-name",
  "name": "new-bundle-name",
  "version": "1.0.0",
  "description": "New bundle description",
  "copyFrom": {
    "id": "existing-bundle-id",
    "version": "existing-version"
  }
}
```

### 6. Create Bundle from Local Data
**POST** `/bundles/create-from-local`

Creates a bundle using data from local `ThalesFlytEdge_Data` directory.

**Request Body:**
```json
{
  "bundleName": "ALineofFire",
  "airline": "destination-airline",
  "service": "movie-streaming",
  "version": "1.0.0",
  "description": "Optional description"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Bundle created from local data successfully",
  "data": {
    "flytEdgeResponse": {...},
    "localMetadata": {...}
  }
}
```

### 7. Get Bundle SAS Token
**GET** `/bundles/:bundleId/versions/:bundleVersion/sas`

Retrieves a Shared Access Signature for uploading content to Azure Blob Storage.

**Parameters:**
- `bundleId` (string): Bundle ID
- `bundleVersion` (string): Bundle version

### 8. Validate Bundle
**POST** `/bundles/:bundleId/versions/:bundleVersion/validate`

Validates/publishes a bundle after content upload.

### 9. Update Bundle After Upload
**POST** `/bundles/:bundleId/versions/:bundleVersion/update`

Updates bundle status after content has been uploaded to Azure Blob Storage.

### 10. Get Saved Bundles
**GET** `/bundles/saved`

Retrieves all locally saved bundle information.

## Usage Examples

### Creating a bundle from local ALineofFire data:
```bash
curl -X POST http://localhost:3000/api/bundles/create-from-local \
  -H "Content-Type: application/json" \
  -d '{
    "bundleName": "ALineofFire",
    "airline": "test-airline",
    "service": "movie-streaming",
    "version": "1.0.0"
  }'
```

### Getting all bundle names:
```bash
curl http://localhost:3000/api/bundles/names
```

### Getting bundle metadata:
```bash
curl http://localhost:3000/api/bundles/ALineofFire/metadata
```

## Error Handling
All endpoints return standardized error responses:
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message"
}
```

## Data Storage
Bundle information is automatically saved locally in `data/bundles/` directory for future reference and tracking.
