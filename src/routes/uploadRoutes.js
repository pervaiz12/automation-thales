const express = require('express');
const { body } = require('express-validator');
const uploadController = require('../controllers/uploadController');

const router = express.Router();

/**
 * @route POST /upload-bundle
 * @description Upload a movie bundle to Azure Blob Storage
 * @body {string} localPath - Local path to the movie bundle directory
 * @body {string} version - Version number for the bundle
 * @returns {Object} Upload result with file count, total size, and file URLs
 */
router.post(
  '/upload-bundle',
  [
    body('localPath')
      .notEmpty()
      .withMessage('localPath is required')
      .isString()
      .withMessage('localPath must be a string'),
    body('version')
      .notEmpty()
      .withMessage('version is required')
      .matches(/^\d+\.\d+(\.\d+)?$/)
      .withMessage('version must be in format X.Y or X.Y.Z')
  ],
  uploadController.uploadBundle
);

module.exports = router;
