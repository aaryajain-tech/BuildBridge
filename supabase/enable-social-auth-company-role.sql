-- Company OAuth signup should call this only after the provider redirects back,
-- based on a one-time signup intent stored in the browser by the app.
create or replace function public.request_company_role() returns void language plpgsql security definer set search_path=public as $$ begin update public.profiles set role='company_member' where id=auth.uid() and role='student'; end $$;
grant execute on function public.request_company_role() to authenticated;
