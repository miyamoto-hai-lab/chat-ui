/**
 * Thinking Tag Filter
 * 
 * LLMの出力から思考タグ（例: <think>...</think>）を検出し、
 * 本文と思考過程を分離するユーティリティ。
 * ストリーミング対応 - 思考過程もリアルタイムでストリーミング表示。
 */

export interface ThinkingTag {
  start: string;
  end: string;
}

export interface StreamingFilterState {
  displayedContent: string;    // UIに表示済みのコンテンツ
  streamingReasoning: string;  // リアルタイムでストリーミング中の思考過程
  pendingBuffer: string;       // 保留中（タグの一部かもしれない内容）
  insideTag: boolean;          // 現在タグ内かどうか
  currentTagEnd: string;       // 現在のタグの終了文字列
}

/**
 * 初期状態を生成
 */
export function createInitialState(): StreamingFilterState {
  return {
    displayedContent: '',
    streamingReasoning: '',
    pendingBuffer: '',
    insideTag: false,
    currentTagEnd: '',
  };
}

/**
 * 正規表現の特殊文字をエスケープ
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * バッファの末尾がタグの先頭部分と一致するかチェックし、安全に出力できる長さを返す
 */
function findSafeOutputLength(buffer: string, patterns: string[]): number {
  if (patterns.length === 0) return buffer.length;
  
  const maxPatternLength = Math.max(...patterns.map(p => p.length));
  
  for (let i = 1; i < maxPatternLength && i <= buffer.length; i++) {
    const suffix = buffer.slice(-i);
    for (const pattern of patterns) {
      if (pattern.startsWith(suffix)) {
        return buffer.length - i;
      }
    }
  }
  return buffer.length;
}

/**
 * ストリーミングチャンクを処理し、コンテンツと思考過程をリアルタイムで分離する
 * 
 * 動作:
 * - 開始タグ検出: insideTag = true に切り替え、以降は思考過程へストリーミング
 * - 終了タグ検出: insideTag = false に切り替え、以降はコンテンツへストリーミング
 */
export function processStreamingChunk(
  chunk: string,
  tags: ThinkingTag[],
  state: StreamingFilterState
): StreamingFilterState {
  // タグが設定されていない場合はそのまま返す
  if (!tags || tags.length === 0) {
    return {
      ...state,
      displayedContent: state.displayedContent + chunk,
      pendingBuffer: '',
    };
  }

  let buffer = state.pendingBuffer + chunk;
  let displayed = state.displayedContent;
  let reasoning = state.streamingReasoning;
  let insideTag = state.insideTag;
  let currentTagEnd = state.currentTagEnd;

  let iterations = 0;
  const maxIterations = 1000; // 無限ループ防止

  while (buffer.length > 0 && iterations < maxIterations) {
    iterations++;

    if (insideTag) {
      // 終了タグを探す
      const endIndex = buffer.indexOf(currentTagEnd);
      if (endIndex !== -1) {
        // 終了タグ発見 → タグ内容を思考過程に追加してモード切替
        const tagContent = buffer.substring(0, endIndex);
        reasoning += tagContent;
        buffer = buffer.substring(endIndex + currentTagEnd.length);
        insideTag = false;
        currentTagEnd = '';
      } else {
        // 終了タグ未発見 → 安全な部分を思考過程へストリーミング
        const safeLength = findSafeOutputLength(buffer, [currentTagEnd]);
        if (safeLength > 0) {
          reasoning += buffer.substring(0, safeLength);
          buffer = buffer.substring(safeLength);
        }
        break;
      }
    } else {
      // 開始タグを探す
      let earliestStart = -1;
      let matchedTag: ThinkingTag | null = null;
      
      for (const tag of tags) {
        const idx = buffer.indexOf(tag.start);
        if (idx !== -1 && (earliestStart === -1 || idx < earliestStart)) {
          earliestStart = idx;
          matchedTag = tag;
        }
      }
      
      if (matchedTag && earliestStart !== -1) {
        // 開始タグ発見 → タグ前をコンテンツに追加してモード切替
        displayed += buffer.substring(0, earliestStart);
        buffer = buffer.substring(earliestStart + matchedTag.start.length);
        insideTag = true;
        currentTagEnd = matchedTag.end;
      } else {
        // 開始タグなし → 安全な部分のみコンテンツへ出力
        const startPatterns = tags.map(t => t.start);
        const safeLength = findSafeOutputLength(buffer, startPatterns);
        if (safeLength > 0) {
          displayed += buffer.substring(0, safeLength);
          buffer = buffer.substring(safeLength);
        }
        break;
      }
    }
  }

  return {
    displayedContent: displayed,
    streamingReasoning: reasoning,
    pendingBuffer: buffer,
    insideTag,
    currentTagEnd,
  };
}

/**
 * ストリーミング完了時に残りのバッファを処理
 */
export function finalizeStreaming(state: StreamingFilterState): {
  content: string;
  reasoning: string;
} {
  let finalContent = state.displayedContent;
  let finalReasoning = state.streamingReasoning;

  if (state.pendingBuffer) {
    if (state.insideTag) {
      // タグ内で終了 → 残りを思考過程に追加
      finalReasoning += state.pendingBuffer;
    } else {
      // タグ外で終了 → 残りをコンテンツに追加
      finalContent += state.pendingBuffer;
    }
  }

  return {
    content: finalContent,
    reasoning: finalReasoning.trim(),
  };
}

/**
 * 非ストリーミング用：一括でフィルタリング
 */
export function filterThinkingTags(
  input: string,
  tags: ThinkingTag[]
): { content: string; reasoning: string } {
  if (!tags || tags.length === 0) {
    return { content: input, reasoning: '' };
  }

  let content = input;
  let reasoning = '';

  for (const tag of tags) {
    const { start, end } = tag;
    const pattern = new RegExp(
      escapeRegex(start) + '([\\s\\S]*?)' + escapeRegex(end),
      'g'
    );
    
    content = content.replace(pattern, (_match, captured: string) => {
      if (captured.trim()) {
        reasoning += (reasoning ? '\n' : '') + captured.trim();
      }
      return '';
    });
  }

  return {
    content: content.trim(),
    reasoning: reasoning.trim(),
  };
}
