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
