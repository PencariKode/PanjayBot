

import axios from 'axios';
export async function Ai4Chat(prompt) {
    const url = new URL("https://yw85opafq6.execute-api.us-east-1.amazonaws.com/default/boss_mode_15aug");
    url.search = new URLSearchParams({
        text: prompt,
        country: "Europe",
        user_id: "Av0SkyG00D" // Thanks To Avosky
    }).toString();

    try {
        const response = await axios.get(url.toString(), {
            timeout: 20000,
            headers: {
                "User-Agent": "Mozilla/5.0 (Linux; Android 11; Infinix)",
                Referer: "https://www.ai4chat.co/pages/riddle-generator"
            }
        });

        if (response.status !== 200) throw new Error(`Status ${response.status}`);

        const result = response.data?.trim?.() || null;

        if (!result) throw new Error("Empty AI response");

        return result;

    } catch (error) {
        console.error("Ai4Chat Error:", error.message);
        throw error;
    }
}


export default Ai4Chat;