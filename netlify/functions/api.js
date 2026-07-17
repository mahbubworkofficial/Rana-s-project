const serverless = require("serverless-http");
const app = require("../../rana_server/index.js");

// Wrap the Express app for Netlify
module.exports.handler = serverless(app, { basePath: '/api' });
