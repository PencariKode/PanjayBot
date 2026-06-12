import type { PluginContext, PluginInfo } from "../../types.ts";


// Import Dependency (Jika Ada)
import axios from "axios";

// Metadata
export const info: PluginInfo = {
  name: "Public AI",

  menu: ["Publicai"],
  case: ["publicai"],

  description: "Public AI",
  hidden: false,

  owner: false,
  premium: false,
  group: false,
  private: false,
  admin: false,
  botAdmin: false,

  allowPrivate: false,
};

// Handler Utama
export default async function handler(panjy: PluginContext) {
  const {
    command,
    args,
    q,
    panjay,
    m,
    msg,
    len,
    replyJid,
    panjayreply,
    PanjayText,
    PanjayInvalid,
    PanjayWait,
    PanjayVideo,
    PanjayImage,
    PanjayAudio,
    PanjayFile,
    isGroup,
    isAdmin,
    isBotAdmin,
    isPremium,
    isPanjay,
  } = panjy;

  //   curl -X GET "https://api.fromscratch.web.id/v1/api/ai/publicai?query=Fungsi+Nodejs"

  //   {
  //   "status": 200,
  //   "creator": "Panjay",
  //   "data": {
  //     "query": "Fungsi Nodejs",
  //     "response": "Node.js adalah sebuah platform runtime yang memungkinkan Anda menjalankan JavaScript di luar browser. Fungsi utama Node.js adalah sebagai berikut:\n\n1. **Asynchronous I/O**: Node.js menggunakan model I/O asynchronous, yang memungkinkan aplikasi merespons permintaan dengan cepat dan efisien tanpa memblokir proses.\n\n2. **Non-blocking I/O**: Node.js memungkinkan Anda menulis aplikasi yang tidak memblokir proses dengan menunggu operasi I/O selesai. Ini memungkinkan aplikasi merespons permintaan lain sambil menunggu operasi I/O selesai.\n\n3. **Single-threaded**: Node.js menggunakan hanya satu thread untuk menjalankan aplikasi, yang membuatnya lebih ringan dan lebih efisien daripada aplikasi yang menggunakan banyak thread.\n\n",
  //     "length": {
  //       "query": 13,
  //       "response": 726
  //     },
  //     "timestamp": 1777476058536
  //   },
  //   "source": "api.fromscratch.web.id"
  // }

  switch (command) {
    case "publicai":
      {
        // Logic Di Sini

        // Validasi
        if (!q)
          return PanjayInvalid({
            title: "INPUT REQUIRED",
            message: "Masukkan pertanyaan untuk Public AI.",
            example: `${command} Apa Fungsi JavaScript`,
          });

        // Loading
        PanjayWait();

        // Ambil Data
        try {
          const API_URL = `https://api.fromscratch.web.id/v1/api/ai/publicai?query=${encodeURIComponent(q)}`;

          const { data: response } = await axios.get(API_URL, {
            timeout: 15000,
          });

          // Validasi Error
          if (!response || response.status !== 200 || !response.data) {
            return PanjayInvalid({ title: "GAGAL", message: "Gagal Mengambil Respon AI" });
          }

          // Hasil API
          const result = response.data.response || "Tidak Ada Hasil";

          let reply = `*[+] Panjay PublicAI*\n\n`;
          reply += `${result}`;

          await PanjayText(reply);
        } catch (error) {
          // Error Log
          console.error("PublicAI Error:", error);
          return PanjayText("Terjadi Kesalahan Pada Koneksi API");
        }
      }
      break;
  }
}
