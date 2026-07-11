-- Row-level security. This is a single-user app, but RLS is still enforced properly:
-- every user-owned table is scoped to auth.uid(), and global reference tables
-- (exercises, equipment, non-custom food items) are read-only to authenticated users.

-- ---- User-owned tables: full CRUD scoped to auth.uid() = user_id ----
alter table user_profiles enable row level security;
alter table user_preferences enable row level security;
alter table medical_restrictions enable row level security;
alter table application_settings enable row level security;
alter table user_equipment enable row level security;
alter table available_weight_increments enable row level security;
alter table workout_programmes enable row level security;
alter table workout_sessions enable row level security;
alter table readiness_entries enable row level security;
alter table body_measurements enable row level security;
alter table nutrition_targets enable row level security;
alter table recipes enable row level security;
alter table food_logs enable row level security;
alter table meal_plans enable row level security;
alter table supplement_logs enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array[
    'user_profiles', 'user_preferences', 'medical_restrictions', 'application_settings',
    'user_equipment', 'available_weight_increments', 'workout_programmes', 'workout_sessions',
    'readiness_entries', 'body_measurements', 'nutrition_targets', 'recipes', 'food_logs',
    'meal_plans', 'supplement_logs'
  ]
  loop
    execute format('create policy %I_select_own on %I for select using (auth.uid() = user_id)', t, t);
    execute format('create policy %I_insert_own on %I for insert with check (auth.uid() = user_id)', t, t);
    execute format('create policy %I_update_own on %I for update using (auth.uid() = user_id) with check (auth.uid() = user_id)', t, t);
    execute format('create policy %I_delete_own on %I for delete using (auth.uid() = user_id)', t, t);
  end loop;
end $$;

-- ---- Child tables: scoped via their parent's user_id ----
alter table workout_days enable row level security;
create policy workout_days_all_own on workout_days for all
  using (exists (select 1 from workout_programmes p where p.id = workout_days.programme_id and p.user_id = auth.uid()))
  with check (exists (select 1 from workout_programmes p where p.id = workout_days.programme_id and p.user_id = auth.uid()));

alter table planned_exercises enable row level security;
create policy planned_exercises_all_own on planned_exercises for all
  using (exists (select 1 from workout_days d join workout_programmes p on p.id = d.programme_id where d.id = planned_exercises.workout_day_id and p.user_id = auth.uid()))
  with check (exists (select 1 from workout_days d join workout_programmes p on p.id = d.programme_id where d.id = planned_exercises.workout_day_id and p.user_id = auth.uid()));

alter table exercise_performances enable row level security;
create policy exercise_performances_all_own on exercise_performances for all
  using (exists (select 1 from workout_sessions s where s.id = exercise_performances.session_id and s.user_id = auth.uid()))
  with check (exists (select 1 from workout_sessions s where s.id = exercise_performances.session_id and s.user_id = auth.uid()));

alter table exercise_sets enable row level security;
create policy exercise_sets_all_own on exercise_sets for all
  using (exists (select 1 from exercise_performances ep join workout_sessions s on s.id = ep.session_id where ep.id = exercise_sets.performance_id and s.user_id = auth.uid()))
  with check (exists (select 1 from exercise_performances ep join workout_sessions s on s.id = ep.session_id where ep.id = exercise_sets.performance_id and s.user_id = auth.uid()));

alter table recipe_ingredients enable row level security;
create policy recipe_ingredients_all_own on recipe_ingredients for all
  using (exists (select 1 from recipes r where r.id = recipe_ingredients.recipe_id and r.user_id = auth.uid()))
  with check (exists (select 1 from recipes r where r.id = recipe_ingredients.recipe_id and r.user_id = auth.uid()));

alter table meal_plan_days enable row level security;
create policy meal_plan_days_all_own on meal_plan_days for all
  using (exists (select 1 from meal_plans mp where mp.id = meal_plan_days.meal_plan_id and mp.user_id = auth.uid()))
  with check (exists (select 1 from meal_plans mp where mp.id = meal_plan_days.meal_plan_id and mp.user_id = auth.uid()));

alter table planned_meals enable row level security;
create policy planned_meals_all_own on planned_meals for all
  using (exists (select 1 from meal_plan_days d join meal_plans mp on mp.id = d.meal_plan_id where d.id = planned_meals.meal_plan_day_id and mp.user_id = auth.uid()))
  with check (exists (select 1 from meal_plan_days d join meal_plans mp on mp.id = d.meal_plan_id where d.id = planned_meals.meal_plan_day_id and mp.user_id = auth.uid()));

-- ---- Global reference data: readable by any authenticated user, not writable by clients ----
alter table equipment enable row level security;
create policy equipment_read_all on equipment for select using (auth.role() = 'authenticated');

alter table exercises enable row level security;
create policy exercises_read_all on exercises for select using (auth.role() = 'authenticated');

alter table exercise_aliases enable row level security;
create policy exercise_aliases_read_all on exercise_aliases for select using (auth.role() = 'authenticated');

alter table exercise_substitutions enable row level security;
create policy exercise_substitutions_read_all on exercise_substitutions for select using (auth.role() = 'authenticated');

-- food_items: global entries readable by everyone; custom entries scoped to their owner.
alter table food_items enable row level security;
create policy food_items_read on food_items for select
  using (is_custom = false or owner_user_id = auth.uid());
create policy food_items_insert_own_custom on food_items for insert
  with check (is_custom = true and owner_user_id = auth.uid());
create policy food_items_update_own_custom on food_items for update
  using (is_custom = true and owner_user_id = auth.uid())
  with check (is_custom = true and owner_user_id = auth.uid());
create policy food_items_delete_own_custom on food_items for delete
  using (is_custom = true and owner_user_id = auth.uid());

alter table food_servings enable row level security;
create policy food_servings_read on food_servings for select
  using (exists (select 1 from food_items f where f.id = food_servings.food_item_id and (f.is_custom = false or f.owner_user_id = auth.uid())));
create policy food_servings_write_own on food_servings for insert
  with check (exists (select 1 from food_items f where f.id = food_servings.food_item_id and f.is_custom = true and f.owner_user_id = auth.uid()));

alter table food_aliases enable row level security;
create policy food_aliases_read on food_aliases for select
  using (owner_user_id is null or owner_user_id = auth.uid());
create policy food_aliases_insert_own on food_aliases for insert
  with check (owner_user_id = auth.uid());
