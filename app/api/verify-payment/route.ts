import {NextResponse} from "next/server";
import crypto from "crypto";
import Razorpay from "razorpay";
import {createClient} from "@supabase/supabase-js";
export const runtime="nodejs";
const esc=(s:string)=>s.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]!));
async function sendEmail(to:string[],subject:string,html:string){if(!process.env.RESEND_API_KEY||!process.env.EMAIL_FROM)return;const res=await fetch("https://api.resend.com/emails",{method:"POST",headers:{Authorization:`Bearer ${process.env.RESEND_API_KEY}`,"Content-Type":"application/json"},body:JSON.stringify({from:process.env.EMAIL_FROM,to,subject,html})});if(!res.ok)throw new Error(`Email service returned ${res.status}`)}
export async function POST(req:Request){
 try{
  const b=await req.json();const {razorpay_order_id,razorpay_payment_id,razorpay_signature,registrationId}=b;
  if(!razorpay_order_id||!razorpay_payment_id||!razorpay_signature||!registrationId)return NextResponse.json({error:"Missing payment verification details."},{status:400});
  const expected=crypto.createHmac("sha256",process.env.RAZORPAY_KEY_SECRET!).update(`${razorpay_order_id}|${razorpay_payment_id}`).digest("hex");const a=Buffer.from(expected),c=Buffer.from(String(razorpay_signature));if(a.length!==c.length||!crypto.timingSafeEqual(a,c))return NextResponse.json({error:"Payment signature could not be verified."},{status:400});
  const db=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const {data:reg,error}=await db.from("registrations").select("*").eq("id",registrationId).single();if(error||!reg||reg.razorpay_order_id!==razorpay_order_id)return NextResponse.json({error:"Registration/order mismatch."},{status:404});
  const rz=new Razorpay({key_id:process.env.RAZORPAY_KEY_ID!,key_secret:process.env.RAZORPAY_KEY_SECRET!});const payment=await rz.payments.fetch(razorpay_payment_id);
  if(payment.order_id!==razorpay_order_id||payment.status!=="captured"||payment.amount!==reg.amount_paise||payment.currency!==reg.currency)return NextResponse.json({error:"Payment is not captured or does not match the registration amount."},{status:400});
  if(reg.payment_status!=="paid"){
   const {error:updateError}=await db.from("registrations").update({payment_status:"paid",razorpay_payment_id,paid_at:new Date().toISOString()}).eq("id",registrationId);if(updateError)throw updateError;
   const recipients=[reg.team_leader_email,"iic@stjoseph.ac.in"];
   try{await sendEmail(recipients,"INNOVATE 2027 – Team Registration Confirmed",`<div style="font-family:Arial,sans-serif;line-height:1.6"><h2>INNOVATE 2027 registration confirmed</h2><p>Dear ${esc(reg.team_leader_name)},</p><p>Your team payment has been received successfully.</p><p><b>Registration ID:</b> ${esc(reg.registration_code)}<br/><b>Team:</b> ${esc(reg.team_name)}<br/><b>Event:</b> ${esc(reg.event_interest)}<br/><b>Fee:</b> ₹300<br/><b>Event date:</b> 11 February 2027</p><p>Team members:<br/>${(reg.team_members||[]).map((m:any)=>`${esc(m.name)} · ${esc(m.email)} · ${esc(m.phone)}`).join("<br/>")}</p><p>St. Joseph College of Engineering · SJCE Innovation and Incubation Forum</p></div>`)}catch(emailErr){console.error("confirmation email failed",emailErr)}
  }
  return NextResponse.json({ok:true,registrationCode:reg.registration_code});
 }catch(e){console.error("payment verification error",e);return NextResponse.json({error:"Could not verify payment. Please contact iic@stjoseph.ac.in with your payment reference."},{status:500})}
}
