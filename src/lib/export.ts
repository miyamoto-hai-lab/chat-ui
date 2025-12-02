import type { UIMessage as Message } from 'ai';
import { format } from 'date-fns';

export function generateExportFilename(
  strategy: string,
  messages: Message[]
): string {
  let filename = strategy;

  // タイムスタンプの置換
  if (filename.includes('{YYYYMMDDHHmmss}')) {
    const timestamp = format(new Date(), 'yyyyMMddHHmmss');
    filename = filename.replace('{YYYYMMDDHHmmss}', timestamp);
  }

  // 最初のプロンプトの置換
  if (filename.includes('{FIRST_PROMPT}')) {
    const firstUserMessage = messages.find((m) => m.role === 'user');
    let firstPrompt = 'chat';
    if (firstUserMessage) {
      const content = (firstUserMessage as any).content || '';
      firstPrompt =
        String(content).slice(0, 30).replace(/[^\w\s-]/g, '') || 'chat';
    }
    filename = filename.replace('{FIRST_PROMPT}', firstPrompt);
  }

  return filename;
}

export function exportChatHistory(messages: Message[], filename: string): void {
  try {
    const exportData = {
      exportedAt: new Date().toISOString(),
      messages: messages.map((m) => ({
        role: m.role,
        content: (m as any).content || '',
        id: m.id,
      })),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to export chat history:', error);
    throw error;
  }
}
