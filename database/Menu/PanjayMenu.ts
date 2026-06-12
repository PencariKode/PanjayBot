

import fs from "fs";
import path from "path";
const ordersFile = path.join(
  process.cwd(),
  "database",
  "orders.json",
);

interface StoredOrder {
  status?: unknown;
  amount?: unknown;
}

function isOrderRecord(value: unknown): value is Record<string, StoredOrder> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

globalThis.getOrderStats = function () {
  let totalOrders = 0;
  let totalAmount = 0;

  if (fs.existsSync(ordersFile)) {
    const data: unknown = JSON.parse(fs.readFileSync(ordersFile, "utf8"));
    if (!isOrderRecord(data)) return { totalOrders, totalAmount };

    for (const user in data) {
      const order = data[user];
      if (!order) continue;
      if (order.status === "paid") {
        totalOrders++;
        totalAmount += Number(order.amount) || 0;
      }
    }
  }

  return { totalOrders, totalAmount };
};

((globalThis.panjaymenu = `╭─〔 *PANJAY BOT* 〕
│ ◇ WhatsApp Bot To Solve Your Problems
│ ◇ Creator : Panji Depari
│ ◇ Contact : wa.me/6283829814737
╰─〔 *MENU* 〕\n`),
  // List Menu =========================
  (globalThis.storelist = `╭─〔 *ORDER STATISTICS* 〕
│ ◇ Order : ${getOrderStats().totalOrders}
│ ◇ Transaksi : Rp${getOrderStats().totalAmount.toLocaleString("id-ID")}
│ ◇ Contoh : Order A2

╰─〔 *DAFTAR PRODUK* 〕`));

