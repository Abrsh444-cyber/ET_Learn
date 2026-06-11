/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // API Route for Claude proxy redirected to OpenRouter or natively served via Google Gemini
  app.post('/api/claude/chat', async (req, res) => {
    try {
      const { messages, system, userApiKey, model } = req.body;
      
      // Prioritize client-provided API key from settings, then fallback to server env
      const apiKey = userApiKey || req.headers['x-api-key'] || process.env.GROQ_API_KEY || process.env.OPENROUTER_API_KEY || process.env.GEMINI_API_KEY; 
      
      if (!apiKey) {
        return res.status(401).json({ 
          error: 'Missing API Key. Please provide an API key in Onboarding or Settings to enable AI tutoring features.' 
        });
      }

      // Check if we can use native Google Gemini API directly (if key is Google API Key or fallback is used)
      const useGeminiDirectly = apiKey.startsWith('AIzaSy') || (!userApiKey && process.env.GEMINI_API_KEY && apiKey === process.env.GEMINI_API_KEY);

      // Check if we can use Groq API directly (if key is a Groq Key or fallback is used)
      const useGroqDirectly = apiKey.startsWith('gsk_') || (!userApiKey && process.env.GROQ_API_KEY && apiKey === process.env.GROQ_API_KEY);

      if (useGeminiDirectly) {
        // Configure chunks for Server-Sent Events (SSE) streaming helper
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

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
        const geminiContents = messages.map((m: any) => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content || '' }]
        }));

        const stream = await ai.models.generateContentStream({
          model: 'gemini-3.5-flash',
          contents: geminiContents,
          config: {
            systemInstruction: system || undefined,
          },
        });

        for await (const chunk of stream) {
          const content = chunk.text;
          if (content) {
            const legacyChunk = {
              type: 'content_block_delta',
              delta: { text: content }
            };
            res.write(`data: ${JSON.stringify(legacyChunk)}\n\n`);
          }
        }

        res.write('data: [DONE]\n\n');
        res.end();
        return;
      }

      if (useGroqDirectly) {
        console.log('[EthioLearn Server] Routing chat request directly to Groq Cloud API');
        
        // Convert Anthropic-messages and system prompt structure to OpenAI-compatible message array
        const groqMessages = [];
        if (system) {
          groqMessages.push({ role: 'system', content: system });
        }
        if (Array.isArray(messages)) {
          groqMessages.push(...messages);
        }

        // Configure columns for Server-Sent Events (SSE) streaming helper
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

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
          return res.status(groqResponse.status).json({ error: errBody });
        }

        if (!groqResponse.body) {
          return res.status(500).json({ error: 'Response body is empty. Could not initiate Groq stream.' });
        }

        const reader = groqResponse.body.getReader();
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
                res.write('data: [DONE]\n\n');
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
                  res.write(`data: ${JSON.stringify(legacyChunk)}\n\n`);
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
                res.write(`data: ${JSON.stringify(legacyChunk)}\n\n`);
              }
            } catch (e) {}
          }
        }

        res.end();
        return;
      }

      // Convert Anthropic-messages and system prompt structure to OpenRouter/OpenAI-compatible message array
      const openRouterMessages = [];
      if (system) {
        openRouterMessages.push({ role: 'system', content: system });
      }
      if (Array.isArray(messages)) {
        openRouterMessages.push(...messages);
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
        return res.status(response.status).json({ error: errBody });
      }

      // Configure chunks for Server-Sent Events (SSE) streaming helper
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      // Check readable stream exists
      if (!response.body) {
        return res.status(500).json({ error: 'Response body is empty. Could not initiate stream.' });
      }

      // Read OpenRouter (OpenAI-compatible) chunks, decode, translation to legacy stream format, and pipe
      const reader = response.body.getReader();
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
              res.write('data: [DONE]\n\n');
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
                res.write(`data: ${JSON.stringify(legacyChunk)}\n\n`);
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
              res.write(`data: ${JSON.stringify(legacyChunk)}\n\n`);
            }
          } catch (e) {}
        }
      }
      res.end();
    } catch (err: any) {
      console.error('Express proxy error calling OpenRouter:', err);
      res.status(500).json({ error: err.message || 'Internal proxy server failure.' });
    }
  });

  // ============================================================
  // STUDENT ANALYTICS ENDPOINTS - NEW!
  // ============================================================

  // Get student performance analytics
  app.get('/api/student/analytics/:studentId', (req, res) => {
    try {
      const { studentId } = req.params;
      
      // Mock data - replace with actual database query
      const analyticsData = {
        studentId,
        overallGPA: 3.75,
        averageScore: 87.5,
        assignmentCompletionRate: 92,
        quizPassRate: 88,
        trend: 'improving',
        recommendations: [
          'Excellent work on recent assignments',
          'Consider exploring advanced topics',
          'Keep up the consistent effort'
        ]
      };

      res.json({ success: true, data: analyticsData });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch analytics' });
    }
  });

  // Get all students performance
  app.get('/api/analytics/class/:classId', (req, res) => {
    try {
      const { classId } = req.params;

      // Mock data - replace with actual database query
      const classAnalytics = {
        classId,
        totalStudents: 30,
        averageGPA: 3.65,
        averageScore: 82.3,
        assignmentCompletionRate: 85,
        quizPassRate: 80,
        topPerformers: [
          { id: 'student1', name: 'John Doe', score: 95 },
          { id: 'student2', name: 'Jane Smith', score: 92 },
          { id: 'student3', name: 'Bob Johnson', score: 90 }
        ],
        studentsNeedingSupport: [
          { id: 'student4', name: 'Alice Brown', score: 55 },
          { id: 'student5', name: 'Charlie Davis', score: 60 }
        ]
      };

      res.json({ success: true, data: classAnalytics });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch class analytics' });
    }
  });

  // ============================================================
  // STUDENT ENDPOINTS
  // ============================================================

  // Get all students
  app.get('/api/students', (req, res) => {
    try {
      const students = [
        { id: '1', name: 'John Doe', email: 'john@school.edu', grade: 'A', totalAssignments: 10, completedAssignments: 10 },
        { id: '2', name: 'Jane Smith', email: 'jane@school.edu', grade: 'B+', totalAssignments: 10, completedAssignments: 9 },
        { id: '3', name: 'Bob Johnson', email: 'bob@school.edu', grade: 'A-', totalAssignments: 10, completedAssignments: 10 }
      ];
      res.json({ success: true, data: students });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch students' });
    }
  });

  // Get single student
  app.get('/api/students/:studentId', (req, res) => {
    try {
      const { studentId } = req.params;
      const student = { id: studentId, name: 'John Doe', email: 'john@school.edu', enrollmentDate: '2024-01-01' };
      res.json({ success: true, data: student });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch student' });
    }
  });

  // Create new student
  app.post('/api/students', (req, res) => {
    try {
      const { name, email } = req.body;
      const newStudent = { id: Date.now().toString(), name, email, enrollmentDate: new Date() };
      res.status(201).json({ success: true, data: newStudent, message: 'Student created successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to create student' });
    }
  });

  // ============================================================
  // ASSIGNMENT ENDPOINTS
  // ============================================================

  // Get all assignments
  app.get('/api/assignments', (req, res) => {
    try {
      const assignments = [
        { id: '1', title: 'Math Assignment 1', dueDate: '2024-02-15', maxScore: 100, totalSubmissions: 28 },
        { id: '2', title: 'Science Project', dueDate: '2024-02-22', maxScore: 100, totalSubmissions: 25 },
        { id: '3', title: 'Essay Writing', dueDate: '2024-02-28', maxScore: 100, totalSubmissions: 30 }
      ];
      res.json({ success: true, data: assignments });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch assignments' });
    }
  });

  // Get student submissions for an assignment
  app.get('/api/assignments/:assignmentId/submissions', (req, res) => {
    try {
      const { assignmentId } = req.params;
      const submissions = [
        { id: '1', studentId: '1', studentName: 'John Doe', submittedDate: '2024-02-10', score: 95, status: 'graded' },
        { id: '2', studentId: '2', studentName: 'Jane Smith', submittedDate: '2024-02-11', score: 87, status: 'graded' },
        { id: '3', studentId: '3', studentName: 'Bob Johnson', submittedDate: '2024-02-12', score: null, status: 'pending' }
      ];
      res.json({ success: true, data: submissions });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch submissions' });
    }
  });

  // Submit assignment
  app.post('/api/assignments/:assignmentId/submit', (req, res) => {
    try {
      const { assignmentId } = req.params;
      const { studentId, content } = req.body;
      const submission = { id: Date.now().toString(), studentId, assignmentId, content, submittedDate: new Date(), status: 'submitted' };
      res.status(201).json({ success: true, data: submission, message: 'Assignment submitted successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to submit assignment' });
    }
  });

  // ============================================================
  // QUIZ ENDPOINTS
  // ============================================================

  // Get all quizzes
  app.get('/api/quizzes', (req, res) => {
    try {
      const quizzes = [
        { id: '1', title: 'Algebra Quiz', totalQuestions: 10, passingScore: 70, timeLimit: 30 },
        { id: '2', title: 'Biology Quiz', totalQuestions: 15, passingScore: 70, timeLimit: 45 },
        { id: '3', title: 'History Quiz', totalQuestions: 20, passingScore: 75, timeLimit: 60 }
      ];
      res.json({ success: true, data: quizzes });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch quizzes' });
    }
  });

  // Get quiz attempts for a student
  app.get('/api/quizzes/:quizId/attempts/:studentId', (req, res) => {
    try {
      const { quizId, studentId } = req.params;
      const attempts = [
        { id: '1', score: 85, maxScore: 100, attemptDate: '2024-02-10', passed: true, timeSpent: 25 },
        { id: '2', score: 92, maxScore: 100, attemptDate: '2024-02-15', passed: true, timeSpent: 28 }
      ];
      res.json({ success: true, data: attempts });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch quiz attempts' });
    }
  });

  // Submit quiz
  app.post('/api/quizzes/:quizId/submit', (req, res) => {
    try {
      const { quizId } = req.params;
      const { studentId, answers, timeSpent } = req.body;
      
      // Calculate score (mock)
      const score = Math.floor(Math.random() * 100);
      const passed = score >= 70;

      const result = { 
        id: Date.now().toString(), 
        studentId, 
        quizId, 
        score, 
        maxScore: 100, 
        passed, 
        timeSpent,
        attemptDate: new Date() 
      };
      
      res.status(201).json({ success: true, data: result, message: 'Quiz submitted successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to submit quiz' });
    }
  });

  // ============================================================
  // LESSON ENDPOINTS
  // ============================================================

  // Get all lessons
  app.get('/api/lessons', (req, res) => {
    try {
      const lessons = [
        { id: '1', title: 'Algebra Basics', duration: 45, contentType: 'video' },
        { id: '2', title: 'Advanced Algebra', duration: 60, contentType: 'video' },
        { id: '3', title: 'Algebra Practice', duration: 30, contentType: 'interactive' }
      ];
      res.json({ success: true, data: lessons });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch lessons' });
    }
  });

  // Get lesson progress for a student
  app.get('/api/lessons/:lessonId/progress/:studentId', (req, res) => {
    try {
      const { lessonId, studentId } = req.params;
      const progress = {
        lessonId,
        studentId,
        completed: true,
        startedDate: '2024-02-10',
        completedDate: '2024-02-10',
        timeSpent: 45,
        contentViewed: 100
      };
      res.json({ success: true, data: progress });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch lesson progress' });
    }
  });

  // Update lesson progress
  app.put('/api/lessons/:lessonId/progress/:studentId', (req, res) => {
    try {
      const { lessonId, studentId } = req.params;
      const { completed, timeSpent } = req.body;
      
      const progress = {
        lessonId,
        studentId,
        completed,
        timeSpent,
        lastUpdated: new Date()
      };
      
      res.json({ success: true, data: progress, message: 'Lesson progress updated' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update lesson progress' });
    }
  });

  // ============================================================
  // ERROR HANDLING - 404 for undefined routes
  // ============================================================

  // Catch-all for undefined API routes
  app.use('/api/*', (req, res) => {
    res.status(404).json({ 
      error: 'API endpoint not found',
      path: req.path,
      method: req.method,
      message: 'This endpoint does not exist. Check the API documentation.'
    });
  });

  // Serve static assets in production or use Vite developer middleware
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[EthioLearn Server] bound on port ${PORT}`);
    console.log(`[EthioLearn Server] API endpoints available at http://localhost:${PORT}/api`);
  });
}

startServer();
