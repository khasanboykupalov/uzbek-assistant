import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateOwnerRequest {
  email: string;
  password: string;
  full_name: string;
  secret_key: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, password, full_name, secret_key }: CreateOwnerRequest = await req.json();

    // Verify secret key (should be set as environment variable)
    const OWNER_SECRET_KEY = Deno.env.get("OWNER_SECRET_KEY");
    
    if (!OWNER_SECRET_KEY || secret_key !== OWNER_SECRET_KEY) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: Invalid secret key" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase admin client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Check if owner already exists
    const { data: existingRoles, error: checkError } = await supabaseAdmin
      .from("user_roles")
      .select("*")
      .eq("role", "owner");

    if (checkError) {
      throw checkError;
    }

    if (existingRoles && existingRoles.length > 0) {
      return new Response(
        JSON.stringify({ error: "Owner already exists" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name },
    });

    if (authError) {
      throw authError;
    }

    if (!authData.user) {
      throw new Error("User creation failed");
    }

    // Update profile
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({ full_name })
      .eq("user_id", authData.user.id);

    if (profileError) {
      console.error("Profile update error:", profileError);
    }

    // Add owner role
    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: authData.user.id, role: "owner" });

    if (roleError) {
      throw roleError;
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Owner created successfully",
        user_id: authData.user.id 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Error creating owner:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
