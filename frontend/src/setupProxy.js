const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:5000',
      changeOrigin: true,
      // Don't rewrite - keep /api in the path
      onError: (err, req, res) => {
        console.log('Proxy error:', err);
        res.status(500).json({ error: 'Proxy error: ' + err.message });
      }
    })
  );
};
