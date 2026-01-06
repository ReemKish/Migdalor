-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- Enable RLS on your other tables

-- Users policies
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Admin policies (adjust based on your needs)
CREATE POLICY "Admins can view all users" ON users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 02_rls.sql
-- Row Level Security policies matching the provided JSON "rls" sections

-- Helper note:
-- - Admin check: public.is_admin()
-- - Current email: public.current_email()
-- - Current hackalon team: public.current_hackalon_team()

-- ---------- Enable RLS ----------
alter table public.classroomkey           enable row level security;
alter table public.crew                    enable row level security;
alter table public.waitingqueue            enable row level security;
alter table public.lesson                  enable row level security;
alter table public.squad                   enable row level security;
alter table public.position_role                enable row level security;
alter table public.zone                    enable row level security;
alter table public.positionpermission     enable row level security;
alter table public.hackalon_department     enable row level security;
alter table public.hackalon_team           enable row level security;
alter table public.hackalon_submission     enable row level security;
alter table public.hackalon_scheduleitem  enable row level security;

-- ---------- Admin-only tables (create/update/delete/write => admin) ----------
-- For these, we will:
-- - Allow SELECT to admin only (tightest default; widen if you need general read access).
-- - Allow INSERT/UPDATE/DELETE to admin only.

-- classroomkeys
drop policy if exists classroomkeys_admin_select on public.classroomkey;
create policy classroomkeys_admin_select
on public.classroomkey for select
using (public.is_admin());

drop policy if exists classroomkeys_admin_insert on public.classroomkey;
create policy classroomkeys_admin_insert
on public.classroomkey for insert
with check (public.is_admin());

drop policy if exists classroomkeys_admin_update on public.classroomkey;
create policy classroomkeys_admin_update
on public.classroomkey for update
using (public.is_admin())
with check (public.is_admin());

drop policy if exists classroomkeys_admin_delete on public.classroomkey;
create policy classroomkeys_admin_delete
on public.classroomkey for delete
using (public.is_admin());

-- crews
drop policy if exists crews_admin_select on public.crew;
create policy crews_admin_select
on public.crew for select
using (public.is_admin());

drop policy if exists crews_admin_insert on public.crew;
create policy crews_admin_insert
on public.crew for insert
with check (public.is_admin());

drop policy if exists crews_admin_update on public.crew;
create policy crews_admin_update
on public.crew for update
using (public.is_admin())
with check (public.is_admin());

drop policy if exists crews_admin_delete on public.crew;
create policy crews_admin_delete
on public.crew for delete
using (public.is_admin());

-- squads
drop policy if exists squads_admin_select on public.squad;
create policy squads_admin_select
on public.squad for select
using (public.is_admin());

drop policy if exists squads_admin_insert on public.squad;
create policy squads_admin_insert
on public.squad for insert
with check (public.is_admin());

drop policy if exists squads_admin_update on public.squad;
create policy squads_admin_update
on public.squad for update
using (public.is_admin())
with check (public.is_admin());

drop policy if exists squads_admin_delete on public.squad;
create policy squads_admin_delete
on public.squad for delete
using (public.is_admin());

-- positions
drop policy if exists positions_admin_select on public.position_role;
create policy positions_admin_select
on public.position_role for select
using (public.is_admin());

drop policy if exists positions_admin_insert on public.position_role;
create policy positions_admin_insert
on public.position_role for insert
with check (public.is_admin());

drop policy if exists positions_admin_update on public.position_role;
create policy positions_admin_update
on public.position_role for update
using (public.is_admin())
with check (public.is_admin());

drop policy if exists positions_admin_delete on public.position_role;
create policy positions_admin_delete
on public.position_role for delete
using (public.is_admin());

-- zones
drop policy if exists zones_admin_select on public.zone;
create policy zones_admin_select
on public.zone for select
using (public.is_admin());

drop policy if exists zones_admin_insert on public.zone;
create policy zones_admin_insert
on public.zone for insert
with check (public.is_admin());

drop policy if exists zones_admin_update on public.zone;
create policy zones_admin_update
on public.zone for update
using (public.is_admin())
with check (public.is_admin());

drop policy if exists zones_admin_delete on public.zone;
create policy zones_admin_delete
on public.zone for delete
using (public.is_admin());

-- positionpermissions
drop policy if exists positionpermissions_admin_select on public.positionpermission;
create policy positionpermissions_admin_select
on public.positionpermission for select
using (public.is_admin());

drop policy if exists positionpermissions_admin_insert on public.positionpermission;
create policy positionpermissions_admin_insert
on public.positionpermission for insert
with check (public.is_admin());

drop policy if exists positionpermissions_admin_update on public.positionpermission;
create policy positionpermissions_admin_update
on public.positionpermission for update
using (public.is_admin())
with check (public.is_admin());

drop policy if exists positionpermissions_admin_delete on public.positionpermission;
create policy positionpermissions_admin_delete
on public.positionpermission for delete
using (public.is_admin());

-- hackalon_departments
drop policy if exists hackalon_departments_admin_select on public.hackalon_department;
create policy hackalon_departments_admin_select
on public.hackalon_department for select
using (public.is_admin());

drop policy if exists hackalon_departments_admin_insert on public.hackalon_department;
create policy hackalon_departments_admin_insert
on public.hackalon_department for insert
with check (public.is_admin());

drop policy if exists hackalon_departments_admin_update on public.hackalon_department;
create policy hackalon_departments_admin_update
on public.hackalon_department for update
using (public.is_admin())
with check (public.is_admin());

drop policy if exists hackalon_departments_admin_delete on public.hackalon_department;
create policy hackalon_departments_admin_delete
on public.hackalon_department for delete
using (public.is_admin());

-- hackalon_teams
drop policy if exists hackalon_teams_admin_select on public.hackalon_team;
create policy hackalon_teams_admin_select
on public.hackalon_team for select
using (public.is_admin());

drop policy if exists hackalon_teams_admin_insert on public.hackalon_team;
create policy hackalon_teams_admin_insert
on public.hackalon_team for insert
with check (public.is_admin());

drop policy if exists hackalon_teams_admin_update on public.hackalon_team;
create policy hackalon_teams_admin_update
on public.hackalon_team for update
using (public.is_admin())
with check (public.is_admin());

drop policy if exists hackalon_teams_admin_delete on public.hackalon_team;
create policy hackalon_teams_admin_delete
on public.hackalon_team for delete
using (public.is_admin());

-- hackalon_scheduleitems
drop policy if exists hackalon_scheduleitems_admin_select on public.hackalon_scheduleitem;
create policy hackalon_scheduleitems_admin_select
on public.hackalon_scheduleitem for select
using (public.is_admin());

drop policy if exists hackalon_scheduleitems_admin_insert on public.hackalon_scheduleitem;
create policy hackalon_scheduleitems_admin_insert
on public.hackalon_scheduleitem for insert
with check (public.is_admin());

drop policy if exists hackalon_scheduleitems_admin_update on public.hackalon_scheduleitem;
create policy hackalon_scheduleitems_admin_update
on public.hackalon_scheduleitem for update
using (public.is_admin())
with check (public.is_admin());

drop policy if exists hackalon_scheduleitems_admin_delete on public.hackalon_scheduleitem;
create policy hackalon_scheduleitems_admin_delete
on public.hackalon_scheduleitem for delete
using (public.is_admin());

-- ---------- WaitingQueue (created_by = current user OR admin) ----------
-- create: created_by = user.email
drop policy if exists waitingqueue_insert_own on public.waitingqueue;
create policy waitingqueue_insert_own
on public.waitingqueue for insert
with check (
  created_by = public.current_email()
);

-- read/update/delete: created_by = user.email OR admin
drop policy if exists waitingqueue_select_own_or_admin on public.waitingqueue;
create policy waitingqueue_select_own_or_admin
on public.waitingqueue for select
using (
  created_by = public.current_email()
  or public.is_admin()
);

drop policy if exists waitingqueue_update_own_or_admin on public.waitingqueue;
create policy waitingqueue_update_own_or_admin
on public.waitingqueue for update
using (
  created_by = public.current_email()
  or public.is_admin()
)
with check (
  created_by = public.current_email()
  or public.is_admin()
);

drop policy if exists waitingqueue_delete_own_or_admin on public.waitingqueue;
create policy waitingqueue_delete_own_or_admin
on public.waitingqueue for delete
using (
  created_by = public.current_email()
  or public.is_admin()
);

-- ---------- Lesson (crew_manager = current user OR admin) ----------
drop policy if exists lessons_select_owner_or_admin on public.lesson;
create policy lessons_select_owner_or_admin
on public.lesson for select
using (
  crew_manager = public.current_email()
  or public.is_admin()
);

drop policy if exists lessons_insert_owner_or_admin on public.lesson;
create policy lessons_insert_owner_or_admin
on public.lesson for insert
with check (
  crew_manager = public.current_email()
  or public.is_admin()
);

drop policy if exists lessons_update_owner_or_admin on public.lesson;
create policy lessons_update_owner_or_admin
on public.lesson for update
using (
  crew_manager = public.current_email()
  or public.is_admin()
)
with check (
  crew_manager = public.current_email()
  or public.is_admin()
);

drop policy if exists lessons_delete_owner_or_admin on public.lesson;
create policy lessons_delete_owner_or_admin
on public.lesson for delete
using (
  crew_manager = public.current_email()
  or public.is_admin()
);

-- ---------- HackalonSubmission ----------
-- create: data.team_name == user.data.hackalon_team  (mapped to JWT claim hackalon_team)
drop policy if exists hackalon_submissions_insert_team on public.hackalon_submission;
create policy hackalon_submissions_insert_team
on public.hackalon_submission for insert
with check (
  team_name = public.current_hackalon_team()
);

-- read: admin OR team_name == user.hackalon_team
drop policy if exists hackalon_submissions_select_team_or_admin on public.hackalon_submission;
create policy hackalon_submissions_select_team_or_admin
on public.hackalon_submission for select
using (
  public.is_admin()
  or team_name = public.current_hackalon_team()
);

-- update/delete/write: uploaded_by == user.email OR admin
drop policy if exists hackalon_submissions_update_uploader_or_admin on public.hackalon_submission;
create policy hackalon_submissions_update_uploader_or_admin
on public.hackalon_submission for update
using (
  public.is_admin()
  or uploaded_by = public.current_email()
)
with check (
  public.is_admin()
  or uploaded_by = public.current_email()
);

drop policy if exists hackalon_submissions_delete_uploader_or_admin on public.hackalon_submission;
create policy hackalon_submissions_delete_uploader_or_admin
on public.hackalon_submission for delete
using (
  public.is_admin()
  or uploaded_by = public.current_email()
);