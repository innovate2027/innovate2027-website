import {NextResponse} from "next/server";
import {createClient} from "@supabase/supabase-js";
export const runtime="nodejs",dynamic="force-dynamic";
export async function GET(req:Request){
 if(!process.env.ADMIN_ACCESS_KEY||req.headers.get("x-admin-key")!==process.env.ADMIN_ACCESS_KEY)return NextResponse.json({error:"Unauthorised"},{status:401});
 try{const db=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!);const {data,error}=await db.from("registrations").select("*").order("created_at",{ascending:false}).limit(5000);if(error)throw error;const bucket=process.env.SUPABASE_SUBMISSIONS_BUCKET||"event-submissions";const registrations=await Promise.all((data||[]).map(async(row:any)=>{if(!row.submission_file_path)return row;const {data:link}=await db.storage.from(bucket).createSignedUrl(row.submission_file_path,3600);return {...row,submission_url:link?.signedUrl||null}}));return NextResponse.json({registrations})}catch(e){console.error(e);return NextResponse.json({error:"Could not load registrations"},{status:500})}
}
