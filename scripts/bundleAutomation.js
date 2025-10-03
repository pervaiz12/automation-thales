const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);
require('dotenv').config();

// Configuration
// Configuration
const config = {
  baseUrl: process.env.API_BASE_URL || 'http://localhost:3005/api',
  apiKey: process.env.API_KEY || 'xKpkGeaId9SVXyAzIvQSdJ1NopbIzzCFA6Sp3RXN05tavuxuq1iUycCycpu1st0Y',
  // Bundle configuration
  baseBundleName: 'TheUnholyTrinity',  // Base name for the bundle
  airline: 'THL',
  service: 'media-server',
  version: '1.0',
  description: 'Test bundle created via automation script',
  // Add a timestamp to make the bundle name unique
  get bundleName() {
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
    return `${this.baseBundleName}_${timestamp}`;
  }
};

// Create Axios instance with default headers
const api = axios.create({
  baseURL: config.baseUrl,
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': config.apiKey
  },
  validateStatus: () => true // Don't throw on HTTP error status codes
});

class BundleAutomation {
  constructor() {
    this.bundleId = null;
    this.bundleVersion = config.version;
    this.uploadUrl = null;
  }

  async run() {
    try {
      console.log('🚀 Starting bundle automation...');
      
      // Step 1: Check existing bundles
      const existingBundles = await this.listBundles();
      const existingBundle = existingBundles.find(b => b.name === config.bundleName);
      
      if (existingBundle) {
        console.log(`ℹ️ Using existing bundle: ${existingBundle.id} (${existingBundle.name})`);
        this.bundleId = existingBundle.id;
      } else {
        // Step 2: Create a new bundle if it doesn't exist
        await this.createBundle();
      }
      
      // Step 3: Get SAS token for upload
      await this.getSasToken();
      
      // Step 4: Upload content (placeholder - implement your upload logic)
      await this.uploadContent();
      
      // Step 5: Update bundle status after upload
      await this.updateBundleAfterUpload();
      
      // Step 6: Validate/Publish the bundle
      await this.validateBundle();
      
      console.log('✅ Bundle automation completed successfully!');
    } catch (error) {
      console.error('❌ Error in bundle automation:', error.message);
      process.exit(1);
    }
  }

  async createBundle() {
    console.log('🔄 Creating new bundle...');
    let attempts = 0;
    const maxAttempts = 3;
    
    while (attempts < maxAttempts) {
      try {
        const response = await api.post('/bundles/create-from-local', {
          bundleName: config.baseBundleName,  // Use the base name without timestamp
          airline: config.airline,
          service: config.service,
          version: this.bundleVersion,
          description: config.description
        });
console.log()
        console.log('Create bundle response status:', response.status);
        
        if (response.status === 409) {
          // If bundle already exists, try with a different version
          console.log('⚠️  Bundle already exists, trying with a new version...');
          const versionParts = this.bundleVersion.split('.');
          versionParts[versionParts.length - 1] = (parseInt(versionParts[versionParts.length - 1]) + 1).toString();
          this.bundleVersion = versionParts.join('.');
          attempts++;
          continue;
        }

        if (!response.data.success) {
          throw new Error(`Failed to create bundle: ${response.data.message || 'Unknown error'}`);
        }

        // The bundle ID is in response.data.data.flytEdgeResponse.bundleId
        this.bundleId = response.data.data?.flytEdgeResponse?.bundleId;
        if (!this.bundleId) {
          console.error('Full response:', JSON.stringify(response.data, null, 2));
          throw new Error('No bundle ID found in the response');
        }

        console.log(`✅ Created bundle with ID: ${this.bundleId}`);
        return; // Success, exit the loop
      } catch (error) {
        attempts++;
        if (attempts >= maxAttempts) {
          console.error(`❌ Failed after ${maxAttempts} attempts:`, error.message);
          throw error;
        }
        console.log(`⚠️  Attempt ${attempts} failed, retrying...`);
      }
    }
    
    throw new Error(`Failed to create bundle after ${maxAttempts} attempts`);
  }

  async getSasToken() {
    try {
      console.log('🔑 Getting SAS token for upload...');
      console.log(`Bundle ID: ${this.bundleId}, Version: ${this.bundleVersion}`);
      
      const response = await api.get(
        `/bundles/${this.bundleId}/versions/${this.bundleVersion}/sas`
      );

      console.log('SAS token response:', JSON.stringify(response.data, null, 2));

      if (!response.data.success) {
        throw new Error(`Failed to get SAS token: ${response.data.message || 'Unknown error'}`);
      }

      // Use blobSASUrl from the response
      this.uploadUrl = response.data.data?.blobSASUrl;
      if (!this.uploadUrl) {
        console.error('No blobSASUrl in response. Available data:', 
          Object.keys(response.data.data || {}).join(', '));
        throw new Error('No blobSASUrl returned in response');
      }

      console.log('✅ Got SAS token and upload URL');
      console.log(`Upload URL: ${this.uploadUrl.substring(0, 100)}...`);
      
      return this.uploadUrl;
    } catch (error) {
      console.error('Error in getSasToken:', error.message);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
      throw error;
    }
  }

  async listBundles() {
    try {
      console.log('🔍 Listing existing bundles...');
      const response = await api.get('/bundles/saved');
      
      if (!response.data.success) {
        throw new Error(`Failed to list bundles: ${response.data.message || 'Unknown error'}`);
      }
      
      const bundles = response.data.data?.bundles || [];
      console.log(`ℹ️ Found ${bundles.length} existing bundles`);
      return bundles;
    } catch (error) {
      console.error('Error listing bundles:', error.message);
      return [];
    }
  }

  async uploadContent() {
    try {
      console.log('📤 Preparing to upload bundle content...');
      
      // Get the bundle directory
      const dataRoot = path.join(__dirname, '..', 'ThalesFlytEdge_Data');
      let bundleDir = path.join(dataRoot, config.baseBundleName);
      
      // If the expected bundle directory doesn't exist, attempt to find a close match
      try {
        await fs.access(bundleDir);
      } catch (_) {
        const entries = await fs.readdir(dataRoot, { withFileTypes: true });
        const candidates = entries
          .filter((e) => e.isDirectory())
          .map((e) => e.name)
          .filter((name) => name.toLowerCase().includes(config.baseBundleName.toLowerCase()));
        if (candidates.length > 0) {
          bundleDir = path.join(dataRoot, candidates[0]);
        }
      }
      
      try {
        await fs.access(bundleDir);
      } catch (error) {
        throw new Error(`Bundle directory not found at ${bundleDir}. Please ensure the bundle exists.`);
      }
      
      console.log(`📂 Bundle directory: ${bundleDir}`);
      console.log(`🧩 Bundle folder name: ${path.basename(bundleDir)}`);
      
      // Ensure AzCopy is installed and show version
      try {
        const { stdout } = await execAsync('azcopy --version');
        console.log(`🔧 AzCopy version: ${stdout.trim().split('\n')[0]}`);
      } catch (e) {
        throw new Error('AzCopy CLI is not installed or not available in PATH. Please install AzCopy and try again.');
      }

      // Run AzCopy command to upload recursively with MD5 and correct mime types
      const azCopyCmd = `azcopy cp "./*" "${this.uploadUrl}" --put-md5 --recursive --no-guess-mime-type=false`;
      console.log(`⬆️  Running: ${azCopyCmd}`);
      try {
        const { stdout, stderr } = await execAsync(azCopyCmd, { cwd: bundleDir, maxBuffer: 1024 * 1024 * 50 });
        if (stdout) console.log(stdout.trim());
        if (stderr) console.error(stderr.trim());
      } catch (e) {
        console.error('❌ AzCopy upload failed:', e.message);
        if (e.stdout) console.error('Stdout:', e.stdout);
        if (e.stderr) console.error('Stderr:', e.stderr);
        throw e;
      }

      console.log('🎉 AzCopy upload completed successfully!');
      
    } catch (error) {
      console.error('❌ Error in uploadContent:', error.message);
      throw error;
    }
  }
  
  /**
   * Recursively list all files in a directory
   */
  async listFilesRecursively(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const files = [];
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        files.push(...(await this.listFilesRecursively(fullPath)));
      } else {
        files.push(fullPath);
      }
    }
    
    return files;
  }
  
  /**
   * Get content type based on file extension
   */
  getContentType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const contentTypes = {
      '.json': 'application/json',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.mp4': 'video/mp4',
      '.mp3': 'audio/mpeg',
      '.pdf': 'application/pdf',
      '.txt': 'text/plain',
      '.xml': 'application/xml',
      '.zip': 'application/zip',
      '.js': 'application/javascript',
      '.css': 'text/css',
      '.html': 'text/html',
      '.htm': 'text/html'
    };
    
    return contentTypes[ext] || 'application/octet-stream';
  }

  async updateBundleAfterUpload() {
    console.log('🔄 Updating bundle status after upload...');
    const response = await api.post(
      `/bundles/${this.bundleId}/versions/${this.bundleVersion}/update`
    );

    if (!response.data.success) {
      throw new Error(`Failed to update bundle: ${response.data.message}`);
    }

    console.log('✅ Bundle updated successfully');
  }

  async validateBundle() {
    console.log('✅ Validating bundle...');
    const response = await api.post(
      `/bundles/${this.bundleId}/versions/${this.bundleVersion}/validate`
    );

    if (!response.data.success) {
      throw new Error(`Validation failed: ${response.data.message}`);
    }

    console.log('✅ Bundle validated successfully');
  }
}

// Run the automation
const automation = new BundleAutomation();
automation.run().catch(console.error);
