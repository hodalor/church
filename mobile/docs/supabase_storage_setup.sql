-- Prynova Supabase Storage Setup
-- Assumption:
-- These policies rely on Supabase Auth JWT custom claims that include:
--   tenantId: the church tenant slug
--   role: the user's ministry role
-- If uploads are authenticated only with a custom Node.js JWT, mirror the
-- session into Supabase Auth or proxy uploads through a trusted backend.

insert into storage.buckets (id, name, public)
values
  ('member-photos', 'member-photos', true),
  ('church-media', 'church-media', true),
  ('documents', 'documents', false)
on conflict (id) do nothing;

-- member-photos
create policy "Public read member photos"
on storage.objects for select
to public
using (bucket_id = 'member-photos');

create policy "Tenant members can upload member photos"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'member-photos'
  and coalesce(auth.jwt() ->> 'tenantId', '') <> ''
  and (storage.foldername(name))[1] = (auth.jwt() ->> 'tenantId')
);

-- church-media
create policy "Public read church media"
on storage.objects for select
to public
using (bucket_id = 'church-media');

create policy "Authenticated tenant users can upload church media"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'church-media'
  and coalesce(auth.jwt() ->> 'tenantId', '') <> ''
  and (storage.foldername(name))[1] = (auth.jwt() ->> 'tenantId')
);

-- documents
create policy "Authorized finance and pastoral staff can read documents"
on storage.objects for select
to authenticated
using (
  bucket_id = 'documents'
  and coalesce(auth.jwt() ->> 'tenantId', '') <> ''
  and (storage.foldername(name))[1] = (auth.jwt() ->> 'tenantId')
  and coalesce(auth.jwt() ->> 'role', '') in (
    'treasurer',
    'head_pastor',
    'associate_pastor',
    'branch_pastor',
    'super_admin',
    'admin'
  )
);

create policy "Authorized finance and pastoral staff can upload documents"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'documents'
  and coalesce(auth.jwt() ->> 'tenantId', '') <> ''
  and (storage.foldername(name))[1] = (auth.jwt() ->> 'tenantId')
  and coalesce(auth.jwt() ->> 'role', '') in (
    'treasurer',
    'head_pastor',
    'associate_pastor',
    'branch_pastor',
    'super_admin',
    'admin'
  )
);
