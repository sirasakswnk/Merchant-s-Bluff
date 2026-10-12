import { homeAvatars } from '../home/artwork';

export function CharacterAvatar({ avatarId, className }: { avatarId: number; className?: string }) {
  const face = homeAvatars[avatarId] ?? homeAvatars[0];
  return <span className={className} role="img" aria-label={`ตัวละคร ${face.label}`} data-avatar-id={avatarId}
    dangerouslySetInnerHTML={{ __html: face.svg }} />;
}
