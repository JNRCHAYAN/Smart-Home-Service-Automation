import { ai } from '../services/aiClient.js';
import env from '../config/env.js';
import { CHAT_FUNCTIONS, executeFunction } from '../services/chatFunctions.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { ok, badRequest, unauthorized } from '../utils/response.js';

// AI chat handlers for the assistant. A role-specific system prompt is chosen,
// then the model is driven through tool-call loops (plain JSON or SSE streaming)
// so it can trigger real platform actions via chatFunctions while replying.
const SYSTEM_PROMPT_CUSTOMER = `You are Servio AI, a helpful assistant for the Smart Home Service Automation platform in Dhaka, Bangladesh.

Your capabilities:
1. Help customers book home services (AC repair, plumbing, electrical, cleaning, moving, car care, personal care)
2. Show provider matches with score breakdowns
3. Track live request status
4. Answer questions about services, pricing, policies, how matching works
5. Support Bangla and English (code-switching welcome)

Guidelines:
- Be conversational, friendly, and efficient
- Ask clarifying questions when needed (service type, location, date, time, urgency)
- Use function calling for actions - don't make up data
- For booking: guide through service → details → schedule → confirm
- Show provider comparison cards when matches are ready
- Explain matching rationale: "This provider is closest with 4.9 rating and available now"
- Support Bangla: "আপনি কি সার্ভিস চান?" / "ধনমন্ডিতে এসি রিপেয়ার লাগবে"

Current date: ${new Date().toISOString().split('T')[0]}
Service areas: ${Object.keys({ Dhanmondi: 1, Mirpur: 1, Gulshan: 1, Uttara: 1, Banani: 1, Badda: 1, Mohammadpur: 1, Mogbazar: 1 }).join(', ')}
Urgency levels: Normal, Urgent, Emergency`;

const SYSTEM_PROMPT_PROVIDER = `You are Servio AI, assistant for service providers on the Smart Home Service Automation platform.

Your capabilities:
1. Show incoming job requests matched to your skills
2. Accept/reject jobs with one command
3. Update job status: Accepted → On the Way → In Progress → Completed
4. Manage your schedule and availability slots
5. View earnings and performance insights
6. Answer questions about platform policies, payments, ratings

Guidelines:
- Be professional and action-oriented
- Show quick-action options (Accept, Reject, Update Status)
- Proactively suggest schedule optimization
- Alert about high-priority/emergency jobs
- Explain why a job matched you: "AC Repair in Dhanmondi - you're 2km away with 4.9 rating"

Current date: ${new Date().toISOString().split('T')[0]}`;

export const chat = asyncHandler(async (req, res) => {
  const { messages, stream = false } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return badRequest(res, 'Messages array required');
  }

  const user = req.currentUser;
  if (!user) {
    return unauthorized(res, 'Authentication required');
  }

  const isProvider = user.role === 'provider';
  const systemPrompt = isProvider ? SYSTEM_PROMPT_PROVIDER : SYSTEM_PROMPT_CUSTOMER;

  // Identity handed to tool execution so create/status actions act as this user.
  const userContext = {
    userId: user._id,
    role: user.role,
    name: user.name,
    providerId: user.role === 'provider' ? user.provider?._id : null
  };

  const fullMessages = [
    { role: 'system', content: systemPrompt },
    ...messages.map((m) => ({
      role: m.role,
      content: m.content,
      tool_calls: m.tool_calls,
      tool_call_id: m.tool_call_id
    }))
  ];

  try {
    if (stream) {
      return handleStreamChat(res, fullMessages, userContext);
    } else {
      return handleRegularChat(res, fullMessages, userContext);
    }
  } catch (error) {
    console.error('Chat error:', error);
    return badRequest(res, `Chat error: ${error.message}`);
  }
});

async function handleRegularChat(res, messages, userContext) {
  let response = await ai.chatCompletion(messages, {
    tools: CHAT_FUNCTIONS,
    tool_choice: 'auto',
    temperature: 0.3
  });

  let toolCalls = response.choices[0]?.message?.tool_calls || [];

  // Function-calling loop: run every requested tool, append each result as a
  // 'tool' message to the conversation, then re-ask until the model stops
  // requesting tool calls and returns a final text answer.
  while (toolCalls.length > 0) {
    const toolResults = [];

    for (const toolCall of toolCalls) {
      const { name, arguments: args } = toolCall.function;
      const parsedArgs = JSON.parse(args);
      const result = await executeFunction(name, parsedArgs, userContext);
      toolResults.push({
        role: 'tool',
        tool_call_id: toolCall.id,
        content: JSON.stringify(result)
      });
    }

    messages.push({ role: 'assistant', content: null, tool_calls: toolCalls });
    messages.push(...toolResults);

    response = await ai.chatCompletion(messages, {
      tools: CHAT_FUNCTIONS,
      tool_choice: 'auto',
      temperature: 0.3
    });

    toolCalls = response.choices[0]?.message?.tool_calls || [];
  }

  const finalMessage =
    response.choices[0]?.message?.content || 'I apologize, but I encountered an issue. Please try again.';

  return ok(res, {
    message: finalMessage,
    usage: response.usage
  });
}

async function handleStreamChat(res, messages, userContext) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const sendEvent = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  try {
    let fullResponse = '';
    let toolCalls = [];
    const pendingToolCalls = new Map();

    const stream = await ai.chatCompletionStream(messages, {
      tools: CHAT_FUNCTIONS,
      tool_choice: 'auto',
      temperature: 0.3
    });

    const reader = stream.getReader();
    const decoder = new TextDecoder();

    let sseBuffer = '';

    const handleLine = (line) => {
      if (!line.startsWith('data: ')) return;
      const data = line.slice(6);
      if (data === '[DONE]') return;

      try {
        const parsed = JSON.parse(data);
        const delta = parsed.choices[0]?.delta;

        if (delta?.content) {
          fullResponse += delta.content;
          sendEvent({ type: 'content', content: delta.content });
        }

        if (delta?.tool_calls) {
          for (const tc of delta.tool_calls) {
            // Group streamed fragments by their index so parallel tool
            // calls whose chunks interleave are assembled correctly.
            let entry = pendingToolCalls.get(tc.index);
            if (!entry || tc.id) {
              entry = {
                id: tc.id || null,
                type: 'function',
                function: { name: tc.function?.name || '', arguments: '' }
              };
              pendingToolCalls.set(tc.index, entry);
            }
            if (tc.function?.name) {
              entry.function.name = tc.function.name;
            }
            if (tc.function?.arguments) {
              entry.function.arguments += tc.function.arguments;
            }
          }
        }
      } catch (e) {
        // Ignore malformed keep-alive / non-JSON SSE lines.
      }
    };

    const flushToolCalls = () => {
      toolCalls = Array.from(pendingToolCalls.values())
        .filter((tc) => tc.id || (tc.function?.name && tc.function?.arguments))
        .map(({ id, type, function: fn }) => ({ id, type, function: fn }));
      pendingToolCalls.clear();
    };

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      // SSE events can be split across network chunks, so buffer until '\n'
      // before parsing a line. Without this, tool-call argument fragments
      // get dropped and the assembled JSON is corrupt.
      sseBuffer += decoder.decode(value, { stream: true });
      let newlineIndex;
      while ((newlineIndex = sseBuffer.indexOf('\n')) !== -1) {
        const line = sseBuffer.slice(0, newlineIndex).replace(/\r$/, '');
        sseBuffer = sseBuffer.slice(newlineIndex + 1);
        handleLine(line);
      }
    }

    if (sseBuffer.trim()) {
      handleLine(sseBuffer.trim());
    }

    flushToolCalls();

    while (toolCalls.length > 0) {
      const toolResults = [];

      for (const toolCall of toolCalls) {
        const { name, arguments: args } = toolCall.function;
        const parsedArgs = JSON.parse(args || '{}');
        sendEvent({ type: 'tool_call', name, args: parsedArgs });

        const result = await executeFunction(name, parsedArgs, userContext);
        toolResults.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: JSON.stringify(result)
        });

        sendEvent({ type: 'tool_result', name, result });
      }

      messages.push({ role: 'assistant', content: null, tool_calls: toolCalls });
      messages.push(...toolResults);

      const response = await ai.chatCompletion(messages, {
        tools: CHAT_FUNCTIONS,
        tool_choice: 'auto',
        temperature: 0.3
      });

      toolCalls = response.choices[0]?.message?.tool_calls || [];
      fullResponse = response.choices[0]?.message?.content || '';

      if (fullResponse) {
        sendEvent({ type: 'content', content: fullResponse });
      }
    }

    sendEvent({ type: 'done', message: fullResponse });
    res.end();
  } catch (error) {
    console.error('Stream chat error:', error);
    sendEvent({ type: 'error', error: error.message });
    res.end();
  }
}

export const ingestKnowledge = asyncHandler(async (req, res) => {
  if (!req.currentUser || req.currentUser.role !== 'customer') {
    return unauthorized(res, 'Admin access required');
  }

  const { ingestAllKnowledge } = await import('../services/ingestKnowledge.js');
  await ingestAllKnowledge();
  return ok(res, { message: 'Knowledge base ingested successfully' });
});

export const chatHealth = asyncHandler(async (req, res) => {
  return ok(res, {
    status: 'ok',
    model: env.deepseekModel,
    features: ['booking', 'tracking', 'provider-dashboard', 'knowledge-base', 'bangla-support']
  });
});
