/**
 * 文字列内のプレースホルダーを置換する関数
 *
 * 対応フォーマット:
 * - ${key}      : そのまま置換
 * - ${#key}     : Base64エンコード
 * - ${e#key}    : Base64エンコード (同上)
 * - ${u#key}    : URL-Safe Base64エンコード
 * - ${d#key}    : Base64デコード (通常/URL-Safe両対応)
 *
 * 値の参照優先順位:
 * 1. 引数 variables
 * 2. URLクエリパラメータ (同名のものがある場合は一番後の定義を採用)
 * 3. 見つからない場合は置換せずそのまま残す
 */
export function replacePlaceholders(
  template: string,
  variables: Record<string, string> = {}
): string {
  // 正規表現:
  // Group 1: プレフィックス (e#, u#, d#, #, または空文字)
  // Group 2: キー名 (英数字, _, -, .)
  const regex = /\$\{((?:e#|u#|d#|#)?)([\w\-.]+)\}/g;

  return template.replace(regex, (match, prefix, key) => {
    // 1. 値の取得 (variables -> query param)
    let value: string | null = null;

    if (key in variables) {
      value = variables[key] ?? '';
    } else if (typeof window !== 'undefined') {
      // ブラウザ環境の場合、クエリパラメータを確認
      const params = new URLSearchParams(window.location.search);
      // 同じvalが複数回定義されている場合は一番後に定義された値を採用
      const allValues = params.getAll(key);
      if (allValues.length > 0) {
        value = allValues[allValues.length - 1];
      }
    }

    // 値が見つからない場合は置換せず、元の文字列(${...})をそのまま返す
    if (value === null) {
      return match;
    }

    // 2. プレフィックスに応じた変換処理
    try {
      switch (prefix) {
        case '#':
        case 'e#':
          return toBase64(value);
        case 'u#':
          return toUrlSafeBase64(value);
        case 'd#':
          return fromBase64(value);
        default:
          // プレフィックスなし
          return value;
      }
    } catch (e) {
      console.warn(`Failed to convert placeholder ${match}:`, e);
      // デコード処理(d#)の失敗時のみ、元の値(value)をそのまま返す
      // -> 対象文字列がBASE64エンコードされていなかった場合に生の値で置換できる
      if (prefix === 'd#') {
        return value;
      }
      // エンコード失敗時はプレースホルダーを残す (元の文字列(${...})をそのまま返す)
      return match;
    }
  });
}

// --- Helper Functions (UTF-8 safe) ---

/**
 * 文字列をBase64エンコードする (UTF-8対応)
 */
function toBase64(str: string): string {
  // encodeURIComponentでUTF-8バイト列にし、それをバイナリ文字列に変換してからbtoa
  return btoa(
    encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) =>
      String.fromCharCode(parseInt(p1, 16))
    )
  );
}

/**
 * 文字列をURL Safe Base64エンコードする
 * (+ -> -, / -> _, = 削除)
 */
function toUrlSafeBase64(str: string): string {
  const base64 = toBase64(str);
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Base64文字列をデコードする (通常/URL Safe両対応, UTF-8対応)
 */
function fromBase64(str: string): string {
  // URL Safeな文字を標準に戻す (- -> +, _ -> /)
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');

  // パディング(=)の復元
  while (base64.length % 4) {
    base64 += '=';
  }

  // atobでデコード後、UTF-8文字列に復元
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  
  // TextDecoderが使える環境(モダンブラウザ/Node)なら推奨、
  // 使えない環境への配慮なら decodeURIComponent 方式を使う
  if (typeof TextDecoder !== 'undefined') {
    return new TextDecoder().decode(bytes);
  } else {
    // Legacy fallback
    return decodeURIComponent(
      binary.split('').map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
    );
  }
}