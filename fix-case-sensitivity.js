/**
 * Case Sensitivity Fix for Next.js on Windows
 * 
 * This script normalizes all paths to lowercase BEFORE Next.js starts.
 * It patches Node.js path resolution to ensure consistent casing.
 * 
 * Loaded via NODE_OPTIONS="--require ./fix-case-sensitivity.js"
 */

const path = require('path');
const Module = require('module');

// Normalize any Windows path to lowercase
function normalizePath(pathStr) {
  if (!pathStr || typeof pathStr !== 'string') return pathStr;
  // Normalize Windows drive paths to lowercase
  // Only normalize the drive letter and first part of path
  return pathStr.replace(/^([A-Z]):(.*)/g, (match, drive, rest) => {
    return drive.toLowerCase() + ':' + rest.toLowerCase();
  });
}

// Store original methods
const originalResolve = path.resolve;
const originalJoin = path.join;
const originalNormalize = path.normalize;
const originalCwd = process.cwd;
const originalRequireResolve = Module._resolveFilename;

// Patch path.resolve to always return lowercase paths
path.resolve = function(...args) {
  const result = originalResolve.apply(this, args);
  return normalizePath(result);
};

// Patch path.join to normalize results
path.join = function(...args) {
  const result = originalJoin.apply(this, args);
  return normalizePath(result);
};

// Patch path.normalize to normalize results  
path.normalize = function(pathStr) {
  const result = originalNormalize.call(this, pathStr);
  return normalizePath(result);
};

// Patch process.cwd() to return lowercase
process.cwd = function() {
  return normalizePath(originalCwd.call(this));
};

// Patch Module._resolveFilename to normalize resolved paths
Module._resolveFilename = function(...args) {
  const result = originalRequireResolve.apply(this, args);
  return normalizePath(result);
};

// Patch require.resolve to normalize paths
const originalRequireResolvePublic = require.resolve;
require.resolve = function(...args) {
  const result = originalRequireResolvePublic.apply(this, args);
  return normalizePath(result);
};

// Ensure __dirname and __filename are normalized if available
if (typeof __dirname !== 'undefined') {
  try {
    global.__dirname = normalizePath(__dirname);
  } catch (e) {
    // Ignore if can't modify
  }
}
if (typeof __filename !== 'undefined') {
  try {
    global.__filename = normalizePath(__filename);
  } catch (e) {
    // Ignore if can't modify
  }
}

// Log that the fix is active (only once)
if (!global.__caseFixActive) {
  console.log('[Case Fix] Path normalization active - all paths will be lowercase');
  global.__caseFixActive = true;
}
