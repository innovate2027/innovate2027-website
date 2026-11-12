import {NextResponse} from "next/server";
import crypto from "crypto";
import {createClient} from "@supabase/supabase-js";
export const runtime="nodejs";
export async function POST(req:Request){
 const raw=await req.text();
 const signature=req.headers.get("x-razorpay-signature")||"";
 const secret=process.env.RAZORPAY_WEBHOOK_SECRET;
 if(!secret)return NextResponse.json({error:"Webhook secret is not configured."},{status:503});
 const expected=crypto.createHmac("sha256",secret).update(raw).digest("hex");
 const a=Buffer.from(expected),b=Buffer.from(signature);
 if(a.length!==b.length||!crypto.timingSafeEqual(a,b))return NextResponse.json({error:"Invalid webhook signature."},{status:400});
 try{
  const event=JSON.parse(raw);
  if(event.event==="payment.captured"){
   const p=event.payload?.payment?.entity;
   if(p?.order_id&&p?.id){
    const db=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const {data:reg}=await db.from("registrations").select("id,amount_paise,currency").eq("razorpay_order_id",p.order_id).maybeSingle();
    if(reg&&p.amount===reg.amount_paise&&p.currency===reg.currency){
     await db.from("registrations").update({payment_status:"paid",razorpay_payment_id:p.id,paid_at:new Date().toISOString()}).eq("id",reg.id);
    }
   }
  }
  if(event.event==="payment.failed"){
   const p=event.payload?.payment?.entity;
   if(p?.order_id){const db=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!);await db.from("registrations").update({payment_status:"failed"}).eq("razorpay_order_id",p.order_id).neq("payment_status","paid");}
  }
  return NextResponse.json({received:true});
 }catch(e){console.error("Razorpay webhook error",e);return NextResponse.json({error:"Webhook processing failed."},{status:500})}
}