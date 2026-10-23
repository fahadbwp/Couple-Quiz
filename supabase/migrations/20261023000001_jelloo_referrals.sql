-- Additive, repeatable migration. Do not run on production without owner approval.
begin;
create table if not exists public.jelloo_referral_people (
  actor text primary key check(actor ~ '^[0-9a-f]{64}$'),
  code text not null unique check(code ~ '^[0-9a-f]{32}$'),
  link_expires timestamptz not null default now()+interval '30 days',
  qualified integer not null default 0 check(qualified>=0),
  created_at timestamptz not null default now()
);
create table if not exists public.jelloo_referral_edges (
  guest text primary key references public.jelloo_referral_people(actor),
  inviter text not null references public.jelloo_referral_people(actor),
  qualified_at timestamptz,
  created_at timestamptz not null default now(),
  check(guest<>inviter)
);
create index if not exists jelloo_edges_inviter on public.jelloo_referral_edges(inviter,qualified_at);
create table if not exists public.jelloo_referral_sessions (
  guest text primary key references public.jelloo_referral_edges(guest),
  id uuid not null unique default gen_random_uuid(),
  nonce uuid not null default gen_random_uuid(),
  revision text not null check(revision ~ '^[0-9a-f]{64}$'),
  level integer not null default 1 check(level between 1 and 11),
  expires timestamptz not null default now()+interval '24 hours',
  last_nonce uuid, last_digest text, last_level integer
);
create table if not exists public.jelloo_referral_rewards (
  actor text not null references public.jelloo_referral_people(actor),
  threshold integer not null check(threshold in (1,3,5)),
  earned_at timestamptz not null default now(),
  primary key(actor,threshold)
);
create table if not exists public.jelloo_referral_limits (
  bucket text primary key,
  started timestamptz not null default now(),
  hits integer not null check(hits>=0)
);
create index if not exists jelloo_limits_cleanup on public.jelloo_referral_limits(started);

alter table public.jelloo_referral_people enable row level security;
alter table public.jelloo_referral_edges enable row level security;
alter table public.jelloo_referral_sessions enable row level security;
alter table public.jelloo_referral_rewards enable row level security;
alter table public.jelloo_referral_limits enable row level security;
-- No anon/authenticated policies: only the server RPC can access referral state.
revoke all on public.jelloo_referral_people,public.jelloo_referral_edges,public.jelloo_referral_sessions,public.jelloo_referral_rewards,public.jelloo_referral_limits from public,anon,authenticated,service_role;

create or replace function public.jelloo_referral_rpc(p_op text,p_actor text,p_data jsonb)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public as $$
declare
  person public.jelloo_referral_people%rowtype;
  edge public.jelloo_referral_edges%rowtype;
  sess public.jelloo_referral_sessions%rowtype;
  inviter_actor text; n integer; ip_hits integer; actor_hits integer; challenge jsonb; reward_list jsonb;
begin
  if p_actor is null or p_actor !~ '^[0-9a-f]{64}$' or p_data is null then return jsonb_build_object('error','invalid'); end if;
  if p_op='limit' then
    if (p_data->>'ip') is null or (p_data->>'ip') !~ '^[0-9a-f]{64}$' then return jsonb_build_object('error','invalid'); end if;
    -- Separate minute buckets; shared proxy fallback is intentionally conservative.
    insert into public.jelloo_referral_limits(bucket,hits) values('ip:'||(p_data->>'ip'),1)
    on conflict(bucket) do update set hits=case when jelloo_referral_limits.started < now()-interval '1 minute' then 1 else jelloo_referral_limits.hits+1 end,
      started=case when jelloo_referral_limits.started < now()-interval '1 minute' then now() else jelloo_referral_limits.started end returning hits into ip_hits;
    if ip_hits>120 then return jsonb_build_object('error','rate_limited'); end if;
    insert into public.jelloo_referral_limits(bucket,hits) values('actor:'||p_actor,1)
    on conflict(bucket) do update set hits=case when jelloo_referral_limits.started < now()-interval '1 minute' then 1 else jelloo_referral_limits.hits+1 end,
      started=case when jelloo_referral_limits.started < now()-interval '1 minute' then now() else jelloo_referral_limits.started end returning hits into actor_hits;
    if actor_hits>40 then return jsonb_build_object('error','rate_limited'); end if;
    return jsonb_build_object('ok',true);
  end if;
  -- Serializes concurrent starts/advances/retries for this anonymous identity.
  perform pg_advisory_xact_lock(hashtextextended(p_actor,0));
  if p_op='register' then
    insert into public.jelloo_referral_people(actor,code) values(p_actor,p_data->>'code') on conflict(actor) do nothing;
  end if;
  select * into person from public.jelloo_referral_people where actor=p_actor;
  if not found then return jsonb_build_object('error','unauthorized'); end if;
  select * into edge from public.jelloo_referral_edges where guest=p_actor;
  if p_op='renew' then
    update public.jelloo_referral_people set code=p_data->>'code',link_expires=now()+interval '30 days' where actor=p_actor returning * into person;
  elsif p_op='start' then
    select actor into inviter_actor from public.jelloo_referral_people where code=p_data->>'code' and link_expires>now();
    if inviter_actor is null then return jsonb_build_object('error','invalid_link'); end if;
    if inviter_actor=p_actor then return jsonb_build_object('error','self_referral'); end if;
    if edge.guest is not null and edge.inviter<>inviter_actor then return jsonb_build_object('error','already_attributed'); end if;
    insert into public.jelloo_referral_edges(guest,inviter) values(p_actor,inviter_actor) on conflict(guest) do nothing;
    select * into edge from public.jelloo_referral_edges where guest=p_actor;
    if edge.qualified_at is null then
      insert into public.jelloo_referral_sessions(guest,revision) values(p_actor,p_data->>'revision')
      on conflict(guest) do update set id=gen_random_uuid(),nonce=gen_random_uuid(),revision=excluded.revision,level=1,
        expires=now()+interval '24 hours',last_nonce=null,last_digest=null,last_level=null
      where jelloo_referral_sessions.expires<=now() or jelloo_referral_sessions.revision<>excluded.revision;
    end if;
  elsif p_op='advance' then
    select * into sess from public.jelloo_referral_sessions where guest=p_actor for update;
    if sess.guest is null or sess.id::text<>p_data->>'id' then return jsonb_build_object('error','invalid_session'); end if;
    if sess.expires<=now() then return jsonb_build_object('error','expired'); end if;
    if sess.revision<>p_data->>'revision' then return jsonb_build_object('error','revision'); end if;
    if sess.last_nonce::text=p_data->>'nonce' then
      if sess.last_digest<>p_data->>'digest' or sess.last_level<>(p_data->>'level')::integer then return jsonb_build_object('error','replay'); end if;
      -- Exact retry of the latest accepted request: fall through to current status.
    else
      if sess.nonce::text<>p_data->>'nonce' or sess.level<>(p_data->>'level')::integer or sess.level>10 then return jsonb_build_object('error','replay'); end if;
      update public.jelloo_referral_sessions set level=level+1,last_nonce=nonce,last_digest=p_data->>'digest',last_level=level,nonce=gen_random_uuid() where guest=p_actor;
      if sess.level=10 then
        update public.jelloo_referral_edges set qualified_at=now() where guest=p_actor and qualified_at is null returning inviter into inviter_actor;
        if found then
          -- Row update serializes different guests qualifying for one inviter.
          update public.jelloo_referral_people set qualified=qualified+1 where actor=inviter_actor returning qualified into n;
          insert into public.jelloo_referral_rewards(actor,threshold)
            select inviter_actor,t from unnest(array[1,3,5]) as t where t<=n on conflict do nothing;
        end if;
      end if;
    end if;
  elsif p_op not in ('status','register') then return jsonb_build_object('error','invalid');
  end if;
  select * into person from public.jelloo_referral_people where actor=p_actor;
  select * into edge from public.jelloo_referral_edges where guest=p_actor;
  select * into sess from public.jelloo_referral_sessions where guest=p_actor;
  if sess.guest is not null and sess.level<=10 and edge.qualified_at is null then
    challenge=jsonb_build_object('id',sess.id,'nonce',sess.nonce,'revision',sess.revision,'level',sess.level,'expires',sess.expires);
  end if;
  select coalesce(jsonb_agg(threshold order by threshold),'[]'::jsonb) into reward_list from public.jelloo_referral_rewards where actor=p_actor;
  select count(*) into n from public.jelloo_referral_edges where inviter=p_actor and qualified_at is null;
  return jsonb_build_object('code',person.code,'linkExpires',person.link_expires,'qualified',person.qualified,'pending',n,'rewards',reward_list,
    'referred',case when edge.guest is null then 'none' when edge.qualified_at is null then 'pending' else 'qualified' end,'challenge',challenge);
end $$;
revoke all on function public.jelloo_referral_rpc(text,text,jsonb) from public,anon,authenticated;
grant execute on function public.jelloo_referral_rpc(text,text,jsonb) to service_role;
commit;
