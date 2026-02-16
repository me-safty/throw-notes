const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Required for pnpm's symlinked node_modules layout.
config.resolver.unstable_enableSymlinks = true;

module.exports = config;
