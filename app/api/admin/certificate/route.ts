import {NextResponse} from "next/server";
import {createClient} from "@supabase/supabase-js";
import {PDFDocument,StandardFonts,rgb} from "pdf-lib";
export const runtime="nodejs";
export async function POST(req:Request){
 if(!process.env.ADMIN_ACCESS_KEY||req.headers.get("x-admin-key")!==process.env.ADMIN_ACCESS_KEY)return NextResponse.json({error:"Unauthorised"},{status:401});
 try{
  const {registrationId,memberIndex}=await req.json();if(!registrationId||!Number.isInteger(memberIndex)||memberIndex<0||memberIndex>2)return NextResponse.json({error:"Invalid certificate request"},{status:400});
  const db=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!);const {data:reg,error}=await db.from("registrations").select("*").eq("id",registrationId).single();if(error||!reg)return NextResponse.json({error:"Registration not found"},{status:404});if(reg.payment_status!=="paid"||!reg.attendance_verified)return NextResponse.json({error:"Certificate is available only after payment and attendance verification."},{status:409});
  const member=reg.team_members?.[memberIndex];if(!member)return NextResponse.json({error:"Team member not found"},{status:404});
  const pdf=await PDFDocument.create();const page=pdf.addPage([842,595]);const bold=await pdf.embedFont(StandardFonts.HelveticaBold),regular=await pdf.embedFont(StandardFonts.Helvetica);const navy=rgb(.03,.11,.29),gold=rgb(.83,.58,.12),gray=rgb(.28,.32,.4);
  page.drawRectangle({x:22,y:22,width:798,height:551,borderColor:gold,borderWidth:3});page.drawRectangle({x:32,y:32,width:778,height:531,borderColor:navy,borderWidth:1});
  const center=(text:string,size:number,font:any,color:any,y:number)=>page.drawText(text,{x:(842-font.widthOfTextAtSize(text,size))/2,y,size,font,color});
  center("ST. JOSEPH COLLEGE OF ENGINEERING",18,bold,navy,500);center("SJCE INNOVATION AND INCUBATION FORUM (SJIIF)",12,bold,gold,476);center("CERTIFICATE OF PARTICIPATION",28,bold,navy,410);center("This certificate is proudly presented to",14,regular,gray,365);center(String(member.name).toUpperCase(),27,bold,navy,320);center("for participating in",14,regular,gray,284);center(String(reg.event_interest),20,bold,navy,248);center(`as a member of team: ${reg.team_name}`,14,regular,gray,214);center("INNOVATE 2027  |  A Platform for Young Innovators",13,bold,navy,165);center("11 February 2027",13,regular,gray,139);center(`Certificate ID: ${reg.registration_code}-M${memberIndex+1}`,10,regular,gray,83);
  const bytes=await pdf.save();return new Response(Buffer.from(bytes),{status:200,headers:{"Content-Type":"application/pdf","Content-Disposition":`attachment; filename="${reg.registration_code}-M${memberIndex+1}-certificate.pdf"}});
 }catch(e){console.error(e);return NextResponse.json({error:"Could not generate certificate"},{status:500})}
}
