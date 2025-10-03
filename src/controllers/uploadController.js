const fs = require('fs').promises;
const path = require('path');
const { validationResult } = require('express-validator');
const blobStorage = require('../utils/blobStorage');
const logger = require('../utils/logger');

class UploadController {
  /**
   * Upload a movie bundle to Azure Blob Storage
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async uploadBundle(req, res) {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn('Validation failed', { errors: errors.array() });
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { localPath, version } = req.body;
    logger.info('Upload request received', { localPath, version });

    try {
      // Verify the directory exists
      const absolutePath = path.resolve(process.cwd(), localPath);
      const stats = await fs.stat(absolutePath);
      
      if (!stats.isDirectory()) {
        throw new Error('Provided path is not a directory');
      }

      // Upload directory to Azure Blob Storage
      const result = await blobStorage.uploadDirectory(absolutePath, version);
      
      logger.info('Upload completed successfully', { 
        bundleId: result.bundleId,
        fileCount: result.fileCount,
        totalSize: result.totalSize
      });

      res.status(200).json({
        success: true,
        message: 'Bundle uploaded successfully',
        data: result
      });
    } catch (error) {
      logger.error('Error uploading bundle', { 
        error: error.message, 
        stack: error.stack 
      });
      
      res.status(500).json({
        success: false,
        message: 'Failed to upload bundle',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
}

module.exports = new UploadController();
