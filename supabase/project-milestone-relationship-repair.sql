do $$
begin
  if not exists (
    select 1
    from pg_constraint c
    where c.conrelid = 'public.project_milestones'::regclass
      and c.confrelid = 'public.projects'::regclass
      and c.contype = 'f'
      and c.conkey = array[(
        select a.attnum
        from pg_attribute a
        where a.attrelid = 'public.project_milestones'::regclass
          and a.attname = 'project_id'
          and not a.attisdropped
      )]::smallint[]
  ) then
    alter table public.project_milestones
      add constraint project_milestones_project_id_fkey
      foreign key (project_id) references public.projects(id) on delete cascade;
  end if;
end
$$;

notify pgrst, 'reload schema';
