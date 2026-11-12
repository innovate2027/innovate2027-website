
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (
    !process.env.ADMIN_ACCESS_KEY ||
    req.headers.get("x-admin-key") !== process.env.ADMIN_ACCESS_KEY
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { registrationId, memberIndex } = await req.json();

    if (!registrationId || !Number.isInteger(memberIndex) || memberIndex < 0) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const db = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: reg, error } = await db
      .from("registrations")
      .select("*")
      .eq("id", registrationId)
      .single();

    if (error || !reg) {
      return NextResponse.json(
        { error: "Registration not found" },
        { status: 404 }
      );
    }

    const members = reg.team_members as Array<{
      name: string;
      email?: string;
    }>;

    const member = members?.[memberIndex];

    if (!member) {
      return NextResponse.json(
        { error: "Team member not found" },
        { status: 404 }
      );
    }

    const pdf = await PDFDocument.create();
    const page = pdf.addPage([842, 595]);
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
    const font = await pdf.embedFont(StandardFonts.Helvetica);

    page.drawRectangle({
      x: 22,
      y: 22,
      width: 798,
      height: 551,
      borderColor: rgb(0.72, 0.55, 0.15),
      borderWidth: 3
    });

    page.drawRectangle({
      x: 32,
      y: 32,
      width: 778,
      height: 531,
      borderColor: rgb(0.72, 0.55, 0.15),
      borderWidth: 1
    });

    const center = (text: string, y: number, size: number) => {
      const width = bold.widthOfTextAtSize(text, size);
      page.drawText(text, {
        x: (842 - width) / 2,
        y,
        size,
        font: bold,
        color: rgb(0.12, 0.2, 0.35)
      });
    };

    center("ST. JOSEPH COLLEGE OF ENGINEERING", 475, 18);
    center("SJCE INNOVATION AND INCUBATION FORUM (SJIIF)", 440, 13);
    center("INNOVATE 2027", 365, 30);
    center("CERTIFICATE OF PARTICIPATION", 320, 22);

    const name = member.name || "Participant";
    const nameWidth = bold.widthOfTextAtSize(name, 24);

    page.drawText(name, {
      x: (842 - nameWidth) / 2,
      y: 265,
      size: 24,
      font: bold,
      color: rgb(0.12, 0.2, 0.35)
    });

    const category = String(reg.category || reg.event_category || "");
    const team = String(reg.team_name || "");
    const code = String(reg.registration_code || registrationId);

    center("For participating in " + category, 220, 14);
    center("Team: " + team, 190, 13);
    center("11 February 2027", 155, 13);
    center("Certificate ID: " + code + "-M" + (memberIndex + 1), 110, 10);

    page.drawText("Organising Committee", {
      x: 625,
      y: 75,
      size: 11,
      font,
      color: rgb(0.2, 0.2, 0.2)
    });

    const bytes = await pdf.save();

    return new Response(Buffer.from(bytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition":
          'attachment; filename="' +
          code +
          "-M" +
          (memberIndex + 1) +
          '-certificate.pdf"'
      }
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Could not generate certificate" },
      { status: 500 }
    );
  }
}
