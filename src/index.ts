import { startCLI } from './chat/cli.js';

startCLI().catch((error) => {
  console.error('Error starting CLI:', error.message);
  process.exit(1);
});
