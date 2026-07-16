/**
 * Template Plugin Before
 *
 * Plugin before dijalankan SEBELUM command matching pada setiap pesan masuk.
 * File harus diawali underscore (_) agar dikenali sebagai before plugin.
 *
 * Bisa diletakkan di:
 *   - case/_namafile.ts         (root case)
 *   - case/kategori/_namafile.ts (dalam subdirectori)
 *
 * Return:
 *   true  → Lanjut ke before plugin berikutnya & command handler
 *   false → Hentikan pipeline, pesan tidak diproses lebih lanjut
 *
 * Temporary Cache:
 *   Gunakan `panjay.cache` untuk menyimpan data sementara (hilang saat restart).
 *   Contoh: panjay.cache.menfess = panjay.cache.menfess || {}
 */

import type { PluginContext } from "../types.ts";

export const info = {
  name: "Template Before",
  description: "Contoh plugin before — hapus file ini atau ganti isinya",
};

export default async function before(ctx: PluginContext): Promise<boolean> {
  // const { body, panjay, msg, normalizedSender, panjayreply, isGroup } = ctx;

  // Contoh: AFK system menggunakan temporary cache
  // ─────────────────────────────────────────────────
  // type AfkData = { reason: string; time: number };
  // const afkStore = (panjay.cache.afk || {}) as Record<string, AfkData>;
  // panjay.cache.afk = afkStore;
  //
  // // Jika sender sedang AFK, bebaskan
  // if (afkStore[normalizedSender]) {
  //   const data = afkStore[normalizedSender];
  //   const duration = Date.now() - data.time;
  //   await panjayreply(
  //     `Kamu berhenti AFK${data.reason ? " setelah " + data.reason : ""}\n` +
  //     `Selama ${Math.floor(duration / 60000)} menit`
  //   );
  //   delete afkStore[normalizedSender];
  // }

  // Contoh: Intercept pesan tanpa prefix (fitur interaktif)
  // ─────────────────────────────────────────────────────────
  // if (body.toLowerCase() === "ya" || body.toLowerCase() === "tidak") {
  //   // Handle konfirmasi interaktif
  // }

  // console.log(panjay.cache.lol)

  return true; // Selalu lanjutkan
}
