'use client';

interface AvatarImages {
  userAvatarUrl: string | null;
  assistantAvatarUrl: string | null;
}

/**
 * カスタムアバター画像のURLを取得するフック
 * public/ フォルダに user_avatar.xxx または assistant_avatar.xxx がある場合はそのURLを返す
 * ない場合は null を返す（Lucide icons へのフォールバック用）
 */
export function useAvatarImages(): AvatarImages {
  const basePath = __APP_CONFIG__.base_path || '';

  // ビルド時に検出されたアバター画像のパスを取得
  const avatarConfig = typeof __AVATAR_CONFIG__ !== 'undefined' ? __AVATAR_CONFIG__ : { userAvatar: null, assistantAvatar: null };

  return {
    userAvatarUrl: avatarConfig.userAvatar ? `${basePath}/${avatarConfig.userAvatar}` : null,
    assistantAvatarUrl: avatarConfig.assistantAvatar ? `${basePath}/${avatarConfig.assistantAvatar}` : null,
  };
}

