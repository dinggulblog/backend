#!/usr/bin/env node

/**
 * Module dependencies.
 */
import { readFileSync } from 'fs';
import app from '../../index.mjs';
import http from 'http';
import spdy from 'spdy';

/**
 * Get port from environment and store in Express.
 */
const port = normalizePort(process.env.PORT || '3000');
app.set('port', port);

/**
 * Create server and Listen on provided port, on all network interfaces.
 */
if (process.env.NODE_ENV === 'production') {
  // Get TSL certificate credentials.
  const options = {
    key: readFileSync('/etc/letsencrypt/live/dinggul.me/privkey.pem', 'utf8'),
    cert: readFileSync('/etc/letsencrypt/live/dinggul.me/fullchain.pem', 'utf8')
  }
  
  spdy.createServer(options, app).listen(port, () => console.log(app.get('port') + '(SSL) Port is listening!')).on('error', onError);
}
else {
  http.createServer(app).listen(port, () => console.log(app.get('port') + ' Port is listening!')).on('error', onError);
}

/**
 * Normalize a port into a number, string, or false.
 */
function normalizePort(val) {
  const port = parseInt(val, 10);

  if (isNaN(port)) {
    return val; // named pipe
  }

  if (port >= 0) {
    return port; // port number
  }

  return false;
}

/**
 * Event listener for HTTP server "error" event.
 */
function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  const bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
    default:
      throw error;
  }
}