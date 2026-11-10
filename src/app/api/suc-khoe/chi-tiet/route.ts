import { readFileSync, readdirSync, statSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { NextResponse } from "next/server";
import { layNguoiDungHienTai } from "@/lib/auth";

// Chẩn đoán máy chủ hosting (chỉ Chủ / Kỹ thuật): tiến trình node đang chạy, RAM, giới hạn của gói hosting, đuôi nhật ký lỗi app.
// Dùng để tìm vì sao Passenger/hosting thay tiến trình liên tục (10/11/2026). Chỉ ĐỌC, không ghi gì.
export const dynamic = "force-dynamic";
const doc = (f: string, n = 4000) => { try { return readFileSync(f, "utf8").slice(-n); } catch (e) { return `(không đọc được: ${(e as Error).message.slice(0, 60)})`; } };

export async function GET() {
  const nd = await layNguoiDungHienTai();
  if (!nd || !["chu", "ky_thuat"].includes(nd.vaiTro)) return NextResponse.json({ loi: "Không có quyền" }, { status: 403 });
  const uid = process.getuid?.();
  const tienTrinh: { pid: number; ram_mb: number; giay: number; lenh: string }[] = [];
  const hz = 100, boot = Number(doc("/proc/stat").match(/btime (\d+)/)?.[1] ?? 0), uptime = Number(doc("/proc/uptime").split(" ")[0]);
  try {
    for (const d of readdirSync("/proc")) {
      if (!/^\d+$/.test(d)) continue;
      try {
        if (statSync(`/proc/${d}`).uid !== uid) continue;
        const lenh = readFileSync(`/proc/${d}/cmdline`, "utf8").replace(/\0/g, " ").trim();
        const st = readFileSync(`/proc/${d}/stat`, "utf8").split(") ")[1].split(" ");
        const rss = Number(readFileSync(`/proc/${d}/status`, "utf8").match(/VmRSS:\s+(\d+)/)?.[1] ?? 0);
        tienTrinh.push({ pid: Number(d), ram_mb: Math.round(rss / 1024), giay: Math.round(uptime - Number(st[19]) / hz), lenh: lenh.slice(0, 120) });
      } catch {}
    }
  } catch {}
  const goc = process.cwd();
  return NextResponse.json({
    pid: process.pid, chay_giay: Math.round(process.uptime()), cwd: goc, boot,
    may: { ram_tong_mb: Math.round(os.totalmem() / 1048576), ram_trong_mb: Math.round(os.freemem() / 1048576), tai: os.loadavg(), cpu: os.cpus().length },
    cgroup: doc("/proc/self/cgroup", 800), gioi_han: doc("/proc/self/limits", 2000),
    lve: [doc("/proc/lve/list", 1500), doc("/sys/fs/cgroup/memory.max", 100), doc("/sys/fs/cgroup/memory/memory.limit_in_bytes", 100), doc("/sys/fs/cgroup/memory.events", 300)],
    passenger: Object.fromEntries(Object.entries(process.env).filter(([k]) => /PASSENGER|NODE_OPTIONS|PORT/.test(k)).map(([k, v]) => [k, String(v).slice(0, 120)])),
    tien_trinh: tienTrinh.sort((a, b) => a.giay - b.giay),
    app_log: doc(path.join(goc, "app.log"), 6000),
  }, { headers: { "cache-control": "no-store" } });
}
