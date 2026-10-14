BEGIN;

-- Harden the workspace authorization helpers used by RLS. The empty search
-- path and fully qualified relations prevent object-shadowing attacks.
CREATE OR REPLACE FUNCTION public.user_belongs_to_workspace(
  p_workspace_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.workspace_members AS wm
    WHERE wm.workspace_id = p_workspace_id
      AND wm.user_id = auth.uid()
  );
$function$;

CREATE OR REPLACE FUNCTION public.check_user_workspace_role(
  p_workspace_id uuid,
  p_user_id uuid,
  p_min_role text DEFAULT 'member'
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
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
$function$;

CREATE OR REPLACE FUNCTION public.create_workspace(
  p_name text,
  p_slug text
)
RETURNS public.workspaces
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
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
$function$;

-- Onboarding used to create a separate tenant and tenant_users row. Create
-- the canonical workspace, owner membership, and initial location atomically.
CREATE OR REPLACE FUNCTION public.create_workspace_with_location(
  p_name text,
  p_slug text,
  p_location_name text
)
RETURNS public.workspaces
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
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
$function$;

REVOKE ALL ON FUNCTION public.user_belongs_to_workspace(uuid)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.user_belongs_to_workspace(uuid)
  TO authenticated;

REVOKE ALL ON FUNCTION public.check_user_workspace_role(uuid, uuid, text)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.check_user_workspace_role(uuid, uuid, text)
  TO authenticated;

REVOKE ALL ON FUNCTION public.create_workspace(text, text)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_workspace(text, text)
  TO authenticated;

REVOKE ALL ON FUNCTION public.create_workspace_with_location(text, text, text)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_workspace_with_location(text, text, text)
  TO authenticated;

-- Keep review and location ownership aligned. The explicit workspace FK on
-- reviews is retained as well; this composite FK prevents cross-workspace
-- location references.
DO $migration$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.locations'::regclass
      AND conname = 'locations_id_workspace_id_key'
  ) THEN
    ALTER TABLE public.locations
      ADD CONSTRAINT locations_id_workspace_id_key
      UNIQUE (id, workspace_id);
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.reviews AS r
    JOIN public.locations AS l ON l.id = r.location_id
    WHERE r.workspace_id IS DISTINCT FROM l.workspace_id
  ) THEN
    RAISE EXCEPTION
      'Cannot add reviews location/workspace foreign key: reviews contain rows whose workspace_id differs from the referenced location';
  END IF;

  ALTER TABLE public.reviews
    DROP CONSTRAINT IF EXISTS reviews_location_id_fkey;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.reviews'::regclass
      AND conname = 'reviews_location_workspace_fkey'
  ) THEN
    ALTER TABLE public.reviews
      ADD CONSTRAINT reviews_location_workspace_fkey
      FOREIGN KEY (location_id, workspace_id)
      REFERENCES public.locations (id, workspace_id)
      ON DELETE CASCADE
      NOT VALID;
  END IF;
END;
$migration$;

ALTER TABLE public.reviews
  VALIDATE CONSTRAINT reviews_location_workspace_fkey;

ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Workspaces: members may read; owners/admins may update or delete.
DROP POLICY IF EXISTS "Users can view their workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "Users can view workspaces they belong to" ON public.workspaces;
DROP POLICY IF EXISTS "Workspace owners and admins can update workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "Workspace owners and admins can delete workspaces" ON public.workspaces;
DROP POLICY IF EXISTS workspaces_select_member ON public.workspaces;
DROP POLICY IF EXISTS workspaces_update_admin ON public.workspaces;
DROP POLICY IF EXISTS workspaces_delete_admin ON public.workspaces;

CREATE POLICY workspaces_select_member
  ON public.workspaces
  FOR SELECT
  TO authenticated
  USING ((SELECT public.user_belongs_to_workspace(id)));

CREATE POLICY workspaces_update_admin
  ON public.workspaces
  FOR UPDATE
  TO authenticated
  USING ((SELECT public.check_user_workspace_role(id, auth.uid(), 'admin')))
  WITH CHECK ((SELECT public.check_user_workspace_role(id, auth.uid(), 'admin')));

CREATE POLICY workspaces_delete_admin
  ON public.workspaces
  FOR DELETE
  TO authenticated
  USING ((SELECT public.check_user_workspace_role(id, auth.uid(), 'admin')));

-- Memberships: members may view the roster; only owners/admins may add or
-- remove memberships. Workspace creation is performed by the definer RPC.
DROP POLICY IF EXISTS "Admins and owners can add members" ON public.workspace_members;
DROP POLICY IF EXISTS "Admins and owners can remove members" ON public.workspace_members;
DROP POLICY IF EXISTS "Members can view workspace members" ON public.workspace_members;
DROP POLICY IF EXISTS "Users can view members in their workspace" ON public.workspace_members;
DROP POLICY IF EXISTS "Users can view members of their workspaces" ON public.workspace_members;
DROP POLICY IF EXISTS workspace_members_select_member ON public.workspace_members;
DROP POLICY IF EXISTS workspace_members_insert_admin ON public.workspace_members;
DROP POLICY IF EXISTS workspace_members_delete_admin ON public.workspace_members;

CREATE POLICY workspace_members_select_member
  ON public.workspace_members
  FOR SELECT
  TO authenticated
  USING ((SELECT public.user_belongs_to_workspace(workspace_id)));

CREATE POLICY workspace_members_insert_admin
  ON public.workspace_members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT public.check_user_workspace_role(workspace_id, auth.uid(), 'admin'))
  );

CREATE POLICY workspace_members_delete_admin
  ON public.workspace_members
  FOR DELETE
  TO authenticated
  USING (
    (SELECT public.check_user_workspace_role(workspace_id, auth.uid(), 'admin'))
  );

-- Preserve current member CRUD behavior while replacing overlapping policies
-- with one workspace-scoped policy per table.
DROP POLICY IF EXISTS "Users can insert locations in their workspace" ON public.locations;
DROP POLICY IF EXISTS "Users can manage locations in their workspace" ON public.locations;
DROP POLICY IF EXISTS "Users can update locations in their workspace" ON public.locations;
DROP POLICY IF EXISTS "Users can view locations in their workspace" ON public.locations;
DROP POLICY IF EXISTS "Users can view locations of their workspaces" ON public.locations;
DROP POLICY IF EXISTS "Workspace members can create locations" ON public.locations;
DROP POLICY IF EXISTS locations_manage_workspace ON public.locations;

CREATE POLICY locations_manage_workspace
  ON public.locations
  FOR ALL
  TO authenticated
  USING ((SELECT public.user_belongs_to_workspace(workspace_id)))
  WITH CHECK ((SELECT public.user_belongs_to_workspace(workspace_id)));

DROP POLICY IF EXISTS "Users can insert reviews in their workspace" ON public.reviews;
DROP POLICY IF EXISTS "Users can manage reviews in their workspace" ON public.reviews;
DROP POLICY IF EXISTS "Users can manage reviews of their workspaces" ON public.reviews;
DROP POLICY IF EXISTS "Users can update reviews in their workspace" ON public.reviews;
DROP POLICY IF EXISTS "Users can view reviews in their workspace" ON public.reviews;
DROP POLICY IF EXISTS "Users can view reviews of their workspaces" ON public.reviews;
DROP POLICY IF EXISTS reviews_manage_workspace ON public.reviews;

CREATE POLICY reviews_manage_workspace
  ON public.reviews
  FOR ALL
  TO authenticated
  USING ((SELECT public.user_belongs_to_workspace(workspace_id)))
  WITH CHECK ((SELECT public.user_belongs_to_workspace(workspace_id)));

-- Retain the legacy tables and data for operational_digests and any required
-- archival, but prevent client roles from using the old tenant model.
DROP POLICY IF EXISTS "Users can insert their own tenants" ON public.tenants;
DROP POLICY IF EXISTS "Users can view their own tenants" ON public.tenants;
DROP POLICY IF EXISTS "Users can insert their own memberships" ON public.tenant_users;
DROP POLICY IF EXISTS "Users can view their own tenant memberships" ON public.tenant_users;

REVOKE ALL ON TABLE public.tenants FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.tenant_users FROM PUBLIC, anon, authenticated;

COMMENT ON TABLE public.tenants IS
  'Deprecated legacy model. New application data must use workspaces/workspace_members. Retained for legacy operational_digests references; archive or migrate dependent data before removal.';
COMMENT ON TABLE public.tenant_users IS
  'Deprecated legacy model. New application data must use workspaces/workspace_members. Table and rows retained pending legacy data review.';

COMMIT;
