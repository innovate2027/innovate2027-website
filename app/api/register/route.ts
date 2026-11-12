import {NextResponse} from "next/server";
import Razorpay from "razorpay";
import {createClient} from "@supabase/supabase-js";
import {PDFDocument} from "pdf-lib";
export const runtime="nodejs";
const events=["Innovation Challenge Hackathon","Idea Pitch","Project Expo","Student Startup Showcase"];
const clean=(v:unknown,max=180)=>String(v??"").trim().slice(0,max);
const MAX=5*1024*1024;
const mimeByEvent:Record<string,string[]>={"Idea Pitch":["application/vnd.ms-powerpoint","application/vnd.openxmlformats-officedocument.presentationml.presentation"],"Project Expo":["application/pdf"],"Student Startup Showcase":["application/pdf"]};
export async function POST(req:Request){
 let uploadedPath:string|null=null;
 try{
  const deadline=new Date("2027-01-31T23:59:59+05:30");if(Date.now()>deadline.getTime())return NextResponse.json({error:"Registration closed on 31 January 2027."},{status:403});
  const f=await req.formData();const team_name=clean(f.get("team_name"),100),institution=clean(f.get("institution"),180),participant_type=clean(f.get("participant_type"),30),event_interest=clean(f.get("event_interest"),80),department=clean(f.get("department"),100);
  let members:any[]=[];try{members=JSON.parse(String(f.get("team_members")||"[]"))}catch{}
  members=Array.isArray(members)?members.slice(0,3).map(m=>({name:clean(m.name,100),phone:clean(m.phone,18),email:clean(m.email,160).toLowerCase()})):[];
  const leaderIndex=Number(f.get("team_leader_index"));const leader=members[leaderIndex];
  if(!team_name||!institution||!leader||!Number.isInteger(leaderIndex)||leaderIndex<0||leaderIndex>=members.length)return NextResponse.json({error:"Please provide a team name, institution and valid team leader."},{status:400});
  if(!["Student","Faculty","Startup","Industry"].includes(participant_type)||!events.includes(event_interest))return NextResponse.json({error:"Invalid participant category or event."},{status:400});
  if(members.length<1||members.some(m=>!m.name||!m.phone||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(m.email)))return NextResponse.json({error:"Enter name, phone and valid email for every team member (maximum three)."},{status:400});
  const submission=f.get("submission");let filePath:string|null=null;
  if(event_interest===events[0]){if(submission instanceof File)return NextResponse.json({error:"No file upload is required for Innovation Challenge Hackathon."},{status:400});}
  else{
   if(!(submission instanceof File)||submission.size===0)return NextResponse.json({error:"Please attach the required event submission file."},{status:400});
   if(submission.size>MAX)return NextResponse.json({error:"File exceeds the 5 MB upload limit."},{status:400});
   const allowed=mimeByEvent[event_interest]||[];const ext=submission.name.split(".").pop()?.toLowerCase();
   if(event_interest==="Idea Pitch"?!["ppt","pptx"].includes(ext||""):ext!=="pdf")return NextResponse.json({error:event_interest==="Idea Pitch"?"Idea Pitch accepts PPT or PPTX only.":"This event accepts PDF files only."},{status:400});
   if(submission.type&&!allowed.includes(submission.type))return NextResponse.json({error:"The uploaded file type does not match the selected event."},{status:400});
   if(event_interest==="Project Expo"){try{const pdf=await PDFDocument.load(await submission.arrayBuffer());if(pdf.getPageCount()!==1)return NextResponse.json({error:"Project Expo submission must be a single-page PDF."},{status:400});}catch{return NextResponse.json({error:"The uploaded Project Expo PDF could not be opened. Please upload a valid PDF."},{status:400});}}
  }
  const db=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!);
  if(submission instanceof File&&submission.size>0){
   const bucket=process.env.SUPABASE_SUBMISSIONS_BUCKET||"event-submissions";const ext=submission.name.split(".").pop()?.toLowerCase()||"file";uploadedPath=`${new Date().getFullYear()}/${crypto.randomUUID()}.${ext}`;
   const {error:upErr}=await db.storage.from(bucket).upload(uploadedPath,await submission.arrayBuffer(),{contentType:submission.type||"application/octet-stream",upsert:false});if(upErr)throw new Error(`File upload failed. Check the Supabase storage bucket '${bucket}'.`);
  }
  const amount=30000;const code="IN27-"+Date.now().toString(36).toUpperCase()+"-"+crypto.randomUUID().slice(0,5).toUpperCase();
  const {data:reg,error}=await db.from("registrations").insert({registration_code:code,team_name,team_leader_name:leader.name,team_leader_email:leader.email,team_leader_phone:leader.phone,team_leader_index:leaderIndex,participant_type,institution,department,event_interest,team_members:members,submission_file_path:uploadedPath,amount_paise:amount,currency:"INR",payment_status:"pending"}).select("id,registration_code").single();
  if(error)throw error;
  const razorpay=new Razorpay({key_id:process.env.RAZORPAY_KEY_ID!,key_secret:process.env.RAZORPAY_KEY_SECRET!});
  const order=await razorpay.orders.create({amount,currency:"INR",receipt:code,notes:{registration_id:reg.id,registration_code:code,event:event_interest,team_name}});
  const {error:updateError}=await db.from("registrations").update({razorpay_order_id:order.id}).eq("id",reg.id);if(updateError)throw updateError;
  return NextResponse.json({registrationId:reg.id,registrationCode:code,orderId:order.id,amount,currency:"INR",keyId:process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,leaderName:leader.name,leaderEmail:leader.email,leaderPhone:leader.phone});
 }catch(e){console.error("registration error",e);return NextResponse.json({error:e instanceof Error?e.message:"Registration could not be started. Please retry or contact iic@stjoseph.ac.in."},{status:500})}
}
