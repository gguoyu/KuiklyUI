const { existsSync, readFileSync, statSync } = require('fs');
const { extname, join } = require('path');

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.css': 'text/css',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.wasm': 'application/wasm',
  '.pag': 'application/octet-stream',
  '.map': 'application/json',
  '.woff2': 'font/woff2',
};

function getMimeType(filePath) {
  return MIME_TYPES[extname(filePath).toLowerCase()] || 'application/octet-stream';
}

function isFile(filePath) {
  return existsSync(filePath) && statSync(filePath).isFile();
}

function findFirstFile(paths) {
  for (const filePath of paths) {
    if (isFile(filePath)) {
      return filePath;
    }
  }
  return null;
}

function applyCorsHeaders(res, includePreflight = false) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (includePreflight) {
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  }
}

function writeCorsResponse(res, statusCode, headers = {}) {
  res.writeHead(statusCode, {
    ...headers,
    'Access-Control-Allow-Origin': '*',
  });
}

function sendJson(res, statusCode, body) {
  writeCorsResponse(res, statusCode, {
    'Content-Type': 'application/json',
  });
  res.end(JSON.stringify(body));
}

function sendText(res, statusCode, body) {
  writeCorsResponse(res, statusCode, {
    'Content-Type': 'text/plain',
  });
  res.end(body);
}

function buildFontInjection(fontsDir) {
  const fontFile = join(fontsDir, 'NotoSansSC-Regular.woff2');
  if (!isFile(fontFile)) {
    return '';
  }

  return `<style>
  @font-face {
    font-family: 'KuiklyTestFont';
    src: url('/fonts/NotoSansSC-Regular.woff2') format('woff2');
    font-display: block;
  }
  * { font-family: 'KuiklyTestFont', sans-serif !important; }
</style>`;
}

function transformIndexHtml(content, fontsDir) {
  let html = content.toString('utf-8');
  html = html.replace(/src="http:\/\/127\.0\.0\.1:8083\/nativevue2\.js"/g, 'src="nativevue2.js"');

  const fontInjection = buildFontInjection(fontsDir);
  if (fontInjection) {
    html = html.replace('</head>', `${fontInjection}\n</head>`);
  }

  return Buffer.from(html, 'utf-8');
}

function sendFile(res, filePath, fontsDir) {
  let content = readFileSync(filePath);
  if (filePath.endsWith('index.html')) {
    content = transformIndexHtml(content, fontsDir);
  }

  writeCorsResponse(res, 200, {
    'Content-Type': getMimeType(filePath),
  });
  res.end(content);
}

function handleNetworkMock(req, res, requestPath, port) {
  const requestUrl = req.url || requestPath;
  const url = new URL(requestUrl, `http://localhost:${port}`);

  if (requestPath === '/api/network/get') {
    sendJson(res, 200, {
      success: true,
      url: `http://localhost:${port}/api/network/get?key=${url.searchParams.get('key')}`,
      query: { key: url.searchParams.get('key') },
    });
    return true;
  }

  if (requestPath === '/api/network/get-binary') {
    sendText(res, 405, 'GET binary mock only supports status validation');
    return true;
  }

  if (requestPath === '/api/network/post') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      sendJson(res, 200, {
        success: true,
        url: `http://localhost:${port}/api/network/post`,
        json: body ? JSON.parse(body) : {},
      });
    });
    return true;
  }

  if (requestPath === '/api/network/post-binary') {
    const chunks = [];
    req.on('data', (chunk) => {
      chunks.push(chunk);
    });
    req.on('end', () => {
      writeCorsResponse(res, 200, {
        'Content-Type': 'application/octet-stream',
      });
      res.end(Buffer.concat(chunks));
    });
    return true;
  }

  if (requestPath === '/api/network/status/204') {
    writeCorsResponse(res, 204);
    res.end();
    return true;
  }

  return false;
}

module.exports = {
  applyCorsHeaders,
  findFirstFile,
  handleNetworkMock,
  sendFile,
};
