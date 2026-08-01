import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { VIBE_MODES } from './src/lib/vibeModes';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware
  app.use(express.json({ limit: '25mb' }));

  // Initialize Gemini Client
  const getAiClient = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('GEMINI_API_KEY is not defined in environment variables.');
    }
    return new GoogleGenAI({ apiKey: apiKey || '' });
  };

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'Viber AI Full-Stack Server',
      hasApiKey: Boolean(process.env.GEMINI_API_KEY)
    });
  });

  // API endpoint to return code files (strictly omitting .env files and secrets)
  app.get('/api/project-files', (req, res) => {
    try {
      const rootDir = process.cwd();
      const filesToInclude: { path: string; content: string }[] = [];

      function collectFiles(dir: string, relPath: string = '') {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          const entryRelPath = relPath ? `${relPath}/${entry.name}` : entry.name;

          // Strict Exclude Rules: No env files, no node_modules, no .git, no build outputs
          if (
            entry.name.startsWith('.env') ||
            entry.name === '.git' ||
            entry.name === 'node_modules' ||
            entry.name === 'dist' ||
            entry.name === '.next' ||
            entry.name === '.cache'
          ) {
            continue;
          }

          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            collectFiles(fullPath, entryRelPath);
          } else if (entry.isFile()) {
            const ext = path.extname(entry.name).toLowerCase();
            const validExts = ['.ts', '.tsx', '.js', '.jsx', '.json', '.html', '.css', '.md', '.svg'];
            if (validExts.includes(ext) || entry.name === '.gitignore') {
              try {
                const content = fs.readFileSync(fullPath, 'utf-8');
                filesToInclude.push({ path: entryRelPath, content });
              } catch (e) {
                console.warn(`Could not read file ${entryRelPath}:`, e);
              }
            }
          }
        }
      }

      collectFiles(rootDir);
      res.json({ files: filesToInclude });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to collect project files' });
    }
  });

  // Chat API endpoint
  app.post('/api/chat', async (req, res) => {
    try {
      const { messages, vibeMode = 'turbo', model = 'gemini-2.5-flash' } = req.body;

      if (!Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ error: 'Messages array is required.' });
      }

      const lastUserMsg = [...messages].reverse().find((m: any) => m.role === 'user');
      const userText = lastUserMsg?.content?.trim() || '';

      // Check if user is requesting Image Generation
      const isImageGenRequest = /^\/image|generate\s+(an?\s+)?image|create\s+(an?\s+)?image|draw|make\s+a\s+picture|paint\s+|picture\s+of|photo\s+of|illustration\s+of/i.test(userText);

      const apiKey = process.env.GEMINI_API_KEY;

      // Handle Image Generation Requests
      if (isImageGenRequest) {
        const prompt = userText
          .replace(/^\/image/i, '')
          .replace(/generate\s+(an?\s+)?image\s+(of|for|about)?/i, '')
          .replace(/create\s+(an?\s+)?image\s+(of|for|about)?/i, '')
          .replace(/draw\s+(an?\s+)?(picture\s+of|image\s+of)?/i, '')
          .replace(/make\s+a\s+picture\s+of/i, '')
          .replace(/paint\s+/i, '')
          .trim() || userText;

        let generatedImageUrl = '';
        let imageEngineUsed = '';

        // Try 1: Gemini Imagen 3 if API Key exists
        if (apiKey) {
          try {
            const ai = getAiClient();
            const imgResponse = await ai.models.generateImages({
              model: 'imagen-3.0-generate-002',
              prompt: prompt,
              config: {
                numberOfImages: 1,
                outputMimeType: 'image/jpeg',
                aspectRatio: '1:1',
              },
            });

            if (imgResponse.generatedImages && imgResponse.generatedImages.length > 0) {
              const base64Img = imgResponse.generatedImages[0].image.imageBytes;
              generatedImageUrl = `data:image/jpeg;base64,${base64Img}`;
              imageEngineUsed = 'Gemini Imagen 3';
            }
          } catch (imagenErr) {
            console.warn('Gemini Imagen 3 attempted and failed, seamlessly falling back to Pollinations AI:', imagenErr);
          }
        }

        // Try 2: Free High-Performance AI Image Model (Pollinations AI FLUX / SDXL)
        if (!generatedImageUrl) {
          const seed = Math.floor(Math.random() * 1000000);
          const encodedPrompt = encodeURIComponent(prompt || 'futuristic vibrant artificial intelligence logo');
          generatedImageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&nologo=true&seed=${seed}`;
          imageEngineUsed = 'Free AI Image Generator (Pollinations FLUX)';
        }

        const replyMarkdown = `Here is your requested AI generated image:

![${prompt}](${generatedImageUrl})

**Prompt:** *"${prompt}"*
**Engine:** \`${imageEngineUsed}\``;

        return res.json({
          reply: replyMarkdown,
          modelUsed: imageEngineUsed,
          vibeMode: vibeMode,
          isImage: true,
          imageUrl: generatedImageUrl
        });
      }

      // 3-Stage Model Fallback Cascade for Text Generation
      const fallbackModels = Array.from(new Set([
        model || 'gemini-2.5-flash',
        'gemini-2.0-flash',
        'gemini-1.5-flash',
        'gemini-2.5-pro'
      ]));

      // Find system instruction for vibe mode
      const vibeConfig = VIBE_MODES.find(v => v.id === vibeMode) || VIBE_MODES[0];
      const systemInstruction = vibeConfig.systemInstruction;

      // Transform messages to Gemini format
      const contents = messages.map((msg: any) => {
        const role = msg.role === 'assistant' ? 'model' : 'user';
        const parts: any[] = [];

        if (msg.content) {
          parts.push({ text: msg.content });
        }

        if (msg.imageBase64) {
          const cleanBase64 = msg.imageBase64.replace(/^data:image\/\w+;base64,/, '');
          const mimeType = msg.imageMimeType || 'image/jpeg';
          parts.push({
            inlineData: {
              data: cleanBase64,
              mimeType: mimeType
            }
          });
        }

        return { role, parts };
      });

      let replyText = '';
      let successfulModel = '';
      let lastError: any = null;

      if (!apiKey) {
        return res.status(500).json({
          error: 'Missing Gemini API Key. Please configure GEMINI_API_KEY in environment secrets.'
        });
      }

      const ai = getAiClient();

      // Execute 3-Stage Fallback Process
      for (let i = 0; i < fallbackModels.length; i++) {
        const currentModelCandidate = fallbackModels[i];
        try {
          console.log(`[Viber AI] Attempting model (Stage ${i + 1}/${fallbackModels.length}): ${currentModelCandidate}`);
          const response = await ai.models.generateContent({
            model: currentModelCandidate,
            contents: contents,
            config: {
              systemInstruction: systemInstruction,
              temperature: vibeMode === 'creative' ? 0.9 : vibeMode === 'coder' ? 0.2 : 0.7
            }
          });

          if (response.text) {
            replyText = response.text;
            successfulModel = currentModelCandidate;
            break; // Success! Break out of fallback loop
          }
        } catch (candidateErr: any) {
          console.warn(`[Viber AI] Model ${currentModelCandidate} failed (Stage ${i + 1}):`, candidateErr?.message || candidateErr);
          lastError = candidateErr;
        }
      }

      if (!replyText) {
        throw lastError || new Error('All 3 Gemini fallback models failed to respond.');
      }

      return res.json({
        reply: replyText,
        modelUsed: successfulModel,
        vibeMode: vibeMode
      });
    } catch (err: any) {
      console.error('Gemini API Error after fallbacks:', err);
      return res.status(500).json({
        error: err.message || 'An error occurred while calling Viber AI.'
      });
    }
  });

  // Vite middleware for development or when static build files do not exist
  const distPath = path.join(process.cwd(), 'dist');
  const isProd = process.env.NODE_ENV === 'production' && fs.existsSync(path.join(distPath, 'index.html'));

  if (!isProd) {
    console.log('[Viber AI Server] Initializing Vite middleware mode...');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    console.log('[Viber AI Server] Serving static build from dist...');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Viber AI Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal error starting Viber AI Server:', err);
});
