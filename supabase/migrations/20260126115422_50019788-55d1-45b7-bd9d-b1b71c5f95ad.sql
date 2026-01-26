-- Create role enum for the system
CREATE TYPE public.app_role AS ENUM ('owner', 'admin', 'user');

-- Create profiles table for user information
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    avatar_url TEXT,
    language TEXT DEFAULT 'uz' CHECK (language IN ('uz', 'ru', 'en')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    UNIQUE (user_id, role)
);

-- Create warehouses table (managed by admins)
CREATE TABLE public.warehouses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    address TEXT,
    description TEXT,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create tenants table (users who rent warehouse space)
CREATE TABLE public.tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    warehouse_id UUID REFERENCES public.warehouses(id) ON DELETE CASCADE NOT NULL,
    admin_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    product_type TEXT NOT NULL,
    monthly_rent DECIMAL(12,2) NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create payments table
CREATE TABLE public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
    month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
    year INTEGER NOT NULL,
    expected_amount DECIMAL(12,2) NOT NULL,
    paid_amount DECIMAL(12,2) DEFAULT 0 NOT NULL,
    carry_over_debt DECIMAL(12,2) DEFAULT 0 NOT NULL,
    payment_date TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    UNIQUE (tenant_id, month, year)
);

-- Create admin_status table to track if admin is blocked
CREATE TABLE public.admin_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    is_blocked BOOLEAN DEFAULT false NOT NULL,
    blocked_at TIMESTAMP WITH TIME ZONE,
    blocked_reason TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_status ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (prevents recursive RLS issues)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to check if admin is blocked
CREATE OR REPLACE FUNCTION public.is_admin_blocked(_admin_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT is_blocked FROM public.admin_status WHERE admin_id = _admin_id),
    false
  )
$$;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owner can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'owner'));

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Owner can manage all roles"
ON public.user_roles FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'owner'));

-- RLS Policies for warehouses
CREATE POLICY "Admins can view their own warehouses"
ON public.warehouses FOR SELECT
TO authenticated
USING (admin_id = auth.uid() AND NOT public.is_admin_blocked(auth.uid()));

CREATE POLICY "Admins can manage their own warehouses"
ON public.warehouses FOR ALL
TO authenticated
USING (admin_id = auth.uid() AND public.has_role(auth.uid(), 'admin') AND NOT public.is_admin_blocked(auth.uid()));

CREATE POLICY "Owner can view all warehouses"
ON public.warehouses FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'owner'));

-- RLS Policies for tenants
CREATE POLICY "Admins can view their tenants"
ON public.tenants FOR SELECT
TO authenticated
USING (admin_id = auth.uid() AND NOT public.is_admin_blocked(auth.uid()));

CREATE POLICY "Admins can manage their tenants"
ON public.tenants FOR ALL
TO authenticated
USING (admin_id = auth.uid() AND public.has_role(auth.uid(), 'admin') AND NOT public.is_admin_blocked(auth.uid()));

CREATE POLICY "Owner can view all tenants"
ON public.tenants FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'owner'));

-- RLS Policies for payments
CREATE POLICY "Admins can view payments for their tenants"
ON public.payments FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.tenants 
    WHERE tenants.id = payments.tenant_id 
    AND tenants.admin_id = auth.uid()
    AND NOT public.is_admin_blocked(auth.uid())
  )
);

CREATE POLICY "Admins can manage payments for their tenants"
ON public.payments FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.tenants 
    WHERE tenants.id = payments.tenant_id 
    AND tenants.admin_id = auth.uid()
    AND public.has_role(auth.uid(), 'admin')
    AND NOT public.is_admin_blocked(auth.uid())
  )
);

CREATE POLICY "Owner can view all payments"
ON public.payments FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'owner'));

-- RLS Policies for admin_status
CREATE POLICY "Owner can manage admin status"
ON public.admin_status FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'owner'));

CREATE POLICY "Admins can view their own status"
ON public.admin_status FOR SELECT
TO authenticated
USING (admin_id = auth.uid());

-- Trigger function to update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_warehouses_updated_at
BEFORE UPDATE ON public.warehouses
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tenants_updated_at
BEFORE UPDATE ON public.tenants
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payments_updated_at
BEFORE UPDATE ON public.payments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_admin_status_updated_at
BEFORE UPDATE ON public.admin_status
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to handle new user creation (creates profile automatically)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();