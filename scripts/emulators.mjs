import { execFile, spawn, spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const action = process.argv[2];
if (!['start', 'integration', 'm0', 'acceptance'].includes(action)) throw new Error('Unknown emulator action');
const configDir = path.resolve('work/runtime/firebase-config');
mkdirSync(configDir, { recursive: true });
const taskEnvironment = { ...process.env, XDG_CONFIG_HOME: configDir, FIREBASE_CLI_DISABLE_UPDATE_CHECK: 'true' };
if (process.platform === 'win32') {
  // Oracle javapath can launch a second JVM that outlives the CLI's original child.
  // Resolve the installed runtime without changing the user's PATH or Java installation.
  const settings = spawnSync('java', ['-XshowSettings:properties', '-version'], { encoding: 'utf8', windowsHide: true, timeout: 10000 });
  const javaHome = settings.stderr?.match(/^\s*java\.home = (.+)$/m)?.[1].trim();
  if (javaHome) {
    const pathKey = Object.keys(taskEnvironment).find(key => key.toLowerCase() === 'path') ?? 'PATH';
    taskEnvironment[pathKey] = path.join(javaHome, 'bin') + path.delimiter + (taskEnvironment[pathKey] ?? '');
  }
}
const args = [
  'node_modules/firebase-tools/lib/bin/firebase.js',
  '--config', 'firebase.emulators.json',
  action === 'start' ? 'emulators:start' : 'emulators:exec',
  '--only', 'auth,database', '--project', 'demo-merchants-bluff',
];
if (action !== 'start') args.push(action === 'integration' ? 'npm run test:integration' : 'npm run test:integration && npm run test:e2e');
const child = spawn(process.execPath, args, {
  stdio: 'inherit', windowsHide: true,
  env: taskEnvironment,
});
child.on('error', error => { console.error(error.message); process.exitCode = 1; });
child.on('exit', async code => {
  // Some Windows/Java emulator shutdowns leave their own child listening after CLI exit.
  // Match this CLI's exact parent PID and emulator jar; never stop a pre-existing service.
  if (process.platform === 'win32' && child.pid) {
    const command = `$taskOrphanEmulators = @(Get-CimInstance Win32_Process -Filter 'ParentProcessId = ${child.pid}' | Where-Object { $_.CommandLine -like '*firebase-database-emulator-v*.jar*' -and $_.CommandLine -match '--port 19000(?: |$)' }); $taskOrphanEmulators | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction Stop }; Write-Output $taskOrphanEmulators.Count`;
    await new Promise(resolve => execFile('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', command],
      { windowsHide: true, timeout: 10000 }, (error, stdout) => {
        writeFileSync(path.resolve('work/runtime/emulator-cleanup.json'), JSON.stringify({ cliPid: child.pid, matches: stdout.trim(), error: error?.message ?? null }));
        resolve();
      }));
  }
  process.exitCode = code ?? 1;
});
process.on('SIGINT', () => { if (child.exitCode === null) child.kill('SIGINT'); });
