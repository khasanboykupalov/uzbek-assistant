import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateAdminRequest {
  email: string;
  password: string;
  full_name: string;
  phone: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Authorization header required");
    }

    // Create Supabase client with the user's auth token
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // User client to verify the caller is an owner
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify the calling user
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      throw new Error("Unauthorized: Invalid token");
    }

    // Check if the caller has owner role
    const { data: roleData, error: roleError } = await userClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "owner")
      .single();

    if (roleError || !roleData) {
      throw new Error("Unauthorized: Only owners can create admins");
    }

    // Parse request body
    const { email, password, full_name, phone }: CreateAdminRequest = await req.json();

    // Validate inputs
    if (!email || !password || !full_name || !phone) {
      throw new Error("All fields are required: email, password, full_name, phone");
    }

    if (password.length < 6) {
      throw new Error("Password must be at least 6 characters");
    }

    // Create admin client with service role (can create users without affecting current session)
    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Create the new admin user
    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: { full_name },
    });

    if (createError) {
      throw new Error(`Failed to create user: ${createError.message}`);
    }

    if (!newUser.user) {
      throw new Error("User creation failed");
    }

    const newUserId = newUser.user.id;

    // Update profile with phone number
    const { error: profileError } = await adminClient
      .from("profiles")
      .update({ phone, full_name })
      .eq("user_id", newUserId);

    if (profileError) {
      console.error("Profile update error:", profileError);
      // Don't throw - profile might be created by trigger
    }

    // Add admin role
    const { error: roleInsertError } = await adminClient
      .from("user_roles")
      .insert({ user_id: newUserId, role: "admin" });

    if (roleInsertError) {
      // Rollback: delete the created user
      await adminClient.auth.admin.deleteUser(newUserId);
      throw new Error(`Failed to assign admin role: ${roleInsertError.message}`);
    }

    // Create admin status entry
    const { error: statusError } = await adminClient
      .from("admin_status")
      .insert({ admin_id: newUserId, is_blocked: false });

    if (statusError) {
      console.error("Admin status creation error:", statusError);
      // Non-critical, continue
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Admin created successfully",
        admin_id: newUserId,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: unknown) {
    console.error("Error creating admin:", error);
    const errorMessage = error instanceof Error ? error.message : "An error occurred";
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
