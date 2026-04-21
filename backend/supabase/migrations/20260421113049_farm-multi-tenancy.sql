CREATE OR REPLACE FUNCTION public.get_auth_role()
RETURNS TEXT
LANGUAGE sql
STABLE
AS $$
  SELECT role::TEXT
  FROM public.users
  WHERE id = auth.uid()
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_auth_farm_id()
RETURNS UUID
LANGUAGE sql
STABLE
AS $$
  SELECT farm_id
  FROM public.users
  WHERE id = auth.uid()
  LIMIT 1;
$$;



CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  resolved_role "Role";
  resolved_farm_id UUID;
BEGIN
  resolved_role := COALESCE(
    CASE UPPER(NEW.raw_user_meta_data->>'role')
      WHEN 'ADMIN' THEN 'ADMIN'::"Role"
      WHEN 'AGENT' THEN 'AGENT'::"Role"
      ELSE 'AGENT'::"Role"
    END,
    'AGENT'::"Role"
  );

  BEGIN
    resolved_farm_id := (NEW.raw_user_meta_data->>'farmId')::UUID;
  EXCEPTION WHEN others THEN
    resolved_farm_id := NULL;
  END;

  INSERT INTO public.users (
    id,
    email,
    role,
    full_name,
    farm_id,
    is_active,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    resolved_role,
    NEW.raw_user_meta_data->>'full_name',
    resolved_farm_id,
    TRUE,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_auth_user();


ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.field_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.field_images ENABLE ROW LEVEL SECURITY;



DROP POLICY IF EXISTS "farm_select" ON public.farms;
DROP POLICY IF EXISTS "farm_update" ON public.farms;
DROP POLICY IF EXISTS "farm_insert" ON public.farms;

CREATE POLICY "Users can read own farm"
ON public.farms
FOR SELECT
USING (id = get_auth_farm_id());

CREATE POLICY "Admins can update own farm"
ON public.farms
FOR UPDATE
USING (
  id = get_auth_farm_id()
  AND get_auth_role() = 'ADMIN'
);

CREATE POLICY "Block direct farm inserts"
ON public.farms
FOR INSERT
WITH CHECK (FALSE);


DROP POLICY IF EXISTS "users_select_own" ON public.users;
DROP POLICY IF EXISTS "users_select_farm" ON public.users;
DROP POLICY IF EXISTS "users_update" ON public.users;
DROP POLICY IF EXISTS "users_insert" ON public.users;

-- Self access
CREATE POLICY "Users can read own profile"
ON public.users
FOR SELECT
USING (id = auth.uid());

-- Admins see only users in their farm
CREATE POLICY "Admins can read farm users"
ON public.users
FOR SELECT
USING (
  get_auth_role() = 'ADMIN'
  AND farm_id = get_auth_farm_id()
);

-- Update own profile
CREATE POLICY "Users can update own profile"
ON public.users
FOR UPDATE
USING (id = auth.uid());

-- Admin updates within farm
CREATE POLICY "Admins can update farm users"
ON public.users
FOR UPDATE
USING (
  get_auth_role() = 'ADMIN'
  AND farm_id = get_auth_farm_id()
);

-- Block client inserts (auth trigger handles)
CREATE POLICY "Block user inserts"
ON public.users
FOR INSERT
WITH CHECK (FALSE);


DROP POLICY IF EXISTS "fields_admin" ON public.fields;
DROP POLICY IF EXISTS "fields_agent" ON public.fields;

CREATE POLICY "Admins manage farm fields"
ON public.fields
FOR ALL
USING (
  get_auth_role() = 'ADMIN'
  AND farm_id = get_auth_farm_id()
);

CREATE POLICY "Agents read assigned fields"
ON public.fields
FOR SELECT
USING (
  get_auth_role() = 'AGENT'
  AND agent_id = auth.uid()
  AND farm_id = get_auth_farm_id()
  AND is_archived = FALSE
);

CREATE POLICY "Admins create fields"
ON public.fields
FOR INSERT
WITH CHECK (
  get_auth_role() = 'ADMIN'
  AND farm_id = get_auth_farm_id()
);



DROP POLICY IF EXISTS "updates_admin" ON public.field_updates;
DROP POLICY IF EXISTS "updates_agent_select" ON public.field_updates;
DROP POLICY IF EXISTS "updates_agent_insert" ON public.field_updates;

CREATE POLICY "Admins read farm updates"
ON public.field_updates
FOR SELECT
USING (
  get_auth_role() = 'ADMIN'
  AND EXISTS (
    SELECT 1 FROM public.fields f
    WHERE f.id = field_updates.field_id
      AND f.farm_id = get_auth_farm_id()
  )
);

CREATE POLICY "Agents read assigned updates"
ON public.field_updates
FOR SELECT
USING (
  get_auth_role() = 'AGENT'
  AND EXISTS (
    SELECT 1 FROM public.fields f
    WHERE f.id = field_updates.field_id
      AND f.agent_id = auth.uid()
      AND f.farm_id = get_auth_farm_id()
  )
);

CREATE POLICY "Agents insert updates"
ON public.field_updates
FOR INSERT
WITH CHECK (
  agent_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.fields f
    WHERE f.id = field_id
      AND f.agent_id = auth.uid()
      AND f.farm_id = get_auth_farm_id()
  )
);


CREATE POLICY "Admins manage farm locations"
ON public.locations
FOR ALL
USING (
  get_auth_role() = 'ADMIN'
  AND EXISTS (
    SELECT 1 FROM public.fields f
    WHERE f.location_id = locations.id
      AND f.farm_id = get_auth_farm_id()
  )
);

CREATE POLICY "Agents read assigned locations"
ON public.locations
FOR SELECT
USING (
  get_auth_role() = 'AGENT'
  AND EXISTS (
    SELECT 1 FROM public.fields f
    WHERE f.location_id = locations.id
      AND f.agent_id = auth.uid()
      AND f.farm_id = get_auth_farm_id()
  )
);


CREATE POLICY "Admins manage farm images"
ON public.field_images
FOR ALL
USING (
  get_auth_role() = 'ADMIN'
  AND EXISTS (
    SELECT 1 FROM public.fields f
    WHERE f.id = field_images.field_id
      AND f.farm_id = get_auth_farm_id()
  )
);

CREATE POLICY "Agents read images"
ON public.field_images
FOR SELECT
USING (
  get_auth_role() = 'AGENT'
  AND EXISTS (
    SELECT 1 FROM public.fields f
    WHERE f.id = field_images.field_id
      AND f.agent_id = auth.uid()
      AND f.farm_id = get_auth_farm_id()
  )
);

CREATE POLICY "Agents insert images"
ON public.field_images
FOR INSERT
WITH CHECK (
  uploaded_by_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.fields f
    WHERE f.id = field_id
      AND f.agent_id = auth.uid()
      AND f.farm_id = get_auth_farm_id()
  )
);


CREATE INDEX IF NOT EXISTS idx_fields_farm
ON public.fields (farm_id);

CREATE INDEX IF NOT EXISTS idx_fields_farm_stage
ON public.fields (farm_id, current_stage)
WHERE is_archived = FALSE;

CREATE INDEX IF NOT EXISTS idx_fields_agent
ON public.fields (agent_id)
WHERE is_archived = FALSE;

CREATE INDEX IF NOT EXISTS idx_field_updates_field_time
ON public.field_updates (field_id, observed_at DESC);

CREATE INDEX IF NOT EXISTS idx_users_farm_role
ON public.users (farm_id, role);

CREATE INDEX IF NOT EXISTS idx_farms_invite_code
ON public.farms (invite_code);