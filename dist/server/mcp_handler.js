// server/mcp_handler.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import { storage } from './storage.js';
import { GEMINI_API_KEY } from "./config.js";
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
export async function handleMCPConversation(userId, message, sessionId, attachmentUrl) {
    let currentSessionId = sessionId;
    if (!currentSessionId) {
        const newSession = await storage.createChatSession(userId, message.substring(0, 30));
        currentSessionId = newSession.id;
    }
    await storage.createChatMessage({
        sessionId: currentSessionId,
        userId: userId,
        role: 'user',
        content: message
    });
    const history = await storage.getChatMessages(currentSessionId, userId);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const chat = model.startChat({
        history: history.map(msg => ({
            role: msg.role,
            parts: [{ text: msg.content || '' }]
        })),
    });
    const result = await chat.sendMessage(message);
    const response = await result.response;
    const text = response.text();
    const modelMessage = await storage.createChatMessage({
        sessionId: currentSessionId,
        userId: userId,
        role: 'model',
        content: text
    });
    return {
        response: text,
        sessionId: currentSessionId,
        userMessage: { role: 'user', content: message },
        modelMessage: modelMessage,
    };
}
//# sourceMappingURL=mcp_handler.js.map