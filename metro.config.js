const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Ensure .svg is treated as an asset (not source code)
// Remove svg from sourceExts if present, add to assetExts
config.resolver.sourceExts = config.resolver.sourceExts.filter(ext => ext !== 'svg');
if (!config.resolver.assetExts.includes('svg')) {
  config.resolver.assetExts.push('svg');
}

module.exports = config;
