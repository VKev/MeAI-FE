import type { Post } from '@/models/post.model';

export const mockUserPosts: Post[] = [
  {
    id: '0195f5b6-c7fe-7ef3-a0fd-2d4d0d8d6a22',
    userId: '11111111-1111-1111-1111-111111111111',
    workspaceId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    socialMediaId: '22222222-2222-2222-2222-222222222222',
    title: 'Spring Coffee Collection 2026',
    content: {
      content: 'Discover our new spring coffee collection ☕ Perfect blends for the warmer days ahead.',
      hashtag: '#coffee #spring2026 #meai',
      resource_list: ['33333333-3333-3333-3333-333333333333'],
      post_type: 'posts'
    },
    status: 'published',
    isPublished: true,
    media: [
      {
        resourceId: '33333333-3333-3333-3333-333333333333',
        presignedUrl: '/coffee.webp',
        contentType: 'image/webp',
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
      },
      {
        id: '44444444-4444-4444-4444-444444444446',
        socialMediaId: '22222222-2222-2222-2222-222222222224',
        socialMediaType: 'tiktok',
        destinationOwnerId: '123456789',
        externalContentId: '987654323',
        externalContentIdType: 'video_id',
        contentType: 'posts',
        publishStatus: 'published',
        publishedAt: '2026-03-16T11:00:00Z',
        createdAt: '2026-03-16T11:00:00Z'
      },
      {
        id: '44444444-4444-4444-4444-444444444447',
        socialMediaId: '22222222-2222-2222-2222-222222222225',
        socialMediaType: 'threads',
        destinationOwnerId: '123456789',
        externalContentId: '987654324',
        externalContentIdType: 'post_id',
        contentType: 'posts',
        publishStatus: 'published',
        publishedAt: '2026-03-16T11:05:00Z',
        createdAt: '2026-03-16T11:05:00Z'
      }
    ],
    views: 2340,
    likes: 187,
    createdAt: '2026-03-16T10:15:00Z',
    updatedAt: '2026-03-16T10:21:00Z'
  },
  {
    id: '0195f5b6-c7fe-7ef3-a0fd-2d4d0d8d6a23',
    userId: '11111111-1111-1111-1111-111111111111',
    workspaceId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    socialMediaId: null,
    title: 'New Brand Guidelines Preview',
    content: {
      content: 'Working on updated brand guidelines for Q2. Here\'s a sneak peek at the new visual direction.',
      hashtag: '#branding #design',
      resource_list: ['33333333-3333-3333-3333-333333333334'],
      post_type: 'posts'
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
    title: 'Product Launch Carousel',
    content: {
      content: 'Swipe through our latest product updates! Each slide highlights a key feature.',
      hashtag: '#product #launch #carousel',
      resource_list: [],
      post_type: 'posts'
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
    views: 856,
    likes: 64,
    createdAt: '2026-03-16T08:20:00Z',
    updatedAt: '2026-03-16T11:00:00Z'
  },
  {
    id: '0195f5b6-c7fe-7ef3-a0fd-2d4d0d8d6a24',
    userId: '11111111-1111-1111-1111-111111111111',
    workspaceId: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
    socialMediaId: '22222222-2222-2222-2222-222222222225',
    title: 'Cross-Platform Campaign',
    content: {
      content: 'Our latest campaign is now live across Threads and TikTok! Check out the engagement.',
      hashtag: '#crosspost #threads #tiktok',
      resource_list: ['33333333-3333-3333-3333-333333333335'],
      post_type: 'posts'
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
    views: 5120,
    likes: 420,
    createdAt: '2026-03-16T08:45:00Z',
    updatedAt: '2026-03-16T10:31:00Z'
  },
  {
    id: '0195f5b6-c7fe-7ef3-a0fd-2d4d0d8d6a27',
    userId: '11111111-1111-1111-1111-111111111111',
    workspaceId: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
    socialMediaId: '22222222-2222-2222-2222-222222222232',
    title: 'Side-by-Side Comparison',
    content: {
      content: 'Before and after — see the difference our AI tool makes.',
      hashtag: '#comparison #ai',
      resource_list: [],
      post_type: 'posts'
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
    views: 1450,
    likes: 98,
    createdAt: '2026-03-16T07:30:00Z',
    updatedAt: '2026-03-16T11:40:00Z'
  },
  {
    id: '0195f5b6-c7fe-7ef3-a0fd-2d4d0d8d6a28',
    userId: '11111111-1111-1111-1111-111111111111',
    workspaceId: '99999999-9999-9999-9999-999999999999',
    socialMediaId: null,
    title: 'Campaign Mood Board',
    content: {
      content: 'Exploring visual directions for the summer campaign. Still deciding on the color palette.',
      hashtag: '#moodboard #summer',
      resource_list: [],
      post_type: 'posts'
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
    id: '0195f5b6-c7fe-7ef3-a0fd-2d4d0d8d6a26',
    userId: '11111111-1111-1111-1111-111111111111',
    workspaceId: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    socialMediaId: '22222222-2222-2222-2222-222222222230',
    title: 'Product Demo Video',
    content: {
      content: 'Watch our 30-second product walkthrough — now live on Instagram.',
      hashtag: '#video #demo',
      resource_list: ['33333333-3333-3333-3333-333333333343'],
      post_type: 'posts'
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
    views: 3780,
    likes: 312,
    createdAt: '2026-03-16T07:50:00Z',
    updatedAt: '2026-03-16T11:20:00Z'
  },
  {
    id: '0195f5b6-c7fe-7ef3-a0fd-2d4d0d8d6a29',
    userId: '11111111-1111-1111-1111-111111111111',
    workspaceId: '12121212-1212-1212-1212-121212121212',
    socialMediaId: '22222222-2222-2222-2222-222222222235',
    title: 'Monthly Recap - February',
    content: {
      content: 'Here is what we achieved in February. Thanks for all the support!',
      hashtag: '#recap #february',
      resource_list: [],
      post_type: 'posts'
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
    views: 920,
    likes: 73,
    createdAt: '2026-02-18T09:15:00Z',
    updatedAt: '2026-02-18T09:30:00Z'
  },
  {
    id: '0195f5b6-c7fe-7ef3-a0fd-2d4d0d8d6a30',
    userId: '11111111-1111-1111-1111-111111111111',
    workspaceId: '13131313-1313-1313-1313-131313131313',
    socialMediaId: null,
    title: 'Gallery Draft — Feb Shoot',
    content: {
      content: 'Raw photos from the February photoshoot. Need to pick the best ones.',
      hashtag: '#gallery #photoshoot',
      resource_list: [],
      post_type: 'posts'
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
    socialMediaId: null,
    title: null,
    content: {
      content: null,
      hashtag: null,
      resource_list: [],
      post_type: null
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
    title: 'January Highlights',
    content: {
      content: 'A look back at our top-performing content from January.',
      hashtag: '#january #highlights',
      resource_list: [],
      post_type: 'posts'
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
    views: 1680,
    likes: 142,
    createdAt: '2026-01-20T09:50:00Z',
    updatedAt: '2026-01-20T10:10:00Z'
  }
];

export const mockWorkspacePosts: Post[] = mockUserPosts.filter(
  (post) =>
    post.workspaceId === 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' ||
    post.workspaceId === 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
);
