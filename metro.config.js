const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Ensure .cjs files are handled (needed by some packages)
config.resolver.sourceExts.push('cjs');

module.exports = config;
