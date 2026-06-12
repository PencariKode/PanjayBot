import type { PluginContext, PluginInfo } from "../../types.ts";
import axios from "axios";

interface TranslationResponse {
  responseData?: {
    translatedText?: string;
  };
}

interface QuoteResponse {
  quote?: string;
  author?: string;
}

async function translateToID(text: string): Promise<string> {
  try {
    const res = await axios.get<TranslationResponse>("https://api.mymemory.translated.net/get", {
      params: {
        q: text,
        langpair: "en|id",
        de: "emailmu@gmail.com", // Opsional
      },
    });
    return res.data?.responseData?.translatedText || text;
  } catch {
    return text;
  }
}

export const info: PluginInfo = {
  name: "Quotes",
  menu: ["quotes"],
  case: ["quotes", "motivation",],
  description: "Mengambil Kutipan Motivasi Acak",
  hidden: false,
  owner: false,
  premium: false,
  group: false,
  private: false,
  admin: false,
  botAdmin: false,
  allowPrivate: false,
};

export default async function handler(panjy: PluginContext) {
  const {
    command,
    panjayreply,
    m,
    PanjayInvalid,
  } = panjy;

  switch (command) {
    case "motivation":
    case "quotes":
      {
        try {
          const response = await axios.get<QuoteResponse>("https://motivational-spark-api.vercel.app/api/quotes/random");
          const data = response.data;

          const originalQuote = data.quote ?? "";
          const originalAuthor = data.author ?? "Unknown";

          const translatedQuote = await translateToID(originalQuote);
          
          const message = `*Quote of the Day*\n\n` + `"${translatedQuote}"\n\n@${originalAuthor}`;

          panjayreply(message);
        } catch (error) {
          console.error(error);
          return PanjayInvalid({ title: "GAGAL", message: "Maaf, gagal mengambil atau menerjemahkan quotes. Coba lagi nanti." });
        }
      }
      break;
  }
}
