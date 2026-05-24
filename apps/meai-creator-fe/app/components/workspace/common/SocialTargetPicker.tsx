import { useEffect, useMemo } from 'react';
import { SOCIAL_PLATFORM_SPECS } from '@/routes/workspace/config';
import type { Ratio, SocialContentType, SocialPlatform, SocialPlatformSpec, SocialTarget } from '@/routes/workspace/config';

interface SocialTargetPickerProps {
  specs?: Record<string, SocialPlatformSpec>;
  targets: SocialTarget[];
  onChange: (targets: SocialTarget[]) => void;
  disabled?: boolean;
}

export function SocialTargetPicker({
  specs = SOCIAL_PLATFORM_SPECS,
  targets,
  onChange,
  disabled = false
}: SocialTargetPickerProps) {
  const platformEntries = useMemo(() => Object.entries(specs), [specs]);
  const isPlatformActive = (platform: SocialPlatform) => targets.some((t) => t.platform === platform);
  const targetsFor = (platform: SocialPlatform) => targets.filter((t) => t.platform === platform);

  useEffect(() => {
    const nextTargets = targets.flatMap((target) => {
      const spec = specs[target.platform];
      const typeSpec = spec?.types.find((type) => type.type === target.type);
      if (!typeSpec) return [];

      return [
        {
          ...target,
          ratio: typeSpec.supportedRatios.includes(target.ratio) ? target.ratio : typeSpec.default
        }
      ];
    });

    if (JSON.stringify(nextTargets) !== JSON.stringify(targets)) {
      onChange(nextTargets);
    }
  }, [onChange, specs, targets]);

  const togglePlatform = (platform: SocialPlatform) => {
    if (isPlatformActive(platform)) {
      onChange(targets.filter((t) => t.platform !== platform));
      return;
    }

    const spec = specs[platform];
    const firstType = spec?.types[0];
    if (!firstType) return;

    onChange([
      ...targets,
      { platform, type: firstType.type, ratio: firstType.default }
    ]);
  };

  const toggleType = (platform: SocialPlatform, type: SocialContentType) => {
    const spec = specs[platform];
    const typeSpec = spec?.types.find((t) => t.type === type);
    if (!typeSpec) return;

    const existing = targets.find((t) => t.platform === platform && t.type === type);
    if (existing) {
      onChange(targets.filter((t) => !(t.platform === platform && t.type === type)));
    } else {
      onChange([...targets, { platform, type, ratio: typeSpec.default }]);
    }
  };

  const updateTargetRatio = (platform: SocialPlatform, type: SocialContentType, ratio: Ratio) => {
    onChange(
      targets.map((t) => (t.platform === platform && t.type === type ? { ...t, ratio } : t))
    );
  };

  return (
    <div className={`space-y-3 ${disabled ? 'opacity-40 pointer-events-none' : ''}`}>
      <div className='grid grid-cols-2 gap-2'>
        {platformEntries.map(([platform, spec]) => {
          const isActive = isPlatformActive(platform);

          return (
            <button
              key={platform}
              type='button'
              onClick={() => togglePlatform(platform)}
              className={`flex h-9 w-full items-center justify-center rounded-md border px-2 text-xs font-medium transition ${
                isActive
                  ? 'border-purple-500 bg-purple-500/10 text-purple-300'
                  : 'border-gray-800 bg-gray-950/40 text-gray-300 hover:border-gray-700'
              }`}
            >
              {spec.label}
            </button>
          );
        })}
      </div>

      {platformEntries.filter(([platform]) => isPlatformActive(platform)).map(([platform, spec]) => {
        const activeTargets = targetsFor(platform);

        return (
          <div key={platform} className='space-y-2 rounded-md border border-gray-800 bg-gray-950/30 p-3'>
            <span className='text-xs font-semibold text-gray-300'>{spec.label}</span>

            <div className='flex flex-wrap gap-2'>
              {spec.types.map((typeSpec) => {
                const isTypeActive = activeTargets.some((t) => t.type === typeSpec.type);
                return (
                  <button
                    key={typeSpec.type}
                    type='button'
                    onClick={() => toggleType(platform, typeSpec.type)}
                    className={`flex h-7 items-center justify-center rounded-md border px-3 text-[11px] font-medium transition ${
                      isTypeActive
                        ? 'border-purple-500 bg-purple-500/10 text-purple-300'
                        : 'border-gray-800 bg-gray-950/40 text-gray-400 hover:border-gray-700'
                    }`}
                  >
                    {typeSpec.label}
                  </button>
                );
              })}
            </div>

            {activeTargets.map((target) => {
              const typeSpec = spec.types.find((t) => t.type === target.type);
              if (!typeSpec) return null;

              return (
                <div key={target.type} className='space-y-1.5 border-l-2 border-purple-500/40 pl-2'>
                  <span className='text-[10px] uppercase tracking-wide text-gray-500'>
                    {typeSpec.label} - dimension
                  </span>
                  <div className='flex flex-wrap gap-1.5'>
                    {typeSpec.supportedRatios.map((ratio) => {
                      const isRatioActive = target.ratio === ratio;
                      return (
                        <button
                          key={ratio}
                          type='button'
                          onClick={() => updateTargetRatio(platform, target.type, ratio)}
                          className={`flex h-7 items-center justify-center rounded-md border px-2.5 text-[11px] font-medium transition ${
                            isRatioActive
                              ? 'border-purple-500 bg-purple-500/10 text-purple-300'
                              : 'border-gray-800 bg-gray-950/40 text-gray-400 hover:border-gray-700'
                          }`}
                        >
                          {ratio}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
