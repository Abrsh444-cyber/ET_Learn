import { GoogleGenAI } from '@google/genai';

type ChatAttachment = {
  name?: string;
  mimeType?: string;
  data?: string;
};

type ChatMessage = {
  role: 'user' | 'assistant';
  content?: string;
  attachment?: ChatAttachment;
};

const jsonHeaders = {
  'Content-Type': 'application/json',
};

const isValidKey = (key: unknown): key is string => {
  if (typeof key !== 'string') return false;
  const cleaned = key.trim();
  if (cleaned.length < 10) return false;
  return !['no-key', 'no-api-key', 'undefined', 'null', 'no_key', 'none', 'empty'].includes(
    cleaned.toLowerCase(),
  );
};

const toGeminiContents = (messages: ChatMessage[]) =>
  messages.map((message) => {
    const parts: Array<{ text: string } | { inlineData: { data: string; mimeType: string } }> = [];

    if (message.content) {
      parts.push({ text: message.content });
    }

    if (message.attachment?.data && message.attachment.mimeType) {
      parts.push({
        inlineData: {
          data: message.attachment.data,
          mimeType: message.attachment.mimeType,
        },
      });
    }

    if (parts.length === 0) {
      parts.push({ text: '' });
    }

    return {
      role: message.role === 'assistant' ? 'model' : 'user',
      parts,
    };
  });

export default async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204 });
  }

  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed.' }, { status: 405, headers: jsonHeaders });
  }

  try {
    const body = await req.json();
    const messages = Array.isArray(body.messages) ? (body.messages as ChatMessage[]) : [];

    if (messages.length === 0) {
      return Response.json({ error: 'Messages array is required.' }, { status: 400, headers: jsonHeaders });
    }

    const apiKey = isValidKey(body.userApiKey)
      ? body.userApiKey.trim()
      : process.env.GEMINI_API_KEY?.trim();

    if (!isValidKey(apiKey)) {
      return Response.json(
        {
          error:
            'Missing Gemini API key. Add GEMINI_API_KEY in Netlify environment variables or provide a key in app settings.',
        },
        { status: 401, headers: jsonHeaders },
      );
    }

    const ai = new GoogleGenAI({ apiKey });
    const stream = await ai.models.generateContentStream({
      model: 'gemini-2.5-flash',
      contents: toGeminiContents(messages),
      config: {
        systemInstruction: typeof body.system === 'string' ? body.system : undefined,
      },
    });

    const encoder = new TextEncoder();
    const responseStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const content = chunk.text;
            if (!content) continue;

            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: 'content_block_delta',
                  delta: { text: content },
                })}\n\n`,
              ),
            );
          }

          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(responseStream, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal chat proxy failure.';
    return Response.json({ error: message }, { status: 500, headers: jsonHeaders });
  }
};

export const config = {
  path: ['/api/claude/chat', '/api/claude/chat/'],
};
