const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger');

class FlytEdgeService {
  constructor() {
    this.baseUrl = process.env.FLYTEDGE_API_BASE_URL;
    this.apiKey = process.env.FLYTEDGE_API_KEY;
    this.organization = process.env.FLYTEDGE_ORGANIZATION;
    
    if (!this.baseUrl || !this.apiKey || !this.organization) {
      throw new Error('FlytEdge configuration missing. Please check FLYTEDGE_API_BASE_URL, FLYTEDGE_API_KEY, and FLYTEDGE_ORGANIZATION in .env');
    }
  }

  /**
   * Get bundle names from ThalesFlytEdge_Data directory
   */
  async getBundleNames() {
    try {
      const dataPath = path.join(__dirname, '../../ThalesFlytEdge_Data');
      const entries = await fs.readdir(dataPath, { withFileTypes: true });
      
      const bundles = entries
        .filter(entry => entry.isDirectory())
        .map(entry => entry.name);
      
      logger.info('Retrieved bundle names', { bundles });
      return bundles;
    } catch (error) {
      logger.error('Error retrieving bundle names', { error: error.message });
      throw error;
    }
  }

  /**
   * Get bundle metadata from feed JSON file
   */
  async getBundleMetadata(bundleName) {
    try {
      // First try the exact bundle name
      let feedPath = path.join(__dirname, '../../ThalesFlytEdge_Data', bundleName, 'feed', `${bundleName}-movie.json`);
      
      // If not found, try case-insensitive search
      if (!await this.fileExists(feedPath)) {
        const dataPath = path.join(__dirname, '../../ThalesFlytEdge_Data');
        const entries = await fs.readdir(dataPath, { withFileTypes: true });
        
        // Find directory that matches case-insensitively
        const dirEntry = entries.find(entry => 
          entry.isDirectory() && entry.name.toLowerCase() === bundleName.toLowerCase()
        );
        
        if (dirEntry) {
          const actualBundleName = dirEntry.name;
          feedPath = path.join(__dirname, '../../ThalesFlytEdge_Data', actualBundleName, 'feed', `${actualBundleName}-movie.json`);
        }
      }
      
      const feedData = await fs.readFile(feedPath, 'utf8');
      const metadata = JSON.parse(feedData);
      
      return {
        name: bundleName,
        movieData: metadata.dataFeedElement[0],
        feedPath
      };
    } catch (error) {
      logger.error('Error reading bundle metadata', { bundleName, error: error.message });
      throw error;
    }
  }
  
  /**
   * Check if a file exists
   */
  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Create a new bundle on FlytEdge
   */
  async createBundle(bundleData) {
    try {
      const url = `${this.baseUrl}/publication/bundles?orga=${this.organization}`;
      
      const response = await axios.post(url, bundleData, {
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json',
          'X-Api-Key': this.apiKey
        }
      });

      logger.info('Bundle created successfully', { 
        bundleId: response.data.bundleId,
        bundleName: bundleData.name 
      });
      
      return response.data;
    } catch (error) {
      logger.error('Error creating bundle', { 
        error: error.message,
        response: error.response?.data 
      });
      throw error;
    }
  }

  /**
   * Create a new version of an existing bundle
   */
  async createBundleVersion(bundleData) {
    return this.createBundle(bundleData);
  }

  /**
   * Create a new bundle from an existing one
   */
  async createBundleFromExisting(bundleData, copyFrom) {
    try {
      const bundleDataWithCopy = {
        ...bundleData,
        copyFrom
      };

      return this.createBundle(bundleDataWithCopy);
    } catch (error) {
      logger.error('Error creating bundle from existing', { error: error.message });
      throw error;
    }
  }

  /**
   * Retrieve a Shared Access Signature for a bundle
   */
  async getBundleSAS(bundleId, bundleVersion) {
    try {
      const url = `${this.baseUrl}/publication/bundles/${bundleId}/versions/${bundleVersion}/token`;
      
      const response = await axios.get(url, {
        headers: {
          'X-Api-Key': this.apiKey
        }
      });

      logger.info('Retrieved SAS token', { bundleId, bundleVersion });
      return response.data;
    } catch (error) {
      logger.error('Error retrieving SAS token', { 
        bundleId, 
        bundleVersion, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Validate/Publish a bundle
   */
  async validateBundle(bundleId, bundleVersion) {
    try {
      const url = `${this.baseUrl}/publication/bundles/${bundleId}/versions/${bundleVersion}/publish`;
      
      const response = await axios.post(
        url,
        {}, // Empty body
        {
          headers: {
            'X-Api-Key': this.apiKey,
            'Content-Type': 'application/json'
          }
        }
      );

      logger.info('Bundle validation initiated', { bundleId, bundleVersion });
      return response.data;
    } catch (error) {
      logger.error('Error validating bundle', { 
        bundleId, 
        bundleVersion, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Update bundle after content upload
   */
  async updateBundleAfterUpload(bundleId, bundleVersion) {
    try {
      const url = `${this.baseUrl}/publication/bundles/${bundleId}/versions/${bundleVersion}/update`;
      
      const response = await axios.post(url, {}, {
        headers: {
          'accept': '*/*',
          'X-Api-Key': this.apiKey
        }
      });

      logger.info('Bundle updated after upload', { bundleId, bundleVersion });
      return response.data;
    } catch (error) {
      logger.error('Error updating bundle after upload', { 
        bundleId, 
        bundleVersion, 
        error: error.message 
      });
      throw error;
    }
  }
}

module.exports = new FlytEdgeService();
