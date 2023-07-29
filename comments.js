// Create web server
var http = require('http');
var url = require('url');
var fs = require('fs');
var qs = require('querystring');
var comments = require('./comments');

function sendResponse(response, statusCode, headers, data) {
  response.writeHead(statusCode, headers);
  response.end(data);
}

function serveStaticFile(response, cache, absPath) {
  if (cache[absPath]) {
    sendResponse(response, 200, {}, cache[absPath]);
  } else {
    fs.exists(absPath, function(exists) {
      if (exists) {
        fs.readFile(absPath, function(error, data) {
          if (error) {
            sendResponse(response, 500, {}, error);
          } else {
            cache[absPath] = data;
            sendResponse(response, 200, {}, data);
          }
        });
      } else {
        sendResponse(response, 404, {}, 'File not found');
      }
    });
  }
}

function createServer() {
  var cache = {};
  var server = http.createServer(function(request, response) {
    var pathName = url.parse(request.url).pathname;
    var absPath = './' + pathName;
    if (pathName === '/comments') {
      if (request.method === 'GET') {
        sendResponse(response, 200, {}, JSON.stringify(comments.get()));
      } else if (request.method === 'POST') {
        var body = '';
        request.on('data', function(data) {
          body += data;
        });
        request.on('end', function() {
          var comment = qs.parse(body);
          comments.add(comment);
          sendResponse(response, 200, {}, JSON.stringify(comment));
        });
      }
    } else {
      serveStaticFile(response, cache, absPath);
    }
  });
  return server;
}

module.exports = createServer;