import type { Post } from '@/models/post.model';

export const mockUserPosts: Post[] = [
  {
    id: '0195f5b6-c7fe-7ef3-a0fd-2d4d0d8d6a22',
    userId: '11111111-1111-1111-1111-111111111111',
    workspaceId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    socialMediaId: '22222222-2222-2222-2222-222222222222',
    title:
      'Sample post with an intentionally very long title to stress test wrapping, truncation, and how the top meta row behaves when the heading becomes much longer than a normal social post title would usually be',
    content: {
      content: 'Hello world from the updated AI Posts API with media and publications.',
      hashtag: '#hello #meai',
      resourceList: ['33333333-3333-3333-3333-333333333333'],
      postType: 'posts'
    },
    status: 'published',
    isPublished: true,
    media: [
      {
        resourceId: '33333333-3333-3333-3333-333333333333',
        presignedUrl: '/coffee.webp',
        contentType: 'image/webp',
        resourceType: 'image'
      },
      {
        resourceId: '33333333-3333-3333-3333-333333333336',
        presignedUrl: '/logo-meai-2.png',
        contentType: 'image/png',
        resourceType: 'image'
      },
      {
        resourceId: '33333333-3333-3333-3333-333333333337',
        presignedUrl: '/logo-meai.png',
        contentType: 'image/png',
        resourceType: 'image'
      }
    ],
    publications: [
      {
        id: '44444444-4444-4444-4444-444444444444',
        socialMediaId: '22222222-2222-2222-2222-222222222222',
        socialMediaType: 'facebook',
        destinationOwnerId: '123456789',
        externalContentId: '987654321',
        externalContentIdType: 'post_id',
        contentType: 'posts',
        publishStatus: 'published',
        publishedAt: '2026-03-16T10:21:00Z',
        createdAt: '2026-03-16T10:21:00Z'
      },
      {
        id: '44444444-4444-4444-4444-444444444445',
        socialMediaId: '22222222-2222-2222-2222-222222222223',
        socialMediaType: 'instagram',
        destinationOwnerId: '123456789',
        externalContentId: '987654322',
        externalContentIdType: 'post_id',
        contentType: 'posts',
        publishStatus: 'published',
        publishedAt: '2026-03-16T10:22:00Z',
        createdAt: '2026-03-16T10:22:00Z'
      }
    ],
    createdAt: '2026-03-16T10:15:00Z',
    updatedAt: '2026-03-16T10:21:00Z'
  },
  {
    id: '0195f5b6-c7fe-7ef3-a0fd-2d4d0d8d6a23',
    userId: '11111111-1111-1111-1111-111111111111',
    workspaceId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    socialMediaId: '22222222-2222-2222-2222-222222222224',
    title:
      'Draft workspace teaser with a deliberately oversized title designed to test whether the card header stays compact and aligned even when the post title spans far beyond the expected width of the grid item',
    content: {
      content:
        'This draft post has not been published yet, but still has a media preview for layout testing. It is intentionally very long so the card layout can be stress-tested with a multi-line paragraph that keeps going beyond the normal expected size. The goal here is to confirm that the platform logos and the published label, when they exist, stay pinned to the very bottom of the card instead of floating somewhere in the middle because the body content became taller than usual. This is also useful to check text wrapping, internal spacing, and whether the media block still reads as part of the same post instead of pushing the footer away in an awkward way.',
      hashtag: '#draft #workspace',
      resourceList: ['33333333-3333-3333-3333-333333333334'],
      postType: 'posts'
    },
    status: 'draft',
    isPublished: false,
    media: [
      {
        resourceId: '33333333-3333-3333-3333-333333333334',
        presignedUrl: '/logo-meai.webp',
        contentType: 'image/webp',
        resourceType: 'image'
      }
    ],
    publications: [],
    createdAt: '2026-03-16T09:15:00Z',
    updatedAt: null
  },
  {
    id: '0195f5b6-c7fe-7ef3-a0fd-2d4d0d8d6a25',
    userId: '11111111-1111-1111-1111-111111111111',
    workspaceId: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
    socialMediaId: '22222222-2222-2222-2222-222222222228',
    title:
      'Carousel-style product breakdown with an unusually long title so the UI can be checked for overflow, clamping, and spacing issues across dense media-heavy post cards in the product grid',
    content: {
      content:
        'This mock post contains many images to verify the UI still behaves well when the post effectively represents a carousel or multi-asset publication. The card should remain compact while still making it obvious that there are several media items attached.',
      hashtag: '#carousel #product #launch',
      resourceList: [
        '33333333-3333-3333-3333-333333333338',
        '33333333-3333-3333-3333-333333333339',
        '33333333-3333-3333-3333-333333333340',
        '33333333-3333-3333-3333-333333333341',
        '33333333-3333-3333-3333-333333333342'
      ],
      postType: 'posts'
    },
    status: 'published',
    isPublished: true,
    media: [
      {
        resourceId: '33333333-3333-3333-3333-333333333338',
        presignedUrl: '/logo-meai.png',
        contentType: 'image/png',
        resourceType: 'image'
      },
      {
        resourceId: '33333333-3333-3333-3333-333333333339',
        presignedUrl: '/logo-meai-2.png',
        contentType: 'image/png',
        resourceType: 'image'
      },
      {
        resourceId: '33333333-3333-3333-3333-333333333340',
        presignedUrl: '/logo-meai.webp',
        contentType: 'image/webp',
        resourceType: 'image'
      },
      {
        resourceId: '33333333-3333-3333-3333-333333333341',
        presignedUrl: '/black-meai-logo.webp',
        contentType: 'image/webp',
        resourceType: 'image'
      },
      {
        resourceId: '33333333-3333-3333-3333-333333333342',
        presignedUrl: '/coffee.webp',
        contentType: 'image/webp',
        resourceType: 'image'
      }
    ],
    publications: [
      {
        id: '44444444-4444-4444-4444-444444444448',
        socialMediaId: '22222222-2222-2222-2222-222222222229',
        socialMediaType: 'facebook',
        destinationOwnerId: '123456789',
        externalContentId: '987654325',
        externalContentIdType: 'post_id',
        contentType: 'posts',
        publishStatus: 'published',
        publishedAt: '2026-03-16T11:00:00Z',
        createdAt: '2026-03-16T11:00:00Z'
      }
    ],
    createdAt: '2026-03-16T08:20:00Z',
    updatedAt: '2026-03-16T11:00:00Z'
  },
  {
    id: '0195f5b6-c7fe-7ef3-a0fd-2d4d0d8d6a27',
    userId: '11111111-1111-1111-1111-111111111111',
    workspaceId: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
    socialMediaId: '22222222-2222-2222-2222-222222222232',
    title:
      'Two-image comparison post with a title long enough to reveal whether avatar spacing, metadata wrapping, and badge positioning still remain stable in a compact X-style card layout',
    content: {
      content:
        'This mock post includes exactly two images so the media layout can be checked for the two-item case without collapsing or misaligning.',
      hashtag: '#twoimages #comparison',
      resourceList: ['33333333-3333-3333-3333-333333333344', '33333333-3333-3333-3333-333333333345'],
      postType: 'posts'
    },
    status: 'published',
    isPublished: true,
    media: [
      {
        resourceId: '33333333-3333-3333-3333-333333333344',
        presignedUrl: '/logo-meai.png',
        contentType: 'image/png',
        resourceType: 'image'
      },
      {
        resourceId: '33333333-3333-3333-3333-333333333345',
        presignedUrl: '/black-meai-logo.webp',
        contentType: 'image/webp',
        resourceType: 'image'
      }
    ],
    publications: [
      {
        id: '44444444-4444-4444-4444-444444444450',
        socialMediaId: '22222222-2222-2222-2222-222222222233',
        socialMediaType: 'facebook',
        destinationOwnerId: '123456789',
        externalContentId: '987654327',
        externalContentIdType: 'post_id',
        contentType: 'posts',
        publishStatus: 'published',
        publishedAt: '2026-03-16T11:40:00Z',
        createdAt: '2026-03-16T11:40:00Z'
      }
    ],
    createdAt: '2026-03-16T07:30:00Z',
    updatedAt: '2026-03-16T11:40:00Z'
  },
  {
    id: '0195f5b6-c7fe-7ef3-a0fd-2d4d0d8d6a28',
    userId: '11111111-1111-1111-1111-111111111111',
    workspaceId: '99999999-9999-9999-9999-999999999999',
    socialMediaId: '22222222-2222-2222-2222-222222222234',
    title:
      'Three-image campaign preview with a deliberately extended title that should clamp cleanly without pushing important metadata or causing visual imbalance inside the post card',
    content: {
      content:
        'This mock post includes exactly three images to verify the three-item preview layout and spacing before the fourth slot is introduced.',
      hashtag: '#threeimages #campaign',
      resourceList: [
        '33333333-3333-3333-3333-333333333346',
        '33333333-3333-3333-3333-333333333347',
        '33333333-3333-3333-3333-333333333348'
      ],
      postType: 'posts'
    },
    status: 'draft',
    isPublished: false,
    media: [
      {
        resourceId: '33333333-3333-3333-3333-333333333346',
        presignedUrl: '/logo-meai.webp',
        contentType: 'image/webp',
        resourceType: 'image'
      },
      {
        resourceId: '33333333-3333-3333-3333-333333333347',
        presignedUrl: '/logo-meai-2.png',
        contentType: 'image/png',
        resourceType: 'image'
      },
      {
        resourceId: '33333333-3333-3333-3333-333333333348',
        presignedUrl: '/coffee.webp',
        contentType: 'image/webp',
        resourceType: 'image'
      }
    ],
    publications: [],
    createdAt: '2026-03-16T07:10:00Z',
    updatedAt: null
  },
  {
    id: '0195f5b6-c7fe-7ef3-a0fd-2d4d0d8d6a24',
    userId: '11111111-1111-1111-1111-111111111111',
    workspaceId: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
    socialMediaId: '22222222-2222-2222-2222-222222222225',
    title:
      'Threads and TikTok cross-post with a very long descriptive title to ensure the post can still look balanced when multiple publication logos, long copy, and an elongated heading all appear together',
    content: {
      content:
        'Cross-posted content card for verifying multiple platform logos render correctly. This post also includes deliberately extended copy so the card can be tested under long-content conditions while still showing a media preview and a publication footer. The desired behavior is that the footer remains visually attached to the bottom edge of the card, independent from how much text appears above it, so all cards align better in the grid and the published platforms section feels stable and intentional.',
      hashtag: '#crosspost #threads #tiktok',
      resourceList: ['33333333-3333-3333-3333-333333333335'],
      postType: 'posts'
    },
    status: 'published',
    isPublished: true,
    media: [
      {
        resourceId: '33333333-3333-3333-3333-333333333335',
        presignedUrl: '/black-meai-logo.webp',
        contentType: 'image/webp',
        resourceType: 'image'
      }
    ],
    publications: [
      {
        id: '44444444-4444-4444-4444-444444444446',
        socialMediaId: '22222222-2222-2222-2222-222222222226',
        socialMediaType: 'threads',
        destinationOwnerId: '123456789',
        externalContentId: '987654323',
        externalContentIdType: 'post_id',
        contentType: 'posts',
        publishStatus: 'published',
        publishedAt: '2026-03-16T10:30:00Z',
        createdAt: '2026-03-16T10:30:00Z'
      },
      {
        id: '44444444-4444-4444-4444-444444444447',
        socialMediaId: '22222222-2222-2222-2222-222222222227',
        socialMediaType: 'tiktok',
        destinationOwnerId: '123456789',
        externalContentId: '987654324',
        externalContentIdType: 'publish_id',
        contentType: 'posts',
        publishStatus: 'published',
        publishedAt: '2026-03-16T10:31:00Z',
        createdAt: '2026-03-16T10:31:00Z'
      }
    ],
    createdAt: '2026-03-16T08:45:00Z',
    updatedAt: '2026-03-16T10:31:00Z'
  },
  {
    id: '0195f5b6-c7fe-7ef3-a0fd-2d4d0d8d6a26',
    userId: '11111111-1111-1111-1111-111111111111',
    workspaceId: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    socialMediaId: '22222222-2222-2222-2222-222222222230',
    title:
      'Video-first announcement with a very long title for testing the visual relationship between an oversized heading, a video preview block, and the published platform footer at the bottom of the card',
    content: {
      content:
        'A video-first mock post to ensure the preview component still behaves when the primary media is video instead of an image.',
      hashtag: '#video #announcement',
      resourceList: ['33333333-3333-3333-3333-333333333343'],
      postType: 'posts'
    },
    status: 'published',
    isPublished: true,
    media: [
      {
        resourceId: '33333333-3333-3333-3333-333333333343',
        presignedUrl: '/background.webm',
        contentType: 'video/webm',
        resourceType: 'video'
      }
    ],
    publications: [
      {
        id: '44444444-4444-4444-4444-444444444449',
        socialMediaId: '22222222-2222-2222-2222-222222222231',
        socialMediaType: 'instagram',
        destinationOwnerId: '123456789',
        externalContentId: '987654326',
        externalContentIdType: 'post_id',
        contentType: 'posts',
        publishStatus: 'published',
        publishedAt: '2026-03-16T11:20:00Z',
        createdAt: '2026-03-16T11:20:00Z'
      }
    ],
    createdAt: '2026-03-16T07:50:00Z',
    updatedAt: '2026-03-16T11:20:00Z'
  },
  {
    id: '0195f5b6-c7fe-7ef3-a0fd-2d4d0d8d6a29',
    userId: '11111111-1111-1111-1111-111111111111',
    workspaceId: '12121212-1212-1212-1212-121212121212',
    socialMediaId: '22222222-2222-2222-2222-222222222235',
    title:
      'February monthly recap post with a deliberately long title to make grouped month sections denser and easier to visually validate in the product management grid',
    content: {
      content:
        'A February mock post used for testing month separators, section density, and how older content appears under grouped headings.',
      hashtag: '#monthly #recap #february',
      resourceList: ['33333333-3333-3333-3333-333333333349'],
      postType: 'posts'
    },
    status: 'published',
    isPublished: true,
    media: [
      {
        resourceId: '33333333-3333-3333-3333-333333333349',
        presignedUrl: '/coffee.webp',
        contentType: 'image/webp',
        resourceType: 'image'
      }
    ],
    publications: [
      {
        id: '44444444-4444-4444-4444-444444444451',
        socialMediaId: '22222222-2222-2222-2222-222222222236',
        socialMediaType: 'instagram',
        destinationOwnerId: '123456789',
        externalContentId: '987654328',
        externalContentIdType: 'post_id',
        contentType: 'posts',
        publishStatus: 'published',
        publishedAt: '2026-02-18T09:30:00Z',
        createdAt: '2026-02-18T09:30:00Z'
      }
    ],
    createdAt: '2026-02-18T09:15:00Z',
    updatedAt: '2026-02-18T09:30:00Z'
  },
  {
    id: '0195f5b6-c7fe-7ef3-a0fd-2d4d0d8d6a30',
    userId: '11111111-1111-1111-1111-111111111111',
    workspaceId: '13131313-1313-1313-1313-131313131313',
    socialMediaId: '22222222-2222-2222-2222-222222222237',
    title:
      'Another February post for grouped browsing so the month section has multiple cards and does not feel like a single isolated example',
    content: {
      content:
        'A second February item with two images to verify grouped sections continue to lay out well when they have more than one card.',
      hashtag: '#february #gallery',
      resourceList: ['33333333-3333-3333-3333-333333333350', '33333333-3333-3333-3333-333333333351'],
      postType: 'posts'
    },
    status: 'draft',
    isPublished: false,
    media: [
      {
        resourceId: '33333333-3333-3333-3333-333333333350',
        presignedUrl: '/logo-meai.png',
        contentType: 'image/png',
        resourceType: 'image'
      },
      {
        resourceId: '33333333-3333-3333-3333-333333333351',
        presignedUrl: '/logo-meai-2.png',
        contentType: 'image/png',
        resourceType: 'image'
      }
    ],
    publications: [],
    createdAt: '2026-02-12T13:20:00Z',
    updatedAt: null
  },
  {
    id: '0195f5b6-c7fe-7ef3-a0fd-2d4d0d8d6a31',
    userId: '11111111-1111-1111-1111-111111111111',
    workspaceId: '14141414-1414-1414-1414-141414141414',
    socialMediaId: '22222222-2222-2222-2222-222222222238',
    title:
      'January archive concept post created to verify that old-month separators still look intentional and help users manage content across time',
    content: {
      content:
        'An older January mock post with no publications, useful for testing cards under old-month dividers.',
      hashtag: '#january #archive',
      resourceList: [],
      postType: 'posts'
    },
    status: 'draft',
    isPublished: false,
    media: [],
    publications: [],
    createdAt: '2026-01-24T16:45:00Z',
    updatedAt: null
  },
  {
    id: '0195f5b6-c7fe-7ef3-a0fd-2d4d0d8d6a32',
    userId: '11111111-1111-1111-1111-111111111111',
    workspaceId: '15151515-1515-1515-1515-151515151515',
    socialMediaId: '22222222-2222-2222-2222-222222222239',
    title:
      'January published summary post with three images so older content sections still have mixed media and enough visual variation for management testing',
    content: {
      content:
        'A January post with three images and one publication to help validate older grouped sections.',
      hashtag: '#january #summary',
      resourceList: [
        '33333333-3333-3333-3333-333333333352',
        '33333333-3333-3333-3333-333333333353',
        '33333333-3333-3333-3333-333333333354'
      ],
      postType: 'posts'
    },
    status: 'published',
    isPublished: true,
    media: [
      {
        resourceId: '33333333-3333-3333-3333-333333333352',
        presignedUrl: '/logo-meai.webp',
        contentType: 'image/webp',
        resourceType: 'image'
      },
      {
        resourceId: '33333333-3333-3333-3333-333333333353',
        presignedUrl: '/coffee.webp',
        contentType: 'image/webp',
        resourceType: 'image'
      },
      {
        resourceId: '33333333-3333-3333-3333-333333333354',
        presignedUrl: '/black-meai-logo.webp',
        contentType: 'image/webp',
        resourceType: 'image'
      }
    ],
    publications: [
      {
        id: '44444444-4444-4444-4444-444444444452',
        socialMediaId: '22222222-2222-2222-2222-222222222240',
        socialMediaType: 'facebook',
        destinationOwnerId: '123456789',
        externalContentId: '987654329',
        externalContentIdType: 'post_id',
        contentType: 'posts',
        publishStatus: 'published',
        publishedAt: '2026-01-20T10:10:00Z',
        createdAt: '2026-01-20T10:10:00Z'
      }
    ],
    createdAt: '2026-01-20T09:50:00Z',
    updatedAt: '2026-01-20T10:10:00Z'
  }
];

export const mockWorkspacePosts: Post[] = mockUserPosts.filter(
  (post) =>
    post.workspaceId === 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' ||
    post.workspaceId === 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
);
