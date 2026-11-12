
"use client";

import { useMemo, useState } from "react";

declare global {
  interface Window {
    Razorpay: any;
  }
}

const EVENTS = [
  {
    name: "Innovation Challenge Hackathon",
    desc: "Collaborate, build and demonstrate a practical innovation challenge solution.",
    icon: "⚡",
    upload: "No file required"
  },
  {
    name: "Idea Pitch",
    desc: "Present a compelling idea, explain the problem and pitch your proposed solution.",
    icon: "💡",
    upload: "PowerPoint presentation (PPT/PPTX) · Max 5 MB"
  },
  {
    name: "Project Expo",
    desc: "Exhibit working models, prototypes and engineering innovations.",
    icon: "⚙️",
    upload: "One-page project description · PDF · Max 5 MB"
  },
  {
    name: "Student Startup Showcase",
    desc: "Showcase student-led ventures, products and early-stage startups.",
    icon: "🚀",
    upload: "Startup e-poster · PDF · Max 5 MB"
  }
];

type Member = {
  name: string;
  phone: string;
  email: string;
};

const emptyMember = (): Member => ({
  name: "",
  phone: "",
  email: ""
});

export default function Home() {
  const [event, setEvent] = useState(EVENTS[0].name);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [count, setCount] = useState(0);

  const [team, setTeam] = useState({
    team_name: "",
    participant_type: "Student",
    institution: "",
    department: "",
    team_leader_index: "0"
  });

  const [members, setMembers] = useState<Member[]>([emptyMember()]);
  const [file, setFile] = useState<File | null>(null);

  const chosen = useMemo(
    () => EVENTS.find(e => e.name === event)!,
    [event]
  );

  const updateTeam = (e: any) => {
    setTeam({ ...team, [e.target.name]: e.target.value });
  };

  const updateMember = (
    i: number,
    k: keyof Member,
    v: string
  ) => {
    setMembers(old =>
      old.map((m, j) => j === i ? { ...m, [k]: v } : m)
    );
  };

  function changeEvent(v: string) {
    setEvent(v);
    setFile(null);
    setMessage("");
  }

  async function submit(e: any) {
    e.preventDefault();
    setBusy(true);
    setMessage("");

    try {
      if (file && file.size > 5 * 1024 * 1024) {
        throw new Error("File size must not exceed 5 MB.");
      }

      const fd = new FormData();

      fd.append("team_name", team.team_name);
      fd.append("participant_type", team.participant_type);
      fd.append("institution", team.institution);
      fd.append("department", team.department);
      fd.append("team_leader_index", team.team_leader_index);
      fd.append("event_interest", event);
      fd.append("team_members", JSON.stringify(members));

      if (file) fd.append("submission", file);

      const r = await fetch("/api/register", {
        method: "POST",
        body: fd
      });

      const d = await r.json();

      if (!r.ok) {
        throw new Error(d.error || "Unable to start registration.");
      }

      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";

      script.onload = () => {
        const rz = new window.Razorpay({
          key: d.keyId,
          amount: d.amount,
          currency: d.currency,
          name: "St. Joseph College of Engineering",
          description: `INNOVATE 2027 · ${event} · Team registration`,
          order_id: d.orderId,
          prefill: {
            name: d.leaderName,
            email: d.leaderEmail,
            contact: d.leaderPhone
          },
          theme: { color: "#e5ad35" },

          handler: async (response: any) => {
            try {
              const vr = await fetch("/api/verify-payment", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json"
                },
                body: JSON.stringify({
                  ...response,
                  registrationId: d.registrationId
                })
              });

              const vd = await vr.json();

              if (!vr.ok) {
                throw new Error(vd.error || "Payment verification failed.");
              }

              setMessage(
                `Payment successful. Registration ID: ${vd.registrationCode}. A confirmation will be sent to the team leader.`
              );

              setCount(c => c + 1);
            } catch (err: any) {
              setMessage(err.message);
            }
          },

          modal: {
            ondismiss: () => setMessage(
              "Payment window closed. Your registration remains pending payment; contact iic@stjoseph.ac.in if you need assistance."
            )
          }
        });

        rz.on("payment.failed", (x: any) =>
          setMessage(
            x.error?.description || "Payment failed. Please try again."
          )
        );

        rz.open();
      };

      script.onerror = () => {
        setMessage("Could not load the secure payment window. Please check your connection.");
      };

      document.body.appendChild(script);

    } catch (err: any) {
      setMessage(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="topbar">
        <div className="container">
          <span>ST. JOSEPH COLLEGE OF ENGINEERING · SRIPERUMBUDUR</span>
          <span>11 FEBRUARY 2027 · INNOVATE 2027</span>
        </div>
      </div>

      <nav className="nav">
        <div className="container navin">
          <a className="brand" href="#top">
            INNOVATE<span>2027</span>
          </a>

          <div className="navlinks">
            <a href="#about">About</a>
            <a href="#events">Events</a>
            <a href="#register">Registration</a>
            <a className="btn" href="#register">Register Now ↗</a>
          </div>
        </div>
      </nav>

      <header className="hero" id="top">
        <div className="container hero-grid">

          <div>
            <div className="eyebrow">
              A platform for young innovators
            </div>

            <h1>
              IDEAS INTO
              <br />
              <span>IMPACT.</span>
            </h1>

            <p>
              Real Ideas | Real Solutions. Join students, faculty,
              startups and industry participants to share innovations,
              pitch ideas and showcase solutions.
            </p>

            <div className="hero-meta">
              <span className="pill">📅 11 February 2027</span>
              <span className="pill">
                📍 St. Joseph College of Engineering
              </span>
            </div>

            <a className="btn" href="#register">
              Secure Your Participation →
            </a>
          </div>

          {/* Enlarged poster display */}
          <div
            style={{
              width: "100%",
              minWidth: 0,
              margin: 0,
              padding: 0,
              background: "transparent",
              border: "none",
              borderRadius: 0,
              boxShadow: "none",
              overflow: "hidden"
            }}
          >
            <img
              src="/innovate-poster.png"
              alt="INNOVATE 2027 Official Event Poster"
              style={{
                display: "block",
                width: "100%",
                height: "auto",
                maxWidth: "none",
                maxHeight: "none",
                objectFit: "contain",
                padding: 0,
                margin: 0,
                background: "transparent",
                border: "none",
                borderRadius: 0,
                boxShadow: "none"
              }}
            />
          </div>

        </div>
      </header>

      <section className="section" id="about">
        <div className="container">

          <div className="section-head">
            <div className="eyebrow">The innovation platform</div>
            <h2>Turn your ideas into reality</h2>
            <p>
              INNOVATE 2027 brings together emerging innovators and
              entrepreneurial minds for a day of ideas, prototypes,
              collaboration and impact.
            </p>
          </div>

          <div className="stats">
            <div className="stat">
              <strong>{count}</strong>
              <span>Registrations in this session</span>
            </div>

            <div className="stat">
              <strong>04</strong>
              <span>Participation events</span>
            </div>

            <div className="stat">
              <strong>₹300</strong>
              <span>Per team · Per event</span>
            </div>
          </div>

        </div>
      </section>

      <section
        className="section"
        id="events"
        style={{ background: "#eef2f8" }}
      >
        <div className="container">

          <div className="section-head">
            <div className="eyebrow">Explore the opportunities</div>
            <h2>Four ways to participate</h2>
            <p>
              Each team may register for one or more events separately.
              Each event registration requires a separate payment.
            </p>
          </div>

          <div className="cards">
            {EVENTS.map(x => (
              <div className="card" key={x.name}>
                <div className="symbol">{x.icon}</div>
                <h3>{x.name}</h3>
                <p>{x.desc}</p>
                <div className="upload-note">{x.upload}</div>
              </div>
            ))}
          </div>

        </div>
      </section>

      <section className="section" id="register">
        <div className="container">

          <div className="section-head">
            <div className="eyebrow">Join the movement</div>
            <h2>Team registration</h2>
            <p>
              Registration closes on <b>31 January 2027</b>.
              Fee: <b>₹300 per team per event</b>
              (maximum three students per team).
            </p>
          </div>

          <div className="formwrap">

            <aside className="formintro">
              <div className="eyebrow">INNOVATE 2027</div>
              <h3>Make your next idea count.</h3>

              <p>
                Register your team for the selected event.
                The team leader will receive payment and registration updates.
              </p>

              <p>
                <b>Event date</b>
                <br />
                11 February 2027
              </p>

              <p>
                <b>Venue</b>
                <br />
                St. Joseph College of Engineering
                <br />
                Sriperumbudur, Tamil Nadu
              </p>

              <p>
                <b>Registration deadline</b>
                <br />
                31 January 2027
              </p>

              <p>
                <b>Fee</b>
                <br />
                ₹300 per team per event
              </p>

              <p className="notice" style={{ color: "#d7e2f5" }}>
                Payments will be processed through the authorised
                SJIIF payment gateway after it is connected.
              </p>
            </aside>

            <form className="formbox" onSubmit={submit}>
              <div className="formgrid">

                <div className="field full">
                  <label>Participation event *</label>

                  <select
                    value={event}
                    onChange={e => changeEvent(e.target.value)}
                  >
                    {EVENTS.map(x => (
                      <option key={x.name}>{x.name}</option>
                    ))}
                  </select>

                  <p className="notice">{chosen.upload}</p>
                </div>

                <div className="field">
                  <label>Team name *</label>
                  <input
                    name="team_name"
                    value={team.team_name}
                    onChange={updateTeam}
                    required
                    maxLength={100}
                  />
                </div>

                <div className="field">
                  <label>Participant category *</label>
                  <select
                    name="participant_type"
                    value={team.participant_type}
                    onChange={updateTeam}
                  >
                    <option>Student</option>
                    <option>Faculty</option>
                    <option>Startup</option>
                    <option>Industry</option>
                  </select>
                </div>

                <div className="field full">
                  <label>College / Organisation *</label>
                  <input
                    name="institution"
                    value={team.institution}
                    onChange={updateTeam}
                    required
                    maxLength={180}
                  />
                </div>

                <div className="field">
                  <label>Department</label>
                  <input
                    name="department"
                    value={team.department}
                    onChange={updateTeam}
                    maxLength={100}
                  />
                </div>

                <div className="field">
                  <label>Number of team members *</label>
                  <select
                    value={String(members.length)}
                    onChange={e =>
                      setMembers(old =>
                        Array.from(
                          { length: Number(e.target.value) },
                          (_, i) => old[i] || emptyMember()
                        )
                      )
                    }
                  >
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                  </select>
                </div>

                {members.map((m, i) => (
                  <div className="memberbox field full" key={i}>
                    <h4>
                      Team member {i + 1}
                      {i === Number(team.team_leader_index)
                        ? " · Team Leader"
                        : ""}
                    </h4>

                    <div className="formgrid">

                      <div className="field">
                        <label>Full name *</label>
                        <input
                          value={m.name}
                          onChange={e =>
                            updateMember(i, "name", e.target.value)
                          }
                          required
                          maxLength={100}
                        />
                      </div>

                      <div className="field">
                        <label>Mobile number *</label>
                        <input
                          value={m.phone}
                          onChange={e =>
                            updateMember(i, "phone", e.target.value)
                          }
                          required
                          pattern="[0-9+() -]{8,18}"
                          maxLength={18}
                        />
                      </div>

                      <div className="field full">
                        <label>Email address *</label>
                        <input
                          type="email"
                          value={m.email}
                          onChange={e =>
                            updateMember(i, "email", e.target.value)
                          }
                          required
                          maxLength={160}
                        />
                      </div>

                    </div>
                  </div>
                ))}

                <div className="field full">
                  <label>Team leader *</label>
                  <select
                    name="team_leader_index"
                    value={team.team_leader_index}
                    onChange={updateTeam}
                  >
                    {members.map((m, i) => (
                      <option key={i} value={i}>
                        Member {i + 1}
                        {m.name ? ` – ${m.name}` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                {event !== EVENTS[0].name && (
                  <div className="field full">
                    <label>
                      {event === "Idea Pitch"
                        ? "Idea Pitch PPT/PPTX"
                        : event === "Project Expo"
                          ? "One-page Project PDF"
                          : "Student Startup e-poster PDF"}
                      * (Maximum 5 MB)
                    </label>

                    <input
                      type="file"
                      accept={
                        event === "Idea Pitch"
                          ? ".ppt,.pptx,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
                          : ".pdf,application/pdf"
                      }
                      required
                      onChange={e =>
                        setFile(e.target.files?.[0] || null)
                      }
                    />

                    <p className="notice">
                      Maximum file size: 5 MB.
                      {event === "Project Expo"
                        ? " The PDF should contain one page."
                        : " Upload the final presentation/poster file."}
                    </p>
                  </div>
                )}

                <div className="field full">

                  <div className="fee-line">
                    <span>Registration fee</span>
                    <strong>₹300.00</strong>
                  </div>

                  <button className="btn dark" disabled={busy}>
                    {busy
                      ? "Preparing secure checkout…"
                      : "Continue to secure payment →"}
                  </button>

                  <p className="notice">
                    One payment covers one team in one event.
                    To participate in another event, submit a separate
                    registration and payment. By proceeding, you consent
                    to use of the submitted details for event administration
                    and communication.
                  </p>

                  {message && (
                    <div
                      className={
                        message.startsWith("Payment successful")
                          ? "success"
                          : "error"
                      }
                    >
                      {message}
                    </div>
                  )}

                </div>

              </div>
            </form>

          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="container footerin">

          <div>
            <div className="brand" style={{ color: "#fff" }}>
              INNOVATE<span>2027</span>
            </div>

            <p>
              Organised by SJCE Innovation and Incubation Forum (SJIIF)
              <br />
              St. Joseph College of Engineering
            </p>
          </div>

          <div>
            <b>Contact & information</b>

            <p>
              Staff Coordinator: Dr. Joe Raja Ruban · 9566570267
            </p>

            <p>
              Student Coordinator: Saiprasanth · 9171113187
            </p>

            <p>
              <a href="mailto:iic@stjoseph.ac.in">
                iic@stjoseph.ac.in
              </a>
            </p>

            <p>
              <a
                href="https://www.stjoseph.ac.in/"
                target="_blank"
                rel="noreferrer"
              >
                www.stjoseph.ac.in
              </a>
            </p>
          </div>

        </div>
      </footer>
    </>
  );
}
