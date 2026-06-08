

import fs from "fs";
import path from "path";
const ordersFile = path.join(
  process.cwd(),
  "database",
  "orders.json",
);

globalThis.getOrderStats = function () {
  let totalOrders = 0;
  let totalAmount = 0;

  if (fs.existsSync(ordersFile)) {
    const data = JSON.parse(fs.readFileSync(ordersFile));

    for (let user in data) {
      let order = data[user];
      if (order.status === "paid") {
        totalOrders++;
        totalAmount += Number(order.amount) || 0;
      }
    }
  }

  return { totalOrders, totalAmount };
};

((globalThis.panjaymenu = `☕ *Panjay Bot*
*WhatsApp Bot To Solve Your Problems*

📑 *Information Bot*
*Creator : Panji Depari*
*Contact : wa.me/6283829814737*\n`),
  // List Menu =========================
  (globalThis.storelist = `🎁 *Order Statistics*
*Order : ${getOrderStats().totalOrders}*
*Transaksi : Rp${getOrderStats().totalAmount.toLocaleString("id-ID")}*

*Contoh : Order A2*

📦 *Daftar Produk :*`));

