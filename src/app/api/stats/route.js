import { NextResponse } from 'next/server';
import os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';
import { verifyAuth } from '@/lib/auth';

const execPromise = promisify(exec);

async function getStorageStats() {
  try {
    // Run df command for the uploads directory mounted in the container with a 2-second timeout
    const { stdout } = await execPromise('df -k /app/public/uploads', { timeout: 2000 });
    const lines = stdout.trim().split('\n');
    if (lines.length >= 2) {
      const lastLine = lines[lines.length - 1];
      const parts = lastLine.replace(/\s+/g, ' ').trim().split(' ');
      
      let totalKB = 0;
      let usedKB = 0;
      
      if (parts.length >= 6) {
        totalKB = parseInt(parts[1], 10);
        usedKB = parseInt(parts[2], 10);
      } else if (parts.length === 5) {
        totalKB = parseInt(parts[0], 10);
        usedKB = parseInt(parts[1], 10);
      }
      
      if (totalKB > 0) {
        // Convert KB to Decimal TB (1 TB = 10^12 bytes, and 1 KB = 1024 bytes)
        const totalTB = parseFloat((totalKB * 1024 / 1000000000000).toFixed(1));
        const usedTB = parseFloat((usedKB * 1024 / 1000000000000).toFixed(1));
        const percent = Math.round((usedKB / totalKB) * 100);
        
        return {
          used: usedTB,
          total: totalTB,
          percent: percent
        };
      }
    }
  } catch (err) {
    // Graceful fallback for Windows local development or envs where df is missing/times out
    console.warn('[STATS] df command failed or timed out, using fallback stats:', err.message);
  }
  
  return {
    used: 8.4,
    total: 16.0,
    percent: 52
  };
}

function getActualCPUUsage() {
  const cpus = os.cpus();
  let totalMs = 0;
  let idleMs = 0;
  for (const cpu of cpus) {
    for (const type in cpu.times) {
      totalMs += cpu.times[type];
    }
    idleMs += cpu.times.idle;
  }
  if (totalMs === 0) return 0;
  const usedMs = totalMs - idleMs;
  return Math.round((usedMs / totalMs) * 100);
}

export async function GET(request) {
  try {
    const user = verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const mockParam = searchParams.get('mock');
    const targetUrl = searchParams.get('url');
    const apiKey = searchParams.get('key');

    const isMock = mockParam !== 'false';

    // Real RAM Calculation
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMemPercent = Math.round(((totalMem - freeMem) / totalMem) * 100);

    if (!isMock) {
      // 1. Try querying custom Unraid API if URL is provided
      if (targetUrl) {
        try {
          const headers = {};
          if (apiKey) {
            headers['Authorization'] = `Bearer ${apiKey}`;
            headers['x-api-key'] = apiKey;
          }
          const response = await fetch(targetUrl, { headers, signal: AbortSignal.timeout(3000) });
          if (response.ok) {
            let data;
            try {
              data = await response.json();
            } catch (jsonErr) {
              return NextResponse.json(
                { error: `Ongeldige JSON-respons van custom API: ${jsonErr.message}` },
                { status: 502 }
              );
            }
            if (data && (data.storage || data.cpu !== undefined || data.ram !== undefined)) {
              return NextResponse.json({
                storage: data.storage || { used: 8.4, total: 16.0, percent: 52 },
                cpu: data.cpu !== undefined ? data.cpu : getActualCPUUsage(),
                ram: data.ram !== undefined ? data.ram : usedMemPercent
              });
            } else {
              return NextResponse.json(
                { error: 'Custom API-respons mist vereiste velden (storage, cpu, ram)' },
                { status: 502 }
              );
            }
          } else {
            return NextResponse.json(
              { error: `Custom API-endpoint retourneerde status ${response.status}` },
              { status: response.status >= 400 && response.status < 600 ? response.status : 502 }
            );
          }
        } catch (err) {
          return NextResponse.json(
            { error: `Verbinding met custom API mislukt: ${err.message}` },
            { status: 504 }
          );
        }
      }

      // 2. Fallback to actual system stats
      const storageStats = await getStorageStats();
      const actualCpu = getActualCPUUsage();

      return NextResponse.json({
        storage: storageStats,
        cpu: actualCpu,
        ram: usedMemPercent
      });
    }

    // Default: Return mock metrics
    const mockCpu = Math.round(10 + Math.random() * 15);
    return NextResponse.json({
      storage: { used: 8.4, total: 16.0, percent: 52 },
      cpu: mockCpu,
      ram: Math.max(34, usedMemPercent)
    });
  } catch (err) {
    console.error('Stats API Error:', err);
    return NextResponse.json({ error: 'Interne serverfout' }, { status: 500 });
  }
}
