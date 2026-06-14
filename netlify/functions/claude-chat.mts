/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI } from '@google/genai';
import type { Context, Config } from '@netlify/functions';

export default async (req: Request, context: Context) => {
  try {
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method Not Allowed' }, { status: 405 });
    }

    const { messages, system, userApiKey, model } = await req.json();
    
    // Prioritize client-provided API key from settings, then fallback to server env
    const apiKey = userApiKey || 
      req.headers.get('x-api-key') || 
      Netlify.env.get('GROQ_API_KEY') || 
      Netlify.env.get('OPENROUTER_API_KEY') || 
      Netlify.env.get('GEMINI_API_KEY'); 
    
    if (!apiKey) {
      return Response.json({ 
        error: 'Missing API Key. Please provide an API key in Onboarding or Settings to enable AI tutoring features.' 
      }, { status: 401 });
    }

    // Check if we can use native Google Gemini API directly (if key is Google API Key or fallback is used)
    const useGeminiDirectly = apiKey.startsWith('AIzaSy') || (!userApiKey && Netlify.env.get('GEMINI_API_KEY') && apiKey === Netlify.env.get('GEMINI_API_KEY'));

    // Check if we can use Groq API directly (if key is a Groq Key or fallback is used)
    const useGroqDirectly = apiKey.startsWith('gsk_') || (!userApiKey && Netlify.env.get('GROQ_API_KEY') && apiKey === Netlify.env.get('GROQ_API_KEY'));

    if (useGeminiDirectly) {
      // Initialize Google Gen AI client
      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      // Convert messages format to Gemini contents schema
      const geminiContents = messages.map((m: any) => {
        const parts: any[] = [];
        if (m.content) {
          parts.push({ text: m.content });
        }
        if (m.attachment && m.attachment.data && m.attachment.mimeType) {
          parts.push({
            inlineData: {
              data: m.attachment.data,
              mimeType: m.attachment.mimeType
            }
          });
        }
        if (parts.length === 0) {
          parts.push({ text: '' });
        }
        return {
          role: m.role === 'assistant' ? 'model' : 'user',
          parts
        };
      });

      const geminiStream = await ai.models.generateContentStream({
        model: 'gemini-3.5-flash',
        contents: geminiContents,
        config: {
          systemInstruction: system || undefined,
        },
      });

      const stream = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of geminiStream) {
              const content = chunk.text;
              if (content) {
                const legacyChunk = {
                  type: 'content_block_delta',
                  delta: { text: content }
                };
                controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(legacyChunk)}\n\n`));
              }
            }
            controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
          } catch (err: any) {
            console.error('Gemini direct streaming error:', err);
          } finally {
            controller.close();
          }
        }
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    if (useGroqDirectly) {
      console.log('[EthioLearn Server] Routing chat request directly to Groq Cloud API');
      
      // Convert Anthropic-messages and system prompt structure to OpenAI-compatible message array
      const groqMessages = [];
      if (system) {
        groqMessages.push({ role: 'system', content: system });
      }
      if (Array.isArray(messages)) {
        const mapped = messages.map((m: any) => {
          if (m.attachment && m.attachment.data && m.attachment.mimeType) {
            if (m.attachment.mimeType.startsWith('image/')) {
              return {
                role: m.role,
                content: [
                  { type: 'text', text: m.content || '' },
                  {
                    type: 'image_url',
                    image_url: {
                      url: `data:${m.attachment.mimeType};base64,${m.attachment.data}`
                    }
                  }
                ]
              };
            } else {
              return {
                role: m.role,
                content: `${m.content || ''}\n[Attached File: ${m.attachment.name || 'document'} (${m.attachment.mimeType})]`
              };
            }
          }
          return { role: m.role, content: m.content || '' };
        });
        groqMessages.push(...mapped);
      }

      // Resolve suitable Groq model or default to the premium llama-3.3-70b-versatile
      let finalGroqModel = model || 'llama-3.3-70b-versatile';
      if (
        finalGroqModel.includes('claude') || 
        finalGroqModel.includes('sonnet') || 
        finalGroqModel.includes('gpt') ||
        finalGroqModel === 'claude-3-5-sonnet-20241022'
      ) {
        finalGroqModel = 'llama-3.3-70b-versatile';
      }

      const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: finalGroqModel,
          messages: groqMessages,
          stream: true,
          max_tokens: 2048,
        }),
      });

      if (!groqResponse.ok) {
        const errBody = await groqResponse.text();
        console.error('Groq API returned error:', errBody);
        return Response.json({ error: errBody }, { status: groqResponse.status });
      }

      if (!groqResponse.body) {
        return Response.json({ error: 'Response body is empty. Could not initiate Groq stream.' }, { status: 500 });
      }

      const stream = new ReadableStream({
        async start(controller) {
          try {
            const reader = groqResponse.body!.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split('\n');
              buffer = lines.pop() || '';

              for (const line of lines) {
                const cleanLine = line.trim();
                if (!cleanLine) continue;

                if (cleanLine.startsWith('data:')) {
                  const rawData = cleanLine.substring(5).trim();
                  if (rawData === '[DONE]') {
                    controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
                    continue;
                  }

                  try {
                    const parsed = JSON.parse(rawData);
                    const content = parsed.choices?.[0]?.delta?.content;
                    if (content) {
                      const legacyChunk = {
                        type: 'content_block_delta',
                        delta: { text: content }
                      };
                      controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(legacyChunk)}\n\n`));
                    }
                  } catch (e) {
                    // Ignore partial JSON blocks
                  }
                }
              }
            }

            if (buffer && buffer.startsWith('data:')) {
              const rawData = buffer.substring(5).trim();
              if (rawData !== '[DONE]') {
                try {
                  const parsed = JSON.parse(rawData);
                  const content = parsed.choices?.[0]?.delta?.content;
                  if (content) {
                    const legacyChunk = {
                      type: 'content_block_delta',
                      delta: { text: content }
                    };
                    controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(legacyChunk)}\n\n`));
                  }
                } catch (e) {}
              }
            }
          } catch (err: any) {
            console.error('Groq direct streaming error:', err);
          } finally {
            controller.close();
          }
        }
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    // Convert Anthropic-messages and system prompt structure to OpenRouter/OpenAI-compatible message array
    const openRouterMessages = [];
    if (system) {
      openRouterMessages.push({ role: 'system', content: system });
    }
    if (Array.isArray(messages)) {
      const mapped = messages.map((m: any) => {
        if (m.attachment && m.attachment.data && m.attachment.mimeType) {
          if (m.attachment.mimeType.startsWith('image/')) {
            return {
              role: m.role,
              content: [
                { type: 'text', text: m.content || '' },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:${m.attachment.mimeType};base64,${m.attachment.data}`
                  }
                }
              ]
            };
          } else {
            return {
              role: m.role,
              content: `${m.content || ''}\n[Attached File: ${m.attachment.name || 'document'} (${m.attachment.mimeType})]`
            };
          }
        }
        return { role: m.role, content: m.content || '' };
      });
      openRouterMessages.push(...mapped);
    }

    // Resolve a standard OpenRouter model ID matching 2026 active endpoints list
    let openRouterModel = model || 'anthropic/claude-sonnet-4';
    if (openRouterModel.includes('claude-3-5-sonnet') || openRouterModel.includes('claude-3.5-sonnet') || openRouterModel.includes('claude-sonnet-latest')) {
      openRouterModel = 'anthropic/claude-sonnet-4';
    }

    // We make a direct POST to OpenRouter chat completions API
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://ai.studio/build',
        'X-Title': 'EthioLearn',
      },
      body: JSON.stringify({
        model: openRouterModel,
        messages: openRouterMessages,
        stream: true,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error('OpenRouter API returned error:', errBody);
      return Response.json({ error: errBody }, { status: response.status });
    }

    // Check readable stream exists
    if (!response.body) {
      return Response.json({ error: 'Response body is empty. Could not initiate stream.' }, { status: 500 });
    }

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const reader = response.body!.getReader();
          const decoder = new TextDecoder();
          let buffer = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || ''; // Keep partial line in buffer

            for (const line of lines) {
              const cleanLine = line.trim();
              if (!cleanLine) continue;

              if (cleanLine.startsWith('data:')) {
                const rawData = cleanLine.substring(5).trim();
                if (rawData === '[DONE]') {
                  controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
                  continue;
                }

                try {
                  const parsed = JSON.parse(rawData);
                  const content = parsed.choices?.[0]?.delta?.content;
                  if (content) {
                    // Return an Anthropic-compatible block delta format to keep existing client parsing functional
                    const legacyChunk = {
                      type: 'content_block_delta',
                      delta: { text: content }
                    };
                    controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(legacyChunk)}\n\n`));
                  }
                } catch (e) {
                  // Ignore partial parsing errors
                }
              }
            }
          }

          // Flush remaining stream buffer
          if (buffer && buffer.startsWith('data:')) {
            const rawData = buffer.substring(5).trim();
            if (rawData !== '[DONE]') {
              try {
                const parsed = JSON.parse(rawData);
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) {
                  const legacyChunk = {
                    type: 'content_block_delta',
                    delta: { text: content }
                  };
                  controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(legacyChunk)}\n\n`));
                }
              } catch (e) {}
            }
          }
        } catch (err: any) {
          console.error('OpenRouter streaming error:', err);
        } finally {
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (err: any) {
    console.error('Express proxy error calling OpenRouter:', err);
    return Response.json({ error: err.message || 'Internal proxy server failure.' }, { status: 500 });
  }
};

export const config: Config = {
  path: '/api/claude/chat',
};
