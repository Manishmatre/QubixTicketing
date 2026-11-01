import { spawn } from 'child_process';

console.log('\n======================================================');
console.log('🚀 Starting Godspeed Dedicated Ticketing Portal...');
console.log('📡 Backend: http://localhost:4060');
console.log('💻 Frontend: http://localhost:5174');
console.log('======================================================\n');

const isWindows = process.platform === 'win32';
const npmCmd = isWindows ? 'npm.cmd' : 'npm';

const server = spawn(npmCmd, ['--workspace=server', 'run', 'dev'], {
  stdio: 'inherit',
  shell: isWindows,
});

const client = spawn(npmCmd, ['--workspace=client', 'run', 'dev'], {
  stdio: 'inherit',
  shell: isWindows,
});

const shutdown = () => {
  try {
    server.kill();
    client.kill();
  } catch (e) {}
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

