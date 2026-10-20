drop policy "Users can manage their own integrations" on "public"."user_integrations";

drop policy "workspace_members_delete_admin" on "public"."workspace_members";

drop policy "workspace_members_insert_admin" on "public"."workspace_members";


  create policy "Users can manage their own integrations"
  on "public"."user_integrations"
  as permissive
  for all
  to authenticated
using ((auth.uid() = user_id))
with check ((auth.uid() = user_id));



  create policy "workspace_members_delete_admin"
  on "public"."workspace_members"
  as permissive
  for delete
  to authenticated
using ((public.check_user_workspace_role(workspace_id, auth.uid(), 'admin'::text) AND (role <> 'owner'::text)));



  create policy "workspace_members_insert_admin"
  on "public"."workspace_members"
  as permissive
  for insert
  to authenticated
with check ((public.check_user_workspace_role(workspace_id, auth.uid(), 'admin'::text) AND (role = ANY (ARRAY['admin'::text, 'member'::text]))));



