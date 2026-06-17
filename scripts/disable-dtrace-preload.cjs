// Preload script for local EAS builds. bunyan's optional dtrace-provider integration
// crashes on recent Node/macOS when the module loads but createDTraceProvider is missing.
const Module = require('module');

const originalRequire = Module.prototype.require;
Module.prototype.require = function patchedRequire(request, ...args) {
  if (request === 'dtrace-provider') {
    throw new Error('dtrace-provider disabled for local EAS builds');
  }
  return originalRequire.call(this, request, ...args);
};
