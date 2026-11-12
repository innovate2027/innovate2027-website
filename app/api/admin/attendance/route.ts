import {NextResponse} from "next/server";
import {createClient} from "@supabase/supabase-js";
export const runtime="nodejs";
export async function PATCH(req:Request){
 if(!process.env.ADMIN_ACCESS_KEY||req.headers.get("x-admin-key")!==process.env.ADMIN_ACCESS_KEY)return NextResponse.json({error:"Unauthorised"},{status:401});
 try{const {registrationId,verified}=await req.json();if(!registrationId||typeof verified!=="boolean")return NextResponse.json({error:"Invalid attendance update"},{status:400});const db=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!);const {error}=await db.from("registrations").update({attendance_verified:verified}).eq("id",registrationId).eq("payment_status","paid");if(error)throw error;return NextResponse.json({ok:true})}catch(e){console.error(e);return NextResponse.json({error:"Could not update attendance"},{status:500})}
}
