

import fs from "fs";
import { botConfig } from "../../config.ts";

const ordersFile = botConfig.paths.orders;

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

((globalThis.panjaymenu = `╭─〔 *${botConfig.identity.displayName.toUpperCase()}* 〕
│ ◇ ${botConfig.identity.description}
│ ◇ Creator : ${botConfig.owner.name}
│ ◇ Contact : ${botConfig.owner.contact}
╰─〔 *MENU* 〕\n`),
  // List Menu =========================
  (globalThis.storelist = `╭─〔 *ORDER STATISTICS* 〕
│ ◇ Order : ${getOrderStats().totalOrders}
│ ◇ Transaksi : Rp${getOrderStats().totalAmount.toLocaleString("id-ID")}
│ ◇ Contoh : Order A2

╰─〔 *DAFTAR PRODUK* 〕`));

