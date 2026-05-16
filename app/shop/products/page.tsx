'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { productsApi } from '@/lib/api';
import ProductCard from '@/components/shop/ProductCard';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import SectionHead from '@/components/ui/SectionHead';
import Badge from '@/components/ui/Badge';
import { I } from '@/components/ui/Icons';
import type { Product, Pagination as PaginationType } from '@/types';

type SortKey = 'createdAt' | 'sales' | 'price_asc' | 'price_desc';

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'createdAt', label: 'Newest' },
  { value: 'sales', label: 'Bestselling' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
];

const COLOR_SWATCHES: { name: string; hex: string }[] = [
  { name: 'Oat', hex: '#E8C99B' },
  { name: 'Cream', hex: '#F0EADF' },
  { name: 'Slate', hex: '#6B655C' },
  { name: 'Charcoal', hex: '#2D2B26' },
  { name: 'Black', hex: '#111111' },
  { name: 'White', hex: '#F8F6F1' },
  { name: 'Terracotta', hex: '#B0573B' },
  { name: 'Sage', hex: '#94A38C' },
];

const SIZES = ['XS', 'S', 'M', 'L', 'XL'];

export default function ProductsListingPage() {
  return (
    <Suspense fallback={<div style={{ padding: 48, color: 'var(--ink-3)' }}>Loading…</div>}>
      <ProductsListingContent />
    </Suspense>
  );
}

function ProductsListingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState<PaginationType | null>(null);
  const [vendors, setVendors] = useState<string[]>([]);
  const [tagPool, setTagPool] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refetching, setRefetching] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState(() => searchParams.get('search') ?? '');
  const [category, setCategory] = useState(() => searchParams.get('category') || '');
  const [vendor, setVendor] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [onSale, setOnSale] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const [topRated, setTopRated] = useState(false);
  const [color, setColor] = useState('');
  const [size, setSize] = useState('');
  const [tag, setTag] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>(
    (searchParams.get('sortBy') as SortKey) || 'createdAt',
  );

  // Keep filters in sync when the URL changes (e.g. clicking a header tab while on this page)
  useEffect(() => {
    setCategory(searchParams.get('category') ?? '');
    setSearch(searchParams.get('search') ?? '');
    setPage(1);
  }, [searchParams]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- mark refetch in progress so the grid dims instead of unmounting
    setRefetching(true);
    const sortBy = sortKey === 'price_asc' || sortKey === 'price_desc' ? 'price' : sortKey;
    const sortOrder: 'ASC' | 'DESC' = sortKey === 'price_asc' ? 'ASC' : 'DESC';
    const fetch = search
      ? productsApi.search(search, page, 12)
      : productsApi.getAll({
          page,
          limit: 12,
          category: category || undefined,
          vendor: vendor || undefined,
          minPrice: minPrice ? Number(minPrice) : undefined,
          maxPrice: maxPrice ? Number(maxPrice) : undefined,
          inStock: inStockOnly ? 'true' : undefined,
          onSale: onSale ? 'true' : undefined,
          isNew: isNew ? 'true' : undefined,
          minRating: topRated ? 4 : undefined,
          color: color || undefined,
          size: size || undefined,
          tags: tag || undefined,
          sortBy,
          sortOrder,
        });

    fetch
      .then((res) => {
        setProducts(res.data);
        setPagination(res.pagination);
        const uniqVendors = Array.from(
          new Set(res.data.map((p) => p.vendor).filter(Boolean)),
        ) as string[];
        setVendors((prev) => Array.from(new Set([...prev, ...uniqVendors])));
        const uniqTags = Array.from(
          new Set(res.data.flatMap((p) => p.tags ?? []).filter(Boolean)),
        ) as string[];
        setTagPool((prev) => Array.from(new Set([...prev, ...uniqTags])));
      })
      .catch(() => toast.error('Failed to load products'))
      .finally(() => {
        setLoading(false);
        setRefetching(false);
      });
  }, [
    page,
    search,
    category,
    vendor,
    minPrice,
    maxPrice,
    inStockOnly,
    onSale,
    isNew,
    topRated,
    color,
    size,
    tag,
    sortKey,
  ]);

  const clearSearch = () => {
    setSearch('');
    if (searchParams.get('search')) router.replace('/shop/products');
  };
  const clearCategory = () => {
    setCategory('');
    if (searchParams.get('category')) router.replace('/shop/products');
  };

  const activeFilters = useMemo(() => {
    const list: { label: string; clear: () => void }[] = [];
    if (search) list.push({ label: `Search: "${search}"`, clear: clearSearch });
    if (category) list.push({ label: `Category: ${category}`, clear: clearCategory });
    if (vendor) list.push({ label: `Maker: ${vendor}`, clear: () => setVendor('') });
    if (inStockOnly) list.push({ label: 'In stock', clear: () => setInStockOnly(false) });
    if (onSale) list.push({ label: 'On sale', clear: () => setOnSale(false) });
    if (isNew) list.push({ label: 'New arrivals', clear: () => setIsNew(false) });
    if (topRated) list.push({ label: 'Rating ≥ 4★', clear: () => setTopRated(false) });
    if (color) list.push({ label: `Colour: ${color}`, clear: () => setColor('') });
    if (size) list.push({ label: `Size: ${size}`, clear: () => setSize('') });
    if (tag) list.push({ label: `Tag: ${tag}`, clear: () => setTag('') });
    if (minPrice) list.push({ label: `From $${minPrice}`, clear: () => setMinPrice('') });
    if (maxPrice) list.push({ label: `To $${maxPrice}`, clear: () => setMaxPrice('') });
    return list;
  }, [search, category, vendor, inStockOnly, onSale, isNew, topRated, color, size, tag, minPrice, maxPrice]);

  const clearAll = () => {
    setVendor('');
    setInStockOnly(false);
    setOnSale(false);
    setIsNew(false);
    setTopRated(false);
    setColor('');
    setSize('');
    setTag('');
    setMinPrice('');
    setMaxPrice('');
    if (searchParams.get('category') || searchParams.get('search')) {
      router.replace('/shop/products');
    } else {
      setCategory('');
      setSearch('');
    }
  };

  return (
    <div
      className="mx-auto grid gap-8"
      style={{
        maxWidth: 1440,
        padding: '40px 24px',
        gridTemplateColumns: 'minmax(0, 260px) minmax(0, 1fr)',
      }}
    >
      {/* Sidebar */}
      <aside className="hidden md:block">
        <Card padding={20} style={{ position: 'sticky', top: 120 }}>
          {vendors.length > 0 && (
            <FilterGroup title="Maker">
              {vendors.map((v) => (
                <label key={v} className="flex items-center" style={{ fontSize: 13 }}>
                  <input
                    type="radio"
                    name="vendor"
                    checked={vendor === v}
                    onChange={() => setVendor(v)}
                    style={{ accentColor: 'var(--ink)', marginRight: 8 }}
                  />
                  {v}
                </label>
              ))}
            </FilterGroup>
          )}

          <FilterGroup title="Price">
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Min"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                style={priceInputStyle}
              />
              <input
                type="number"
                placeholder="Max"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                style={priceInputStyle}
              />
            </div>
          </FilterGroup>

          <FilterGroup title="Highlights">
            <ToggleRow checked={inStockOnly} onChange={setInStockOnly} label="In stock only" />
            <ToggleRow checked={onSale} onChange={setOnSale} label="On sale" />
            <ToggleRow checked={isNew} onChange={setIsNew} label="New arrivals" />
            <ToggleRow checked={topRated} onChange={setTopRated} label="Rating ≥ 4★" />
          </FilterGroup>

          <FilterGroup title="Colour">
            <div className="flex flex-wrap gap-2">
              {COLOR_SWATCHES.map((c) => (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => setColor(color === c.name ? '' : c.name)}
                  title={c.name}
                  aria-label={c.name}
                  aria-pressed={color === c.name}
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 999,
                    background: c.hex,
                    border: color === c.name ? '2px solid var(--ink)' : '1px solid var(--line-2)',
                    padding: 0,
                    cursor: 'pointer',
                  }}
                />
              ))}
            </div>
          </FilterGroup>

          <FilterGroup title="Size">
            <div className="flex flex-wrap gap-1.5">
              {SIZES.map((s) => {
                const active = size === s;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSize(active ? '' : s)}
                    aria-pressed={active}
                    style={{
                      minWidth: 36,
                      height: 30,
                      padding: '0 10px',
                      borderRadius: 8,
                      border: active ? '1px solid var(--ink)' : '1px solid var(--line-2)',
                      background: active ? 'var(--ink)' : 'var(--bg-elev)',
                      color: active ? 'var(--bg-elev)' : 'var(--ink)',
                      fontSize: 12.5,
                      cursor: 'pointer',
                    }}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </FilterGroup>

          {tagPool.length > 0 && (
            <FilterGroup title="Tags">
              <div className="flex flex-wrap gap-1.5">
                {tagPool.map((t) => {
                  const active = tag === t;
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTag(active ? '' : t)}
                      aria-pressed={active}
                      style={{
                        height: 26,
                        padding: '0 10px',
                        borderRadius: 999,
                        border: active ? '1px solid var(--ink)' : '1px solid var(--line-2)',
                        background: active ? 'var(--ink)' : 'transparent',
                        color: active ? 'var(--bg-elev)' : 'var(--ink-2)',
                        fontSize: 12,
                        cursor: 'pointer',
                      }}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
            </FilterGroup>
          )}

          <Button variant="ghost" size="sm" full onClick={clearAll}>
            Clear all filters
          </Button>
        </Card>
      </aside>

      <div>
        <SectionHead
          eyebrow={`${pagination?.totalItems ?? products.length} pieces`}
          title="The full edit"
          sub="Filter by maker, colour, size, and more."
          right={
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
              aria-label="Sort by"
              style={{
                height: 32,
                borderRadius: 10,
                border: '1px solid var(--line-2)',
                background: 'var(--bg-elev)',
                color: 'var(--ink)',
                fontSize: 13,
                padding: '0 10px',
              }}
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          }
        />

        {activeFilters.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {activeFilters.map((f) => (
              <button
                key={f.label}
                type="button"
                onClick={f.clear}
                className="inline-flex items-center gap-1.5 transition-colors"
                style={{
                  padding: '6px 12px',
                  background: 'var(--bg-muted)',
                  color: 'var(--ink-2)',
                  borderRadius: 999,
                  border: '1px solid var(--line-2)',
                  fontSize: 12.5,
                  cursor: 'pointer',
                }}
              >
                {f.label}
                <I.x size={12} />
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div
            className="grid gap-5 mt-6"
            style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                style={{
                  height: 360,
                  background: 'var(--bg-muted)',
                  borderRadius: 16,
                  animation: 'pulse 1.5s ease-in-out infinite',
                }}
              />
            ))}
          </div>
        ) : products.length === 0 && !refetching ? (
          <Card padding={40} style={{ marginTop: 24, textAlign: 'center' }}>
            <Badge tone="neutral" size="sm">No matches</Badge>
            <div style={{ marginTop: 12, fontSize: 16, color: 'var(--ink)' }}>
              No pieces match your filters.
            </div>
            <p style={{ marginTop: 4, color: 'var(--ink-3)' }}>Try widening the search.</p>
          </Card>
        ) : (
          <div
            className="grid gap-5 mt-6"
            style={{
              gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
              opacity: refetching ? 0.55 : 1,
              pointerEvents: refetching ? 'none' : 'auto',
              transition: 'opacity 180ms ease',
            }}
            aria-busy={refetching}
          >
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}

        {pagination && pagination.totalPages > 1 && (
          <div className="flex justify-center mt-10">
            <Button
              variant="secondary"
              size="lg"
              disabled={!pagination.hasNextPage}
              onClick={() => pagination.hasNextPage && setPage(pagination.currentPage + 1)}
            >
              Load more
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

const priceInputStyle: React.CSSProperties = {
  width: '100%',
  height: 32,
  padding: '0 10px',
  borderRadius: 8,
  border: '1px solid var(--line-2)',
  background: 'var(--bg-elev)',
  color: 'var(--ink)',
  fontSize: 13,
  outline: 'none',
};

function ToggleRow({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex items-center" style={{ fontSize: 13 }}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={{ accentColor: 'var(--ink)', marginRight: 8 }}
      />
      {label}
    </label>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div style={{ marginBottom: 20 }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex items-center justify-between w-full"
        style={{
          background: 'transparent',
          border: 0,
          padding: 0,
          cursor: 'pointer',
          color: 'var(--ink)',
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 500 }}>{title}</span>
        <I.chev_d
          size={14}
          style={{
            color: 'var(--ink-4)',
            transform: open ? 'rotate(0deg)' : 'rotate(-90deg)',
            transition: 'transform 200ms ease',
          }}
        />
      </button>
      <div
        style={{
          display: 'grid',
          gridTemplateRows: open ? '1fr' : '0fr',
          opacity: open ? 1 : 0,
          transition: 'grid-template-rows 220ms ease, opacity 180ms ease',
        }}
      >
        <div style={{ overflow: 'hidden' }}>
          <div className="flex flex-col gap-1.5" style={{ paddingTop: 10 }}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
