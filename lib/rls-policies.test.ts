import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'

const sql = readFileSync(
  new URL('../supabase/migrations/20261009130000_add_rls_policies.sql', import.meta.url),
  'utf8',
).toLowerCase()

const tables = [
  'clinics',
  'clinic_contacts',
  'reviews',
  'subscriptions',
  'treatments',
  'clinic_treatments',
]

describe('directory RLS migration', () => {
  it('enables RLS on all six tables', () => {
    for (const table of tables) {
      assert.match(sql, new RegExp(`alter table public\\.${table} enable row level security`))
    }
  })

  it('gives anon and authenticated select policies only on public directory tables', () => {
    assert.match(sql, /create policy clinics_public_select[\s\S]*for select[\s\S]*to anon, authenticated[\s\S]*visibility = 'visible'/)
    assert.match(sql, /create policy reviews_public_select[\s\S]*is_approved = true/)
    assert.match(sql, /create policy treatments_public_select[\s\S]*using \(true\)/)
    assert.match(sql, /create policy clinic_treatments_public_select/)
    assert.doesNotMatch(sql, /policy clinic_contacts_/)
    assert.doesNotMatch(sql, /policy subscriptions_/)
    assert.doesNotMatch(sql, /for insert/)
    assert.doesNotMatch(sql, /for update/)
    assert.doesNotMatch(sql, /for delete/)
  })

  it('keeps contact, billing, and account columns off the anon clinic grant', () => {
    const grant = sql.match(/grant select \([\s\S]*?\) on table public\.clinics to anon, authenticated/)
    assert.ok(grant)
    const columns = grant[0]
    for (const column of [
      'email',
      'contact_email',
      'stripe_customer_id',
      'subscription_id',
      'primary_contact_id',
    ]) {
      assert.equal(columns.includes(column), false, column)
    }
    assert.match(columns, /glow_score/)
    assert.match(columns, /visibility/)
    assert.doesNotMatch(
      sql.match(/grant select \([\s\S]*?\) on table public\.reviews to anon, authenticated/)?.[0] ?? '',
      /user_id/,
    )
  })

  it('ships a post-migration SQL check for anon and authenticated', () => {
    const check = readFileSync(
      new URL('../supabase/tests/rls_directory_policies.sql', import.meta.url),
      'utf8',
    ).toLowerCase()
    assert.match(check, /set local role/)
    assert.match(check, /assert_closed_table\('anon', 'clinic_contacts'\)/)
    assert.match(check, /assert_closed_table\('authenticated', 'clinic_contacts'\)/)
    assert.match(check, /assert_closed_table\('anon', 'subscriptions'\)/)
    assert.match(check, /assert_closed_table\('authenticated', 'subscriptions'\)/)
    assert.match(check, /has_column_privilege/)
    assert.match(check, /insufficient_privilege/)
    assert.match(check, /row_count <> 0/)
    assert.match(check, /select \* from public\.clinics/)
    assert.doesNotMatch(check, /insert into/)
    assert.doesNotMatch(check, /delete from/)
    for (const column of [
      'email',
      'contact_email',
      'stripe_customer_id',
      'subscription_id',
      'claim_tier',
      'plan',
      'place_id',
    ]) {
      assert.match(check, new RegExp(`assert_column_denied\\('anon', '${column}'\\)`))
      assert.match(check, new RegExp(`assert_column_denied\\('authenticated', '${column}'\\)`))
    }
  })

  it('restores service_role table access and does not drop data', () => {
    for (const table of tables) {
      assert.match(sql, new RegExp(`grant all on table public\\.${table} to service_role`))
    }
    assert.doesNotMatch(sql, /drop table/)
    assert.doesNotMatch(sql, /truncate/)
  })
})
