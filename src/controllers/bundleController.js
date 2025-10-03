const { validationResult } = require('express-validator');
const flytEdgeService = require('../services/flytEdgeService');
const logger = require('../utils/logger');
const path = require('path');
const fs = require('fs').promises;

class BundleController {
  /**
   * Get all available bundle names from ThalesFlytEdge_Data directory
   */
  async getBundleNames(req, res) {
    try {
      const bundleNames = await flytEdgeService.getBundleNames();
      
      res.status(200).json({
        success: true,
        data: {
          bundles: bundleNames,
          count: bundleNames.length
        }
      });
    } catch (error) {
      logger.error('Error getting bundle names', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve bundle names',
        error: error.message
      });
    }
  }

  /**
   * Get bundle metadata including movie information
   */
  async getBundleMetadata(req, res) {
    try {
      const { bundleName } = req.params;
      const metadata = await flytEdgeService.getBundleMetadata(bundleName);
      
      res.status(200).json({
        success: true,
        data: metadata
      });
    } catch (error) {
      logger.error('Error getting bundle metadata', { 
        bundleName: req.params.bundleName, 
        error: error.message 
      });
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve bundle metadata',
        error: error.message
      });
    }
  }

  /**
   * Create a new bundle on FlytEdge
   */
  async createBundle(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { airline, service, name, version, description } = req.body;
      
      const bundleData = {
        airline,
        service,
        name,
        version,
        description
      };

      const result = await flytEdgeService.createBundle(bundleData);
      
      // Save bundle info locally for future reference
      await this.saveBundleInfo(result, bundleData);
      
      res.status(201).json({
        success: true,
        message: 'Bundle created successfully',
        data: result
      });
    } catch (error) {
      logger.error('Error creating bundle', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Failed to create bundle',
        error: error.message
      });
    }
  }

  /**
   * Create a new version of an existing bundle
   */
  async createBundleVersion(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { airline, service, name, version, description } = req.body;
      
      const bundleData = {
        airline,
        service,
        name,
        version,
        description
      };

      const result = await flytEdgeService.createBundleVersion(bundleData);
      
      // Save bundle info locally
      await this.saveBundleInfo(result, bundleData);
      
      res.status(201).json({
        success: true,
        message: 'Bundle version created successfully',
        data: result
      });
    } catch (error) {
      logger.error('Error creating bundle version', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Failed to create bundle version',
        error: error.message
      });
    }
  }

  /**
   * Create a new bundle from an existing one
   */
  async createBundleFromExisting(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { airline, service, name, version, description, copyFrom } = req.body;
      
      const bundleData = {
        airline,
        service,
        name,
        version,
        description
      };

      const result = await flytEdgeService.createBundleFromExisting(bundleData, copyFrom);
      
      // Save bundle info locally
      await this.saveBundleInfo(result, bundleData);
      
      res.status(201).json({
        success: true,
        message: 'Bundle created from existing successfully',
        data: result
      });
    } catch (error) {
      logger.error('Error creating bundle from existing', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Failed to create bundle from existing',
        error: error.message
      });
    }
  }

  /**
   * Get Shared Access Signature for a bundle
   */
  async getBundleSAS(req, res) {
    try {
      const { bundleId, bundleVersion } = req.params;
      
      const sasData = await flytEdgeService.getBundleSAS(bundleId, bundleVersion);
      
      res.status(200).json({
        success: true,
        data: sasData
      });
    } catch (error) {
      logger.error('Error getting bundle SAS', { 
        bundleId: req.params.bundleId,
        bundleVersion: req.params.bundleVersion,
        error: error.message 
      });
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve SAS token',
        error: error.message
      });
    }
  }

  /**
   * Validate/Publish a bundle
   */
  async validateBundle(req, res) {
    try {
      const { bundleId, bundleVersion } = req.params;
      
      const result = await flytEdgeService.validateBundle(bundleId, bundleVersion);
      
      res.status(200).json({
        success: true,
        message: 'Bundle validation initiated',
        data: result
      });
    } catch (error) {
      logger.error('Error validating bundle', { 
        bundleId: req.params.bundleId,
        bundleVersion: req.params.bundleVersion,
        error: error.message 
      });
      res.status(500).json({
        success: false,
        message: 'Failed to validate bundle',
        error: error.message
      });
    }
  }

  /**
   * Update bundle after content upload
   */
  async updateBundleAfterUpload(req, res) {
    try {
      const { bundleId, bundleVersion } = req.params;
      
      const result = await flytEdgeService.updateBundleAfterUpload(bundleId, bundleVersion);
      
      res.status(200).json({
        success: true,
        message: 'Bundle updated successfully',
        data: result
      });
    } catch (error) {
      logger.error('Error updating bundle', { 
        bundleId: req.params.bundleId,
        bundleVersion: req.params.bundleVersion,
        error: error.message 
      });
      res.status(500).json({
        success: false,
        message: 'Failed to update bundle',
        error: error.message
      });
    }
  }

  /**
   * Create bundle with data from local ThalesFlytEdge_Data
   */
  async createBundleFromLocal(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { bundleName, airline, service, version, description } = req.body;
      
      // Get metadata from local bundle
      const metadata = await flytEdgeService.getBundleMetadata(bundleName);
      
      const bundleData = {
        airline,
        service,
        name: bundleName,
        version,
        description: description || `Bundle for ${metadata.movieData.name[0]['@value']}`
      };

      const result = await flytEdgeService.createBundle(bundleData);
      
      // Save bundle info with local metadata
      // await this.saveBundleInfo(result, bundleData, metadata);
      
      res.status(201).json({
        success: true,
        message: 'Bundle created from local data successfully',
        data: {
          flytEdgeResponse: result,
          localMetadata: metadata
        }
      });
    } catch (error) {
      logger.error('Error creating bundle from local data', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Failed to create bundle from local data',
        error: error.message
      });
    }
  }

  /**
   * Save bundle information locally
   */
  async saveBundleInfo(flytEdgeResponse, bundleData, localMetadata = null) {
    try {
      const bundleInfoPath = path.join(__dirname, '../../data/bundles');
      
      // Ensure directory exists
      await fs.mkdir(bundleInfoPath, { recursive: true });
      
      const bundleInfo = {
        bundleId: flytEdgeResponse.bundleId,
        bundleData,
        flytEdgeResponse,
        localMetadata,
        createdAt: new Date().toISOString()
      };
      
      const fileName = `${bundleData.name}_${bundleData.version}.json`;
      const filePath = path.join(bundleInfoPath, fileName);
      
      await fs.writeFile(filePath, JSON.stringify(bundleInfo, null, 2));
      
      logger.info('Bundle info saved locally', { 
        bundleId: flytEdgeResponse.bundleId,
        filePath 
      });
    } catch (error) {
      logger.error('Error saving bundle info', { error: error.message });
      // Don't throw here as this is not critical for the main operation
    }
  }

  /**
   * Get saved bundle information
   */
  async getSavedBundles(req, res) {
    try {
      const bundleInfoPath = path.join(__dirname, '../../data/bundles');
      
      try {
        const files = await fs.readdir(bundleInfoPath);
        const bundles = [];
        
        for (const file of files) {
          if (file.endsWith('.json')) {
            const filePath = path.join(bundleInfoPath, file);
            const data = await fs.readFile(filePath, 'utf8');
            bundles.push(JSON.parse(data));
          }
        }
        
        res.status(200).json({
          success: true,
          data: {
            bundles,
            count: bundles.length
          }
        });
      } catch (error) {
        if (error.code === 'ENOENT') {
          res.status(200).json({
            success: true,
            data: {
              bundles: [],
              count: 0
            }
          });
        } else {
          throw error;
        }
      }
    } catch (error) {
      logger.error('Error getting saved bundles', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve saved bundles',
        error: error.message
      });
    }
  }
}

module.exports = new BundleController();
