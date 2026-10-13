import 'dotenv/config';
import app from './app.js';

const port = process.env.PORT || 5000;

const server = app.listen(port, (err) => {
  if (err) {
    console.error('Server failed to start:', err);
    process.exit(1);
  }
  console.log(`API running on http://localhost:${port}`);
});

server.on('error', (err) => {
  console.error('Server error:', err.code, err.message);
  process.exit(1);
});

process.on('unhandledRejection', (e) => console.error('Unhandled rejection:', e));
process.on('uncaughtException', (e) => console.error('Uncaught exception:', e));