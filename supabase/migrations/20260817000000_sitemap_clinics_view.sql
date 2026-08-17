-- Stable, globally deduplicated source for sitemap generation.
-- Multiple clinic rows can share the same public city/slug URL; keep the
-- highest-scoring row and use id as a deterministic tie-breaker.
create or replace view public.sitemap_clinics
with (security_invoker = true) as
select distinct on (city, slug)
  id,
  slug,
  city,
  glow_score
from public.clinics
where visibility = 'visible'
  and slug is not null
  and slug <> ''
  and city is not null
  and city <> ''
order by city, slug, glow_score desc nulls last, id asc;
