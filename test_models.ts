import { GoogleGenAI } from '@google/genai';
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const fetchModels = async () => {
    try {
        const response = await ai.models.list();
        for await (const model of response) {
            console.log(JSON.stringify(model, null, 2));
            break;
        }
    } catch(e) {
        console.error(e);
    }
}
fetchModels();
