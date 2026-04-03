// ── Mock Config Data ───────────────────────────────────────
const CONFIG_GROUPS = [
  {
    title: 'Application',
    items: [
      { key: 'app.name', value: 'MeAI', description: 'Application name' },
      { key: 'app.version', value: '1.0.0', description: 'Current version' },
      { key: 'app.environment', value: 'production', description: 'Deploy environment' }
    ]
  },
  {
    title: 'Subscription',
    items: [
      { key: 'subscription.plans_count', value: '3', description: 'Number of subscription plans' },
      { key: 'subscription.trial_days', value: '7', description: 'Free trial duration' }
    ]
  },
  {
    title: 'Payment',
    items: [
      { key: 'payment.currency', value: 'VND', description: 'Default currency' },
      { key: 'payment.provider', value: 'Stripe', description: 'Payment provider' }
    ]
  },
  {
    title: 'User Limits',
    items: [
      { key: 'user.max_workspaces', value: '5', description: 'Max workspaces per user' },
      { key: 'user.max_social_accounts', value: '10', description: 'Max social accounts' }
    ]
  },
  {
    title: 'AI Settings',
    items: [
      { key: 'ai.default_model', value: 'gpt-4o', description: 'Default AI model' },
      { key: 'ai.rate_limit_per_minute', value: '30', description: 'Requests per minute limit' },
      { key: 'storage.max_upload_mb', value: '50', description: 'Max upload size (MB)' }
    ]
  }
];

// ── Page ───────────────────────────────────────────────────
export default function AdminConfig() {
  return (
    <div>
      <div className='mb-6'>
        <h1 className='text-xl font-bold text-white'>Setting</h1>
        <p className='mt-1 text-[13px] text-slate-400'>System configuration (read only)</p>
      </div>

      <div className='space-y-5'>
        {CONFIG_GROUPS.map((group) => (
          <div key={group.title} className='rounded-xl border border-white/[0.06] bg-[#13131e]'>
            <div className='border-b border-white/[0.06] px-5 py-3.5'>
              <h2 className='text-[14px] font-semibold text-white'>{group.title}</h2>
            </div>
            <div className='divide-y divide-white/[0.03]'>
              {group.items.map((item) => (
                <div
                  key={item.key}
                  className='flex items-center justify-between px-5 py-3.5 transition-colors hover:bg-white/[0.015]'
                >
                  <div className='flex-1'>
                    <p className='font-mono text-[12px] text-violet-400'>{item.key}</p>
                    <p className='mt-0.5 text-[11px] text-slate-500'>{item.description}</p>
                  </div>
                  <span className='rounded-md border border-white/[0.06] bg-white/[0.03] px-3 py-1 font-mono text-[12px] text-white'>
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <p className='mt-5 text-[11px] text-slate-500'>
        Configuration is managed via{' '}
        <code className='rounded bg-white/[0.04] px-1 py-0.5 text-slate-400'>/api/User/admin/config</code>. Edit
        functionality will be added later.
      </p>
    </div>
  );
}
