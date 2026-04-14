const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Exclude Replit's internal .local directory from Metro's file watcher.
// Metro's FallbackWatcher crashes on transient temp files (workflow logs,
// skill temp files) that appear and vanish mid-watch.
config.resolver.blockList = [
  /\/\.local\/.*/,
  /\/\.git\/.*/,
];

module.exports = config;
