export interface CommandResponseOptions {
  prefix?: string | null;
  command?: string | null;
  title?: string;
  message: string;
  usage?: string;
  customFields?: Record<string, string | string[]>;
  example?: string;
  examples?: string[];
  details?: string | string[];
  footer?: string;
}

function wrapText(text: string, maxWidth: number, continuationPrefix: string): string {
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    if (currentLine === "") {
      currentLine = word;
    } else if ((currentLine + " " + word).length <= maxWidth) {
      currentLine += " " + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);

  return lines.join("\n" + continuationPrefix);
}

function cleanLine(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function formatCommand(prefix: string, command: string): string {
  if (!command) return "";
  return `${prefix}${command}`;
}

function formatExample(prefix: string, example: string): string {
  const cleaned = example.trim();
  if (!cleaned) return "";
  if (/^[#.!/]/.test(cleaned)) return cleaned;
  return `${prefix}${cleaned}`;
}

export function formatCommandResponse(options: CommandResponseOptions): string {
  const prefix = options.prefix ?? "";
  const command = options.command;
  const title = options.title ?? "COMMAND NOTICE";
  const wrappedMessage = wrapText(cleanLine(options.message), 35, "│   ");
  const lines = [`╭─〔 *${title}* 〕`, `│ ◇ ${wrappedMessage}`];

  const examples = [
    ...(options.example ? [options.example] : []),
    ...(options.examples ?? []),
  ]
    .map((example) => formatExample(prefix, example))
    .filter((example) => example.length > 0);

  const commandLine = formatCommand(prefix, command ?? "");
  if (command !== null && commandLine && examples.length === 0) lines.push(`│ ◇ Perintah : *${commandLine}*`);

  if (options.usage) {
    lines.push(`│ ◇ Format   : ${options.usage.trim()}`);
  }

  if (options.customFields) {
    for (const [key, value] of Object.entries(options.customFields)) {
      const valArray = Array.isArray(value) ? value : [value];
      if (valArray.length > 0) {
        lines.push(`│ ◇ ${key.trim()} : ${valArray.join(" ")}`);
      }
    }
  }

  if (examples.length === 1) {
    lines.push(`│ ◇ Contoh   : ${examples[0]}`);
  } else if (examples.length > 1) {
    lines.push("│ ◇ Contoh");
    for (const example of examples) {
      lines.push(`│   ├ ${example}`);
    }
  }

  const details = Array.isArray(options.details)
    ? options.details
    : options.details
      ? [options.details]
      : [];
  for (const detail of details) {
    const cleaned = detail.trim();
    if (cleaned) lines.push(`│ ◇ ${cleaned}`);
  }

  if (options.footer) {
    lines.push(`│ ◇ ${options.footer.trim()}`);
  }

  lines.push("╰────────────");
  return lines.join("\n");
}
