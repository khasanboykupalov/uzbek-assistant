import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface Tenant {
  id: string;
  full_name: string;
  admin_id: string;
  monthly_rent: number;
}

interface Payment {
  tenant_id: string;
  paid_amount: number;
  expected_amount: number;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    
    // Get the last day of current month
    const lastDayOfMonth = new Date(currentYear, currentMonth, 0).getDate();
    const currentDay = now.getDate();
    
    // Check if we're within 3 days of month end
    const daysUntilMonthEnd = lastDayOfMonth - currentDay;
    
    console.log(`Current date: ${now.toISOString()}`);
    console.log(`Days until month end: ${daysUntilMonthEnd}`);
    
    if (daysUntilMonthEnd > 3) {
      console.log("Not within 3 days of month end, skipping reminders");
      return new Response(
        JSON.stringify({ 
          message: "Not within reminder window", 
          daysUntilMonthEnd 
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200 
        }
      );
    }

    // Get all active tenants
    const { data: tenants, error: tenantsError } = await supabase
      .from("tenants")
      .select("id, full_name, admin_id, monthly_rent")
      .eq("is_active", true);

    if (tenantsError) {
      console.error("Error fetching tenants:", tenantsError);
      throw tenantsError;
    }

    console.log(`Found ${tenants?.length || 0} active tenants`);

    // Get payments for current month
    const { data: payments, error: paymentsError } = await supabase
      .from("payments")
      .select("tenant_id, paid_amount, expected_amount")
      .eq("month", currentMonth)
      .eq("year", currentYear);

    if (paymentsError) {
      console.error("Error fetching payments:", paymentsError);
      throw paymentsError;
    }

    // Create a map for quick payment lookup
    const paymentMap = new Map<string, Payment>();
    (payments || []).forEach((payment: Payment) => {
      paymentMap.set(payment.tenant_id, payment);
    });

    // Find tenants with unpaid or partially paid rent
    const unpaidTenants: Array<Tenant & { unpaidAmount: number }> = [];

    (tenants || []).forEach((tenant: Tenant) => {
      const payment = paymentMap.get(tenant.id);
      const expectedAmount = payment?.expected_amount || tenant.monthly_rent;
      const paidAmount = payment?.paid_amount || 0;
      
      if (paidAmount < expectedAmount) {
        unpaidTenants.push({
          ...tenant,
          unpaidAmount: expectedAmount - paidAmount,
        });
      }
    });

    console.log(`Found ${unpaidTenants.length} tenants with unpaid rent`);

    // Group unpaid tenants by admin
    const adminUnpaidMap = new Map<string, Array<typeof unpaidTenants[0]>>();
    
    unpaidTenants.forEach((tenant) => {
      const existing = adminUnpaidMap.get(tenant.admin_id) || [];
      existing.push(tenant);
      adminUnpaidMap.set(tenant.admin_id, existing);
    });

    // Create notifications for each admin
    const notifications: Array<{
      user_id: string;
      title: string;
      message: string;
      type: string;
      related_type: string;
    }> = [];

    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat("uz-UZ").format(amount) + " so'm";
    };

    for (const [adminId, tenantList] of adminUnpaidMap) {
      // Check if we already sent a reminder today for this admin
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { data: existingNotification } = await supabase
        .from("notifications")
        .select("id")
        .eq("user_id", adminId)
        .eq("type", "payment_reminder")
        .gte("created_at", today.toISOString())
        .limit(1);

      if (existingNotification && existingNotification.length > 0) {
        console.log(`Already sent reminder to admin ${adminId} today, skipping`);
        continue;
      }

      const totalUnpaid = tenantList.reduce((sum, t) => sum + t.unpaidAmount, 0);
      const tenantNames = tenantList.slice(0, 3).map((t) => t.full_name).join(", ");
      const moreCount = tenantList.length > 3 ? ` va yana ${tenantList.length - 3} ta` : "";

      notifications.push({
        user_id: adminId,
        title: "To'lov eslatmasi",
        message: `${tenantList.length} ta ijarachi to'lovini amalga oshirmagan: ${tenantNames}${moreCount}. Jami: ${formatCurrency(totalUnpaid)}`,
        type: "payment_reminder",
        related_type: "payment",
      });
    }

    console.log(`Creating ${notifications.length} notifications`);

    if (notifications.length > 0) {
      const { error: insertError } = await supabase
        .from("notifications")
        .insert(notifications);

      if (insertError) {
        console.error("Error inserting notifications:", insertError);
        throw insertError;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Created ${notifications.length} payment reminders`,
        daysUntilMonthEnd,
        unpaidTenantsCount: unpaidTenants.length,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in payment-reminders function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
