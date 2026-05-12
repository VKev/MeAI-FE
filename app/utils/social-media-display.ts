import type { SocialMedia } from '@/models/social-media.model';

const PLATFORM_ORDER = ['facebook', 'instagram', 'tiktok', 'threads'];

function getSortKey(account: SocialMedia) {
  return (
    account.profile?.pageName ||
    account.profile?.displayName ||
    account.profile?.username ||
    account.profile?.userId ||
    account.id
  );
}

export function getSocialMediaDisplayName(account?: SocialMedia | null) {
  if (!account) return 'Unknown';

  if (account.type?.toLowerCase() === 'facebook') {
    return account.profile?.pageName || account.profile?.displayName || account.profile?.username || 'Facebook Page';
  }

  return account.profile?.displayName || account.profile?.username || 'Connected account';
}

export function getSocialMediaAvatar(account?: SocialMedia | null) {
  if (!account) return '';

  if (account.type?.toLowerCase() === 'facebook') {
    return account.profile?.pageProfilePictureUrl || account.profile?.profilePictureUrl || '';
  }

  return account.profile?.profilePictureUrl || '';
}

export function sortSocialMedias(accounts: SocialMedia[]) {
  return [...accounts].sort((left, right) => {
    const leftType = left.type?.toLowerCase() ?? '';
    const rightType = right.type?.toLowerCase() ?? '';
    const leftOrder = PLATFORM_ORDER.indexOf(leftType);
    const rightOrder = PLATFORM_ORDER.indexOf(rightType);
    const orderDelta =
      (leftOrder === -1 ? PLATFORM_ORDER.length : leftOrder) - (rightOrder === -1 ? PLATFORM_ORDER.length : rightOrder);

    if (orderDelta !== 0) return orderDelta;

    return getSortKey(left).localeCompare(getSortKey(right), undefined, { sensitivity: 'base' });
  });
}

export function mergeFacebookPagesWithAccounts(socialMedias: SocialMedia[], facebookPages?: SocialMedia[] | null) {
  const nonFacebook = socialMedias.filter((account) => account.type?.toLowerCase() !== 'facebook');
  const facebook =
    facebookPages && facebookPages.length > 0
      ? facebookPages
      : socialMedias.filter((account) => account.type?.toLowerCase() === 'facebook');

  return sortSocialMedias([...facebook, ...nonFacebook]);
}
