

import chalk from "chalk";
import figlet from "figlet";
import { promisify } from "util";

const terminalWidth = process.stdout.columns;
const maxWidth = Math.min(terminalWidth, 50);

// Konfigurasi Bot
const config = {
  whatsapp: true,
  telegram: false,
};

// Fungsi utama
(async () => {
  try {
    if (config.whatsapp) {
      console.log(chalk.green.bold("\n🎁  Menjalankan Panjay Bot WhatsApp"));
      const { default: startWhatsApp } = await import("./index.js");
      startWhatsApp();
    } else {
      console.log(
        chalk.red.bold("\n❌  Bot WhatsApp Dinonaktifkan Di PanjaySet.js"),
      );
    }


    const asyncFiglet = promisify(figlet.text);
    const logo = await asyncFiglet("Panjay", {
      font: "ANSI Shadow",
      horizontalLayout: "default",
      verticalLayout: "default",
      width: maxWidth,
      whitespaceBreak: false,
    });

    console.log(chalk.blue.bold(logo));

    console.log(
      chalk.white.bold(`${chalk.green.bold("📃  Informasi :")}         
✉️  Script Panjay Rebuild
✉️  Author : Panjay
✉️  Gmail : ipanjayy@gmail.com
✉️  Instagram : Ipanjay_
✉️  Youtube : Panjay
🎁  Base : Panjay

${chalk.green.bold("🎁  Subscribe Panjay :D")}\n`),
    );
  } catch (err) {
    console.error(
      chalk.red.bold("\n⚠️  Terjadi Kesalahan : " + err.message + "\n"),
    );
  }
})();