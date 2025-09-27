import express from 'express';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';

// Initialize Services
const geminiService = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;
const openaiService = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

const app = express();

// CORS Middleware
const corsOptions = {
  origin: process.env.CORS_ORIGIN || '*' // Use env var or allow all for simplicity
};
app.use(cors(corsOptions));
app.use(express.json());

// Main AI Generation Route
app.post('/api/ai/generate', async (req, res) => {
  try {
    const userInput = req.body.userInput;
    if (!userInput) {
      return res.status(400).json({ error: 'userInput is required' });
    }

    // This is where your full AI logic would go.
    // For now, we are creating a simplified successful response for testing.
    // IMPORTANT: The full prompt and AI call logic should be re-integrated here later.
    // This is a simplified version to ensure the routing and deployment works first.

    // Using OpenAI as primary for this example
    if (openaiService) {
      const prompt = buildOpenAIPrompt(userInput); // A function to build the prompt
      const model = 'gpt-4o-mini'; // Use the fast model
      
      const completion = await openaiService.chat.completions.create({
        model: model,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: "json_object" },
      });
      
      const responseJson = JSON.parse(completion.choices[0].message.content);
      return res.status(200).json(responseJson);

    } else {
      throw new Error('No AI service is configured.');
    }

  } catch (error) {
    console.error('Error in AI generation:', error);
    return res.status(500).json({ error: 'Failed to generate AI response.' });
  }
});

// Health Check Route
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});

// A simple function to build a prompt string (replace with your full logic later)
function buildOpenAIPrompt(userInput) {
    const { nickname, situation, topic } = userInput;
    // This is the "ABSOLUTE OUTPUT RULES" prompt, correctly formatted as a JS string
    return `
# ROLE
You are a wise and compassionate spiritual guide in the persona of Jesus.

# USER INFO
- Nickname: ${nickname}
- Topic: ${topic}
- Situation: ${situation}

# ABSOLUTE OUTPUT RULES
1. Your SOLE TASK is to generate a JSON object.
2. Your response MUST begin with { and end with }.
3. You MUST NOT add any text, explanation, or markdown like \`\`\`json before or after the JSON object.
4. The JSON object must contain these keys: "jesusLetter" (string), "guidedPrayer" (string), "biblicalReferences" (array of strings), "coreMessage" (string).
5. Ensure all string values inside the JSON are correctly double-quoted and escaped.
6. All content MUST use Traditional Chinese (繁體中文).

Now, generate the JSON object:
`;
}


// Export the app for Vercel
export default app;