'use client';

import Image from 'next/image';
import type { Vendor } from '@/lib/api';
import { getImageUrl } from '@/lib/utils';

interface Props {
  vendors: Vendor[];
}

const ITEM_WIDTH = 220;

export default function VendorMarquee({ vendors }: Props) {
  if (!vendors.length) return null;

  // Duplicate the list so the loop is seamless.
  const track = [...vendors, ...vendors];

  return (
    <div
      style={{
        position: 'relative',
        overflow: 'hidden',
        borderTop: '1px solid var(--line)',
        borderBottom: '1px solid var(--line)',
        background: 'var(--bg)',
      }}
      aria-label="Vendors we work with"
    >
      <div
        className="vendor-marquee-track"
        style={{
          display: 'flex',
          gap: 0,
          width: 'max-content',
          willChange: 'transform',
        }}
      >
        {track.map((v, i) => (
          <div
            key={`${v.id}-${i}`}
            style={{
              flex: `0 0 ${ITEM_WIDTH}px`,
              padding: '32px 24px',
              borderRight: '1px solid var(--line)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 120,
            }}
            aria-hidden={i >= vendors.length}
          >
            {v.logoUrl ? (
              <div style={{ position: 'relative', width: 130, height: 56, opacity: 0.85 }}>
                <Image
                  src={getImageUrl(v.logoUrl)}
                  alt={v.name}
                  fill
                  sizes="130px"
                  style={{ objectFit: 'contain', filter: 'grayscale(1)' }}
                />
              </div>
            ) : (
              <span
                style={{
                  fontFamily: 'var(--serif)',
                  fontSize: 22,
                  letterSpacing: -0.01,
                  color: 'var(--ink-2)',
                  whiteSpace: 'nowrap',
                }}
              >
                {v.name}
              </span>
            )}
          </div>
        ))}
      </div>
      <style jsx>{`
        @keyframes vendor-marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .vendor-marquee-track {
          animation: vendor-marquee 60s linear infinite;
        }
        :global(.vendor-marquee-track:hover) {
          animation-play-state: paused;
        }
        @media (prefers-reduced-motion: reduce) {
          .vendor-marquee-track {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}
