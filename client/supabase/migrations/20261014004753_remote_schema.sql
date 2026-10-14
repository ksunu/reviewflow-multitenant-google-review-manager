drop extension if exists "pg_net";

create type "public"."review_status" as enum ('pending', 'replied', 'flagged');


  create table "public"."locations" (
    "id" uuid not null default gen_random_uuid(),
    "workspace_id" uuid not null,
    "name" text not null,
    "google_place_id" text,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "address" text,
    "latitude" double precision,
    "longitude" double precision,
    "business_type" text default 'local business'::text,
    "last_synced_at" timestamp with time zone
      );


alter table "public"."locations" enable row level security;


  create table "public"."operational_digests" (
    "id" uuid not null default gen_random_uuid(),
    "tenant_id" uuid,
    "summary_bullet_points" jsonb not null,
    "week_start_date" date not null,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."operational_digests" enable row level security;


  create table "public"."reviews" (
    "id" uuid not null default gen_random_uuid(),
    "workspace_id" uuid not null,
    "location_id" uuid not null,
    "rating" integer not null,
    "author_name" text,
    "comment" text,
    "sentiment" text,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "ai_response" text,
    "status" public.review_status default 'pending'::public.review_status,
    "author_image" text,
    "author_url" text,
    "profile_photo_url" text,
    "review_date" text,
    "review_text" text,
    "source" text,
    "relative_time_description" text,
    "original_language" text,
    "author_id" text,
    "google_review_id" text,
    "ai_reply_draft" text,
    "reply_status" text default 'unreplied'::text
      );


alter table "public"."reviews" enable row level security;


  create table "public"."tenant_users" (
    "id" uuid not null default gen_random_uuid(),
    "tenant_id" uuid not null,
    "user_id" uuid not null,
    "role" text default 'owner'::text,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."tenant_users" enable row level security;


  create table "public"."tenants" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "stripe_customer_id" text,
    "subscription_status" text default 'trialing'::text,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."tenants" enable row level security;


  create table "public"."user_integrations" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "provider" text not null default 'google'::text,
    "access_token" text,
    "refresh_token" text,
    "expires_at" timestamp with time zone,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."user_integrations" enable row level security;


  create table "public"."workspace_members" (
    "id" uuid not null default gen_random_uuid(),
    "workspace_id" uuid not null,
    "user_id" uuid not null,
    "role" text not null default 'member'::text,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now())
      );


alter table "public"."workspace_members" enable row level security;


  create table "public"."workspaces" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "slug" text not null,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "business_type" text default 'local business'::text,
    "ai_replies_used_this_month" integer default 0,
    "ai_reply_limit" integer default 10
      );


alter table "public"."workspaces" enable row level security;

CREATE UNIQUE INDEX locations_id_workspace_id_key ON public.locations USING btree (id, workspace_id);

CREATE UNIQUE INDEX locations_pkey ON public.locations USING btree (id);

CREATE UNIQUE INDEX operational_digests_pkey ON public.operational_digests USING btree (id);

CREATE UNIQUE INDEX reviews_pkey ON public.reviews USING btree (id);

CREATE UNIQUE INDEX reviews_unique_constraint ON public.reviews USING btree (workspace_id, location_id, review_date, author_name);

CREATE UNIQUE INDEX reviews_unique_natural_key ON public.reviews USING btree (workspace_id, location_id, review_date, author_name);

CREATE UNIQUE INDEX reviews_workspace_location_review_identity_idx ON public.reviews USING btree (workspace_id, location_id, review_date, author_name);

CREATE UNIQUE INDEX tenant_users_pkey ON public.tenant_users USING btree (id);

CREATE UNIQUE INDEX tenant_users_tenant_id_user_id_key ON public.tenant_users USING btree (tenant_id, user_id);

CREATE UNIQUE INDEX tenants_pkey ON public.tenants USING btree (id);

CREATE UNIQUE INDEX user_integrations_pkey ON public.user_integrations USING btree (id);

CREATE UNIQUE INDEX user_integrations_user_id_provider_key ON public.user_integrations USING btree (user_id, provider);

CREATE UNIQUE INDEX workspace_members_pkey ON public.workspace_members USING btree (id);

CREATE UNIQUE INDEX workspace_members_workspace_id_user_id_key ON public.workspace_members USING btree (workspace_id, user_id);

CREATE UNIQUE INDEX workspaces_pkey ON public.workspaces USING btree (id);

CREATE UNIQUE INDEX workspaces_slug_key ON public.workspaces USING btree (slug);

alter table "public"."locations" add constraint "locations_pkey" PRIMARY KEY using index "locations_pkey";

alter table "public"."operational_digests" add constraint "operational_digests_pkey" PRIMARY KEY using index "operational_digests_pkey";

alter table "public"."reviews" add constraint "reviews_pkey" PRIMARY KEY using index "reviews_pkey";

alter table "public"."tenant_users" add constraint "tenant_users_pkey" PRIMARY KEY using index "tenant_users_pkey";

alter table "public"."tenants" add constraint "tenants_pkey" PRIMARY KEY using index "tenants_pkey";

alter table "public"."user_integrations" add constraint "user_integrations_pkey" PRIMARY KEY using index "user_integrations_pkey";

alter table "public"."workspace_members" add constraint "workspace_members_pkey" PRIMARY KEY using index "workspace_members_pkey";

alter table "public"."workspaces" add constraint "workspaces_pkey" PRIMARY KEY using index "workspaces_pkey";

alter table "public"."locations" add constraint "locations_id_workspace_id_key" UNIQUE using index "locations_id_workspace_id_key";

alter table "public"."locations" add constraint "locations_workspace_id_fkey" FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE not valid;

alter table "public"."locations" validate constraint "locations_workspace_id_fkey";

alter table "public"."operational_digests" add constraint "operational_digests_tenant_id_fkey" FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE not valid;

alter table "public"."operational_digests" validate constraint "operational_digests_tenant_id_fkey";

alter table "public"."reviews" add constraint "reviews_location_workspace_fkey" FOREIGN KEY (location_id, workspace_id) REFERENCES public.locations(id, workspace_id) ON DELETE CASCADE not valid;

alter table "public"."reviews" validate constraint "reviews_location_workspace_fkey";

alter table "public"."reviews" add constraint "reviews_rating_check" CHECK (((rating >= 1) AND (rating <= 5))) not valid;

alter table "public"."reviews" validate constraint "reviews_rating_check";

alter table "public"."reviews" add constraint "reviews_unique_constraint" UNIQUE using index "reviews_unique_constraint";

alter table "public"."reviews" add constraint "reviews_unique_natural_key" UNIQUE using index "reviews_unique_natural_key";

alter table "public"."reviews" add constraint "reviews_workspace_id_fkey" FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE not valid;

alter table "public"."reviews" validate constraint "reviews_workspace_id_fkey";

alter table "public"."tenant_users" add constraint "tenant_users_role_check" CHECK ((role = ANY (ARRAY['owner'::text, 'manager'::text, 'staff'::text]))) not valid;

alter table "public"."tenant_users" validate constraint "tenant_users_role_check";

alter table "public"."tenant_users" add constraint "tenant_users_tenant_id_fkey" FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE not valid;

alter table "public"."tenant_users" validate constraint "tenant_users_tenant_id_fkey";

alter table "public"."tenant_users" add constraint "tenant_users_tenant_id_user_id_key" UNIQUE using index "tenant_users_tenant_id_user_id_key";

alter table "public"."tenant_users" add constraint "tenant_users_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."tenant_users" validate constraint "tenant_users_user_id_fkey";

alter table "public"."user_integrations" add constraint "user_integrations_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."user_integrations" validate constraint "user_integrations_user_id_fkey";

alter table "public"."user_integrations" add constraint "user_integrations_user_id_provider_key" UNIQUE using index "user_integrations_user_id_provider_key";

alter table "public"."workspace_members" add constraint "workspace_members_role_check" CHECK ((role = ANY (ARRAY['owner'::text, 'admin'::text, 'member'::text]))) not valid;

alter table "public"."workspace_members" validate constraint "workspace_members_role_check";

alter table "public"."workspace_members" add constraint "workspace_members_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."workspace_members" validate constraint "workspace_members_user_id_fkey";

alter table "public"."workspace_members" add constraint "workspace_members_workspace_id_fkey" FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE not valid;

alter table "public"."workspace_members" validate constraint "workspace_members_workspace_id_fkey";

alter table "public"."workspace_members" add constraint "workspace_members_workspace_id_user_id_key" UNIQUE using index "workspace_members_workspace_id_user_id_key";

alter table "public"."workspaces" add constraint "workspaces_slug_key" UNIQUE using index "workspaces_slug_key";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.check_user_workspace_role(p_workspace_id uuid, p_user_id uuid, p_min_role text DEFAULT 'member'::text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.workspace_members AS wm
    WHERE wm.workspace_id = p_workspace_id
      AND wm.user_id = p_user_id
      AND p_user_id = auth.uid()
      AND CASE p_min_role
        WHEN 'member' THEN wm.role IN ('owner', 'admin', 'member')
        WHEN 'admin' THEN wm.role IN ('owner', 'admin')
        WHEN 'owner' THEN wm.role = 'owner'
        ELSE false
      END
  );
$function$
;

CREATE OR REPLACE FUNCTION public.create_workspace(p_name text, p_slug text)
 RETURNS public.workspaces
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  v_workspace public.workspaces;
  v_user_id uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'AUTHENTICATION_REQUIRED';
  END IF;

  IF nullif(btrim(p_name), '') IS NULL
     OR nullif(btrim(p_slug), '') IS NULL THEN
    RAISE EXCEPTION 'WORKSPACE_NAME_AND_SLUG_REQUIRED';
  END IF;

  INSERT INTO public.workspaces (name, slug)
  VALUES (btrim(p_name), btrim(p_slug))
  RETURNING * INTO v_workspace;

  INSERT INTO public.workspace_members (workspace_id, user_id, role)
  VALUES (v_workspace.id, v_user_id, 'owner');

  RETURN v_workspace;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.create_workspace_with_location(p_name text, p_slug text, p_location_name text)
 RETURNS public.workspaces
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  v_workspace public.workspaces;
  v_user_id uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'AUTHENTICATION_REQUIRED';
  END IF;

  IF nullif(btrim(p_name), '') IS NULL
     OR nullif(btrim(p_slug), '') IS NULL
     OR nullif(btrim(p_location_name), '') IS NULL THEN
    RAISE EXCEPTION 'WORKSPACE_NAME_SLUG_AND_LOCATION_REQUIRED';
  END IF;

  INSERT INTO public.workspaces (name, slug)
  VALUES (btrim(p_name), btrim(p_slug))
  RETURNING * INTO v_workspace;

  INSERT INTO public.workspace_members (workspace_id, user_id, role)
  VALUES (v_workspace.id, v_user_id, 'owner');

  INSERT INTO public.locations (workspace_id, name)
  VALUES (v_workspace.id, btrim(p_location_name));

  RETURN v_workspace;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.save_ai_reply_atomically(p_workspace_id uuid, p_review_id uuid, p_reply text, p_sentiment text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public', 'auth', 'pg_temp'
AS $function$
DECLARE
  v_reply_limit integer;
  v_replies_used integer;
  v_review_reply_status text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION USING errcode = 'P0001', message = 'UNAUTHORIZED';
  END IF;

  IF p_reply IS NULL
    OR length(btrim(p_reply)) = 0
    OR length(p_reply) > 5000
    OR (
      p_sentiment IS NOT NULL
      AND p_sentiment NOT IN ('positive', 'neutral', 'negative')
    ) THEN
    RAISE EXCEPTION USING errcode = 'P0001', message = 'INVALID_REPLY';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.workspace_members AS wm
    WHERE wm.workspace_id = p_workspace_id
      AND wm.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION USING errcode = 'P0001', message = 'WORKSPACE_FORBIDDEN';
  END IF;

  SELECT
    coalesce(nullif(w.ai_reply_limit, 0), 10),
    coalesce(w.ai_replies_used_this_month, 0)
  INTO v_reply_limit, v_replies_used
  FROM public.workspaces AS w
  WHERE w.id = p_workspace_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION USING errcode = 'P0001', message = 'WORKSPACE_NOT_FOUND';
  END IF;

  SELECT r.reply_status
  INTO v_review_reply_status
  FROM public.reviews AS r
  JOIN public.locations AS l
    ON l.id = r.location_id
   AND l.workspace_id = p_workspace_id
  WHERE r.id = p_review_id
    AND r.workspace_id = p_workspace_id
  FOR UPDATE OF r;

  IF NOT FOUND THEN
    RAISE EXCEPTION USING errcode = 'P0001', message = 'REVIEW_NOT_FOUND';
  END IF;

  IF v_review_reply_status = 'posted' THEN
    RAISE EXCEPTION USING errcode = 'P0001', message = 'REVIEW_ALREADY_POSTED';
  END IF;

  IF v_replies_used >= v_reply_limit THEN
    RAISE EXCEPTION USING errcode = 'P0001', message = 'AI_REPLY_LIMIT_REACHED';
  END IF;

  UPDATE public.reviews
  SET ai_reply_draft = p_reply,
      reply_status = 'drafted',
      sentiment = coalesce(p_sentiment, sentiment)
  WHERE id = p_review_id
    AND workspace_id = p_workspace_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION USING errcode = 'P0001', message = 'REVIEW_NOT_FOUND';
  END IF;

  UPDATE public.workspaces
  SET ai_replies_used_this_month = v_replies_used + 1
  WHERE id = p_workspace_id;
  v_replies_used := v_replies_used + 1;

  RETURN jsonb_build_object('used', v_replies_used, 'limit', v_reply_limit);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.user_belongs_to_workspace(p_workspace_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.workspace_members AS wm
    WHERE wm.workspace_id = p_workspace_id
      AND wm.user_id = auth.uid()
  );
$function$
;

create or replace view "public"."workspace_review_stats" as  SELECT l.workspace_id,
    count(r.id) AS total_reviews,
    round(COALESCE(avg(r.rating), (0)::numeric), 2) AS average_rating,
    count(r.id) FILTER (WHERE (r.sentiment = 'positive'::text)) AS positive_count,
    count(r.id) FILTER (WHERE (r.sentiment = 'neutral'::text)) AS neutral_count,
    count(r.id) FILTER (WHERE (r.sentiment = 'negative'::text)) AS negative_count,
    count(r.id) FILTER (WHERE (r.reply_status = 'posted'::text)) AS posted_replies_count
   FROM (public.locations l
     LEFT JOIN public.reviews r ON ((r.location_id = l.id)))
  GROUP BY l.workspace_id;


grant delete on table "public"."locations" to "anon";

grant insert on table "public"."locations" to "anon";

grant references on table "public"."locations" to "anon";

grant select on table "public"."locations" to "anon";

grant trigger on table "public"."locations" to "anon";

grant truncate on table "public"."locations" to "anon";

grant update on table "public"."locations" to "anon";

grant delete on table "public"."locations" to "authenticated";

grant insert on table "public"."locations" to "authenticated";

grant references on table "public"."locations" to "authenticated";

grant select on table "public"."locations" to "authenticated";

grant trigger on table "public"."locations" to "authenticated";

grant truncate on table "public"."locations" to "authenticated";

grant update on table "public"."locations" to "authenticated";

grant delete on table "public"."locations" to "service_role";

grant insert on table "public"."locations" to "service_role";

grant references on table "public"."locations" to "service_role";

grant select on table "public"."locations" to "service_role";

grant trigger on table "public"."locations" to "service_role";

grant truncate on table "public"."locations" to "service_role";

grant update on table "public"."locations" to "service_role";

grant delete on table "public"."operational_digests" to "anon";

grant insert on table "public"."operational_digests" to "anon";

grant references on table "public"."operational_digests" to "anon";

grant select on table "public"."operational_digests" to "anon";

grant trigger on table "public"."operational_digests" to "anon";

grant truncate on table "public"."operational_digests" to "anon";

grant update on table "public"."operational_digests" to "anon";

grant delete on table "public"."operational_digests" to "authenticated";

grant insert on table "public"."operational_digests" to "authenticated";

grant references on table "public"."operational_digests" to "authenticated";

grant select on table "public"."operational_digests" to "authenticated";

grant trigger on table "public"."operational_digests" to "authenticated";

grant truncate on table "public"."operational_digests" to "authenticated";

grant update on table "public"."operational_digests" to "authenticated";

grant delete on table "public"."operational_digests" to "service_role";

grant insert on table "public"."operational_digests" to "service_role";

grant references on table "public"."operational_digests" to "service_role";

grant select on table "public"."operational_digests" to "service_role";

grant trigger on table "public"."operational_digests" to "service_role";

grant truncate on table "public"."operational_digests" to "service_role";

grant update on table "public"."operational_digests" to "service_role";

grant delete on table "public"."reviews" to "anon";

grant insert on table "public"."reviews" to "anon";

grant references on table "public"."reviews" to "anon";

grant select on table "public"."reviews" to "anon";

grant trigger on table "public"."reviews" to "anon";

grant truncate on table "public"."reviews" to "anon";

grant update on table "public"."reviews" to "anon";

grant delete on table "public"."reviews" to "authenticated";

grant insert on table "public"."reviews" to "authenticated";

grant references on table "public"."reviews" to "authenticated";

grant select on table "public"."reviews" to "authenticated";

grant trigger on table "public"."reviews" to "authenticated";

grant truncate on table "public"."reviews" to "authenticated";

grant update on table "public"."reviews" to "authenticated";

grant delete on table "public"."reviews" to "service_role";

grant insert on table "public"."reviews" to "service_role";

grant references on table "public"."reviews" to "service_role";

grant select on table "public"."reviews" to "service_role";

grant trigger on table "public"."reviews" to "service_role";

grant truncate on table "public"."reviews" to "service_role";

grant update on table "public"."reviews" to "service_role";

grant delete on table "public"."tenant_users" to "service_role";

grant insert on table "public"."tenant_users" to "service_role";

grant references on table "public"."tenant_users" to "service_role";

grant select on table "public"."tenant_users" to "service_role";

grant trigger on table "public"."tenant_users" to "service_role";

grant truncate on table "public"."tenant_users" to "service_role";

grant update on table "public"."tenant_users" to "service_role";

grant delete on table "public"."tenants" to "service_role";

grant insert on table "public"."tenants" to "service_role";

grant references on table "public"."tenants" to "service_role";

grant select on table "public"."tenants" to "service_role";

grant trigger on table "public"."tenants" to "service_role";

grant truncate on table "public"."tenants" to "service_role";

grant update on table "public"."tenants" to "service_role";

grant delete on table "public"."user_integrations" to "anon";

grant insert on table "public"."user_integrations" to "anon";

grant references on table "public"."user_integrations" to "anon";

grant select on table "public"."user_integrations" to "anon";

grant trigger on table "public"."user_integrations" to "anon";

grant truncate on table "public"."user_integrations" to "anon";

grant update on table "public"."user_integrations" to "anon";

grant delete on table "public"."user_integrations" to "authenticated";

grant insert on table "public"."user_integrations" to "authenticated";

grant references on table "public"."user_integrations" to "authenticated";

grant select on table "public"."user_integrations" to "authenticated";

grant trigger on table "public"."user_integrations" to "authenticated";

grant truncate on table "public"."user_integrations" to "authenticated";

grant update on table "public"."user_integrations" to "authenticated";

grant delete on table "public"."user_integrations" to "service_role";

grant insert on table "public"."user_integrations" to "service_role";

grant references on table "public"."user_integrations" to "service_role";

grant select on table "public"."user_integrations" to "service_role";

grant trigger on table "public"."user_integrations" to "service_role";

grant truncate on table "public"."user_integrations" to "service_role";

grant update on table "public"."user_integrations" to "service_role";

grant delete on table "public"."workspace_members" to "anon";

grant insert on table "public"."workspace_members" to "anon";

grant references on table "public"."workspace_members" to "anon";

grant select on table "public"."workspace_members" to "anon";

grant trigger on table "public"."workspace_members" to "anon";

grant truncate on table "public"."workspace_members" to "anon";

grant update on table "public"."workspace_members" to "anon";

grant delete on table "public"."workspace_members" to "authenticated";

grant insert on table "public"."workspace_members" to "authenticated";

grant references on table "public"."workspace_members" to "authenticated";

grant select on table "public"."workspace_members" to "authenticated";

grant trigger on table "public"."workspace_members" to "authenticated";

grant truncate on table "public"."workspace_members" to "authenticated";

grant update on table "public"."workspace_members" to "authenticated";

grant delete on table "public"."workspace_members" to "service_role";

grant insert on table "public"."workspace_members" to "service_role";

grant references on table "public"."workspace_members" to "service_role";

grant select on table "public"."workspace_members" to "service_role";

grant trigger on table "public"."workspace_members" to "service_role";

grant truncate on table "public"."workspace_members" to "service_role";

grant update on table "public"."workspace_members" to "service_role";

grant delete on table "public"."workspaces" to "anon";

grant insert on table "public"."workspaces" to "anon";

grant references on table "public"."workspaces" to "anon";

grant select on table "public"."workspaces" to "anon";

grant trigger on table "public"."workspaces" to "anon";

grant truncate on table "public"."workspaces" to "anon";

grant update on table "public"."workspaces" to "anon";

grant delete on table "public"."workspaces" to "authenticated";

grant insert on table "public"."workspaces" to "authenticated";

grant references on table "public"."workspaces" to "authenticated";

grant select on table "public"."workspaces" to "authenticated";

grant trigger on table "public"."workspaces" to "authenticated";

grant truncate on table "public"."workspaces" to "authenticated";

grant update on table "public"."workspaces" to "authenticated";

grant delete on table "public"."workspaces" to "service_role";

grant insert on table "public"."workspaces" to "service_role";

grant references on table "public"."workspaces" to "service_role";

grant select on table "public"."workspaces" to "service_role";

grant trigger on table "public"."workspaces" to "service_role";

grant truncate on table "public"."workspaces" to "service_role";

grant update on table "public"."workspaces" to "service_role";


  create policy "locations_manage_workspace"
  on "public"."locations"
  as permissive
  for all
  to authenticated
using (( SELECT public.user_belongs_to_workspace(locations.workspace_id) AS user_belongs_to_workspace))
with check (( SELECT public.user_belongs_to_workspace(locations.workspace_id) AS user_belongs_to_workspace));



  create policy "reviews_manage_workspace"
  on "public"."reviews"
  as permissive
  for all
  to authenticated
using (( SELECT public.user_belongs_to_workspace(reviews.workspace_id) AS user_belongs_to_workspace))
with check (( SELECT public.user_belongs_to_workspace(reviews.workspace_id) AS user_belongs_to_workspace));



  create policy "Users can manage their own integrations"
  on "public"."user_integrations"
  as permissive
  for all
  to public
using ((auth.uid() = user_id))
with check ((auth.uid() = user_id));



  create policy "workspace_members_delete_admin"
  on "public"."workspace_members"
  as permissive
  for delete
  to authenticated
using (( SELECT public.check_user_workspace_role(workspace_members.workspace_id, auth.uid(), 'admin'::text) AS check_user_workspace_role));



  create policy "workspace_members_insert_admin"
  on "public"."workspace_members"
  as permissive
  for insert
  to authenticated
with check (( SELECT public.check_user_workspace_role(workspace_members.workspace_id, auth.uid(), 'admin'::text) AS check_user_workspace_role));



  create policy "workspace_members_select_member"
  on "public"."workspace_members"
  as permissive
  for select
  to authenticated
using (( SELECT public.user_belongs_to_workspace(workspace_members.workspace_id) AS user_belongs_to_workspace));



  create policy "workspaces_delete_admin"
  on "public"."workspaces"
  as permissive
  for delete
  to authenticated
using (( SELECT public.check_user_workspace_role(workspaces.id, auth.uid(), 'admin'::text) AS check_user_workspace_role));



  create policy "workspaces_select_member"
  on "public"."workspaces"
  as permissive
  for select
  to authenticated
using (( SELECT public.user_belongs_to_workspace(workspaces.id) AS user_belongs_to_workspace));



  create policy "workspaces_update_admin"
  on "public"."workspaces"
  as permissive
  for update
  to authenticated
using (( SELECT public.check_user_workspace_role(workspaces.id, auth.uid(), 'admin'::text) AS check_user_workspace_role))
with check (( SELECT public.check_user_workspace_role(workspaces.id, auth.uid(), 'admin'::text) AS check_user_workspace_role));



