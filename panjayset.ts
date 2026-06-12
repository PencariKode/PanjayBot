

import chalk from "chalk";
import figlet from "figlet";
import { botConfig } from "./config.ts";

const terminalWidth = process.stdout.columns;
const maxWidth = Math.min(terminalWidth, 50);
const formatErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

// Fungsi utama
(async () => {
  try {
    if (botConfig.enabled.whatsapp) {
      console.log(chalk.green.bold(`\n🎁  Menjalankan ${botConfig.identity.displayName} WhatsApp`));
      const { default: startWhatsApp } = await import("./index.ts");
      void startWhatsApp();
    } else {
      console.log(
        chalk.red.bold(`\n❌  Bot WhatsApp Dinonaktifkan Di ${botConfig.identity.name}Set.js`),
      );
    }


    const logo = await new Promise<string>((resolve, reject) => {
      figlet.text(
        botConfig.identity.name,
        {
          font: "ANSI Shadow",
          horizontalLayout: "default",
          verticalLayout: "default",
          width: maxWidth,
          whitespaceBreak: false,
        },
        (error, result) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(result ?? "");
        },
      );
    });

    console.log(chalk.blue.bold(logo));

    console.log(
      chalk.white.bold(`${chalk.green.bold("📃  Informasi :")}         
✉️  ${botConfig.branding.startupTitle}
✉️  Author : ${botConfig.owner.name}
✉️  Gmail : ${botConfig.owner.email}
✉️  Instagram : ${botConfig.owner.instagram}
✉️  Youtube : ${botConfig.owner.youtube}
🎁  Base : ${botConfig.branding.baseName}

${chalk.green.bold(`🎁  Subscribe ${botConfig.identity.name} :D`)}\n`),
    );
  } catch (err) {
    console.error(
      chalk.red.bold(
        "\n⚠️  Terjadi Kesalahan : " + formatErrorMessage(err) + "\n",
      ),
    );
  }
})();
