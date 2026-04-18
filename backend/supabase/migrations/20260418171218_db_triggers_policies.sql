
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (
    id,
    email,
    role,
    full_name,
    is_active,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    'AGENT'::public."Role",
    NEW.raw_user_meta_data->>'full_name',
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
ALTER TABLE public.fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.field_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;


CREATE OR REPLACE FUNCTION public.get_auth_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COALESCE(role::TEXT, 'AGENT')
  FROM public.users
  WHERE id = auth.uid()
  LIMIT 1;
$$;



CREATE POLICY "Users can read own profile"
ON public.users
FOR SELECT
USING (id = auth.uid());

CREATE POLICY "Admins can read all users"
ON public.users
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND public.get_auth_role() = 'ADMIN'
);

CREATE POLICY "Admins can update users"
ON public.users
FOR UPDATE
USING (
  auth.uid() IS NOT NULL
  AND public.get_auth_role() = 'ADMIN'
);

CREATE POLICY "Block direct user inserts"
ON public.users
FOR INSERT
WITH CHECK (FALSE);


CREATE POLICY "Admins full access to fields"
ON public.fields
FOR ALL
USING (
  auth.uid() IS NOT NULL
  AND public.get_auth_role() = 'ADMIN'
);

CREATE POLICY "Agents read assigned fields"
ON public.fields
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND public.get_auth_role() = 'AGENT'
  AND agent_id = auth.uid()
  AND is_archived = FALSE
);

CREATE POLICY "Admins can create fields"
ON public.fields
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND public.get_auth_role() = 'ADMIN'
);



CREATE POLICY "Admins read all updates"
ON public.field_updates
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND public.get_auth_role() = 'ADMIN'
);

CREATE POLICY "Agents read own field updates"
ON public.field_updates
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND public.get_auth_role() = 'AGENT'
  AND EXISTS (
    SELECT 1
    FROM public.fields f
    WHERE f.id = field_updates.field_id
      AND f.agent_id = auth.uid()
  )
);

CREATE POLICY "Agents insert updates only for assigned fields"
ON public.field_updates
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND public.get_auth_role() = 'AGENT'
  AND agent_id = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.fields f
    WHERE f.id = field_id
      AND f.agent_id = auth.uid()
      AND f.is_archived = FALSE
  )
);


CREATE POLICY "Admins full access to locations"
ON public.locations
FOR ALL
USING (
  auth.uid() IS NOT NULL
  AND public.get_auth_role() = 'ADMIN'
);

CREATE POLICY "Agents read assigned field locations"
ON public.locations
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND public.get_auth_role() = 'AGENT'
  AND EXISTS (
    SELECT 1
    FROM public.fields f
    WHERE f.location_id = locations.id
      AND f.agent_id = auth.uid()
  )
);


-- Fast dashboard grouping by stage
CREATE INDEX IF NOT EXISTS idx_fields_stage_active
ON public.fields (current_stage)
WHERE is_archived = FALSE;

-- Agent dashboard performance
CREATE INDEX IF NOT EXISTS idx_fields_agent_active
ON public.fields (agent_id)
WHERE is_archived = FALSE;

-- Update timeline queries
CREATE INDEX IF NOT EXISTS idx_field_updates_field_observed
ON public.field_updates (field_id, observed_at DESC);

-- Location analytics
CREATE INDEX IF NOT EXISTS idx_locations_county
ON public.locations (county);