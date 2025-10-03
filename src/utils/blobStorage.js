const { BlobServiceClient } = require('@azure/storage-blob');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();
const logger = require('./logger');

class BlobStorageService {
  async initialize() {
    const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
    
    if (!connectionString) {
      const error = new Error('Azure Storage connection string is not configured in environment variables');
      logger.error('Configuration error', { error: error.message });
      throw error;
    }

    try {
      logger.info('Initializing BlobServiceClient with connection string');
      this.blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
      this.containerName = process.env.AZURE_STORAGE_CONTAINER || 'content';
      this.containerClient = this.blobServiceClient.getContainerClient(this.containerName);
      
      // Create the container if it doesn't exist
      await this.containerClient.createIfNotExists();
      logger.info('Successfully initialized BlobStorageService', { container: this.containerName });
    } catch (error) {
      logger.error('Failed to initialize BlobStorageService', { 
        error: error.message,
        stack: error.stack,
        connectionString: connectionString ? '***connection string set***' : '***missing***',
        containerName: this.containerName
      });
      throw new Error(`Failed to initialize Azure Blob Storage: ${error.message}`);
    }
  }

  /**
   * Uploads a directory to Azure Blob Storage
   * @param {string} localPath - Local directory path to upload
   * @param {string} version - Version number for the upload
   * @returns {Promise<Object>} Upload result with file count, total size, and file URLs
   */
  async uploadDirectory(localPath, version) {
    const bundleId = uuidv4();
    const baseBlobPath = `${bundleId}/${version}`;
    const files = await this._getAllFiles(localPath);
    const uploadResults = [];
    let totalSize = 0;

    // Process all files in parallel
    await Promise.all(
      files.map(async (file) => {
        const relativePath = path.relative(localPath, file);
        const blobName = `${baseBlobPath}/${relativePath.replace(/\\/g, '/')}`;
        const fileStats = await fs.stat(file);
        totalSize += fileStats.size;

        const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
        await blockBlobClient.uploadFile(file, {
          blobHTTPHeaders: { blobContentType: this._getContentType(file) }
        });

        uploadResults.push({
          localPath: file,
          blobUrl: blockBlobClient.url,
          size: fileStats.size
        });
      })
    );

    return {
      bundleId,
      version,
      fileCount: files.length,
      totalSize,
      files: uploadResults.map(f => ({
        blobUrl: f.blobUrl,
        size: f.size
      }))
    };
  }

  /**
   * Recursively gets all files in a directory
   * @private
   */
  async _getAllFiles(dir) {
    const dirents = await fs.readdir(dir, { withFileTypes: true });
    const files = await Promise.all(
      dirents.map((dirent) => {
        const res = path.resolve(dir, dirent.name);
        return dirent.isDirectory() ? this._getAllFiles(res) : res;
      })
    );
    return Array.prototype.concat(...files);
  }

  /**
   * Determines content type based on file extension
   * @private
   */
  _getContentType(filePath) {
    const extname = path.extname(filePath).toLowerCase();
    const contentTypes = {
      '.json': 'application/json',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.mp4': 'video/mp4',
      '.webm': 'video/webm',
      '.mov': 'video/quicktime',
      '.pdf': 'application/pdf',
      '.txt': 'text/plain',
      '.html': 'text/html',
      '.css': 'text/css',
      '.js': 'application/javascript'
    };

    return contentTypes[extname] || 'application/octet-stream';
  }
}

module.exports = new BlobStorageService();
