import {NextResponse} from "next/server";
import {createClient} from "@supabase/supabase-js";
export const dynamic="force-dynamic";
export async function GET(){
 try{const db=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!);
 const {count,error}=await db.from("registrations").select("*",{count:"exact",head:true}).eq("payment_status","paid");
 if(error)throw error;return NextResponse.json({paidRegistrations:count||0});
 }catch{return NextResponse.json({paidRegistrations:0})}
}