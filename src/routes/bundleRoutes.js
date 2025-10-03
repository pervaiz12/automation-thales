const express = require('express');
const { body, param } = require('express-validator');
const bundleController = require('../controllers/bundleController');

const router = express.Router();

/**
 * @route GET /bundles/names
 * @description Get all available bundle names from ThalesFlytEdge_Data directory
 * @returns {Object} List of bundle names
 */
router.get('/bundles/names', bundleController.getBundleNames);

/**
 * @route GET /bundles/:bundleName/metadata
 * @description Get metadata for a specific bundle
 * @param {string} bundleName - Name of the bundle
 * @returns {Object} Bundle metadata including movie information
 */
router.get(
  '/bundles/:bundleName/metadata',
  [
    param('bundleName')
      .notEmpty()
      .withMessage('Bundle name is required')
      .isString()
      .withMessage('Bundle name must be a string')
  ],
  bundleController.getBundleMetadata
);

/**
 * @route POST /bundles/create
 * @description Create a new bundle on FlytEdge
 * @body {string} airline - Destination airline
 * @body {string} service - Service name
 * @body {string} name - Bundle name
 * @body {string} version - Bundle version
 * @body {string} description - Bundle description
 * @returns {Object} FlytEdge bundle creation response
 */
router.post(
  '/bundles/create',
  [
    body('airline')
      .notEmpty()
      .withMessage('Airline is required')
      .isString()
      .withMessage('Airline must be a string'),
    body('service')
      .notEmpty()
      .withMessage('Service is required')
      .isString()
      .withMessage('Service must be a string'),
    body('name')
      .notEmpty()
      .withMessage('Bundle name is required')
      .isString()
      .withMessage('Bundle name must be a string'),
    body('version')
      .notEmpty()
      .withMessage('Version is required')
      .matches(/^\d+\.\d+(\.\d+)?$/)
      .withMessage('Version must be in format X.Y or X.Y.Z'),
    body('description')
      .notEmpty()
      .withMessage('Description is required')
      .isString()
      .withMessage('Description must be a string')
  ],
  bundleController.createBundle
);

/**
 * @route POST /bundles/create-version
 * @description Create a new version of an existing bundle
 * @body {string} airline - Destination airline
 * @body {string} service - Service name
 * @body {string} name - Bundle name
 * @body {string} version - New version number
 * @body {string} description - Version description
 * @returns {Object} FlytEdge bundle version creation response
 */
router.post(
  '/bundles/create-version',
  [
    body('airline')
      .notEmpty()
      .withMessage('Airline is required')
      .isString()
      .withMessage('Airline must be a string'),
    body('service')
      .notEmpty()
      .withMessage('Service is required')
      .isString()
      .withMessage('Service must be a string'),
    body('name')
      .notEmpty()
      .withMessage('Bundle name is required')
      .isString()
      .withMessage('Bundle name must be a string'),
    body('version')
      .notEmpty()
      .withMessage('Version is required')
      .matches(/^\d+\.\d+(\.\d+)?$/)
      .withMessage('Version must be in format X.Y or X.Y.Z'),
    body('description')
      .notEmpty()
      .withMessage('Description is required')
      .isString()
      .withMessage('Description must be a string')
  ],
  bundleController.createBundleVersion
);

/**
 * @route POST /bundles/create-from-existing
 * @description Create a new bundle from an existing one
 * @body {string} airline - Destination airline
 * @body {string} service - Service name
 * @body {string} name - Bundle name
 * @body {string} version - New version number
 * @body {string} description - Version description
 * @body {Object} copyFrom - Source bundle information
 * @body {string} copyFrom.id - Existing bundle ID
 * @body {string} copyFrom.version - Existing bundle version
 * @returns {Object} FlytEdge bundle creation response
 */
router.post(
  '/bundles/create-from-existing',
  [
    body('airline')
      .notEmpty()
      .withMessage('Airline is required')
      .isString()
      .withMessage('Airline must be a string'),
    body('service')
      .notEmpty()
      .withMessage('Service is required')
      .isString()
      .withMessage('Service must be a string'),
    body('name')
      .notEmpty()
      .withMessage('Bundle name is required')
      .isString()
      .withMessage('Bundle name must be a string'),
    body('version')
      .notEmpty()
      .withMessage('Version is required')
      .matches(/^\d+\.\d+(\.\d+)?$/)
      .withMessage('Version must be in format X.Y or X.Y.Z'),
    body('description')
      .notEmpty()
      .withMessage('Description is required')
      .isString()
      .withMessage('Description must be a string'),
    body('copyFrom.id')
      .notEmpty()
      .withMessage('copyFrom.id is required')
      .isString()
      .withMessage('copyFrom.id must be a string'),
    body('copyFrom.version')
      .notEmpty()
      .withMessage('copyFrom.version is required')
      .isString()
      .withMessage('copyFrom.version must be a string')
  ],
  bundleController.createBundleFromExisting
);

/**
 * @route POST /bundles/create-from-local
 * @description Create a bundle using data from local ThalesFlytEdge_Data directory
 * @body {string} bundleName - Name of the local bundle (must exist in ThalesFlytEdge_Data)
 * @body {string} airline - Destination airline
 * @body {string} service - Service name
 * @body {string} version - Bundle version
 * @body {string} description - Optional description (will use movie title if not provided)
 * @returns {Object} FlytEdge bundle creation response with local metadata
 */
router.post(
  '/bundles/create-from-local',
  [
    body('bundleName')
      .notEmpty()
      .withMessage('Bundle name is required')
      .isString()
      .withMessage('Bundle name must be a string'),
    body('airline')
      .notEmpty()
      .withMessage('Airline is required')
      .isString()
      .withMessage('Airline must be a string'),
    body('service')
      .notEmpty()
      .withMessage('Service is required')
      .isString()
      .withMessage('Service must be a string'),
    body('version')
      .notEmpty()
      .withMessage('Version is required')
      .matches(/^\d+\.\d+(\.\d+)?$/)
      .withMessage('Version must be in format X.Y or X.Y.Z'),
    body('description')
      .optional()
      .isString()
      .withMessage('Description must be a string')
  ],
  bundleController.createBundleFromLocal
);

/**
 * @route GET /bundles/:bundleId/versions/:bundleVersion/sas
 * @description Get Shared Access Signature for a bundle
 * @param {string} bundleId - Bundle ID
 * @param {string} bundleVersion - Bundle version
 * @returns {Object} SAS token and Azure Blob Storage information
 */
router.get(
  '/bundles/:bundleId/versions/:bundleVersion/sas',
  [
    param('bundleId')
      .notEmpty()
      .withMessage('Bundle ID is required')
      .isString()
      .withMessage('Bundle ID must be a string'),
    param('bundleVersion')
      .notEmpty()
      .withMessage('Bundle version is required')
      .isString()
      .withMessage('Bundle version must be a string')
  ],
  bundleController.getBundleSAS
);

/**
 * @route POST /bundles/:bundleId/versions/:bundleVersion/validate
 * @description Validate/Publish a bundle
 * @param {string} bundleId - Bundle ID
 * @param {string} bundleVersion - Bundle version
 * @returns {Object} Validation result
 */
router.post(
  '/bundles/:bundleId/versions/:bundleVersion/validate',
  [
    param('bundleId')
      .notEmpty()
      .withMessage('Bundle ID is required')
      .isString()
      .withMessage('Bundle ID must be a string'),
    param('bundleVersion')
      .notEmpty()
      .withMessage('Bundle version is required')
      .isString()
      .withMessage('Bundle version must be a string')
  ],
  bundleController.validateBundle
);

/**
 * @route POST /bundles/:bundleId/versions/:bundleVersion/update
 * @description Update bundle after content upload
 * @param {string} bundleId - Bundle ID
 * @param {string} bundleVersion - Bundle version
 * @returns {Object} Update result
 */
router.post(
  '/bundles/:bundleId/versions/:bundleVersion/update',
  [
    param('bundleId')
      .notEmpty()
      .withMessage('Bundle ID is required')
      .isString()
      .withMessage('Bundle ID must be a string'),
    param('bundleVersion')
      .notEmpty()
      .withMessage('Bundle version is required')
      .isString()
      .withMessage('Bundle version must be a string')
  ],
  bundleController.updateBundleAfterUpload
);

/**
 * @route GET /bundles/saved
 * @description Get all locally saved bundle information
 * @returns {Object} List of saved bundles
 */
router.get('/bundles/saved', bundleController.getSavedBundles);

module.exports = router;
