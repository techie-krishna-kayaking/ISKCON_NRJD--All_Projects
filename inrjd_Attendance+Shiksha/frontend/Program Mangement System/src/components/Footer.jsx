const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer
      style={{
        background:
          "linear-gradient(135deg, #1e0a00 0%, #3d1800 50%, #1e0a00 100%)",
        borderTop: "2px solid rgba(200,140,40,0.2)",
        padding: "36px 24px 24px",
        marginTop: "auto",
      }}
    >
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        {/* Top row */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 28,
            justifyContent: "space-between",
            marginBottom: 28,
          }}
        >
          {/* Brand */}
          <div style={{ minWidth: 200 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 9,
                marginBottom: 10,
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 9,
                  background: "rgba(255,255,255,0.1)",
                  border: "1px solid rgba(200,140,40,0.25)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <img
                  src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ2v5i6DrHXxH49E3AawPUIwtaHt0BhcfC6ww&s"
                  alt="lotus"
                  style={{
                    width: "24px",
                    height: "24px",
                    objectFit: "cover",
                    borderRadius: "50%",
                  }}
                />
              </div>
              <div>
                <p
                  style={{
                    fontFamily: "'Cinzel', serif",
                    fontSize: "0.9rem",
                    fontWeight: 700,
                    color: "#fff",
                    margin: 0,
                  }}
                >
                  ISKCON NRJD
                </p>
                <p
                  style={{
                    fontSize: "0.62rem",
                    color: "rgba(255,200,120,0.55)",
                    margin: 0,
                  }}
                >
                  Program Management Portal
                </p>
              </div>
            </div>
            <p
              style={{
                fontSize: "0.78rem",
                color: "rgba(200,160,100,0.6)",
                lineHeight: 1.7,
                maxWidth: 220,
              }}
            >
              A sacred space for our community members to connect, manage, and
              serve together.
            </p>
          </div>

          {/* Quick links */}
          <div>
            <p
              style={{
                fontFamily: "'Cinzel', serif",
                fontSize: "0.6rem",
                fontWeight: 700,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "rgba(200,140,40,0.6)",
                marginBottom: 10,
              }}
            >
              Navigation
            </p>
            {[
              { label: "Home", href: "/" },
              { label: "Member Sign In", href: "/login" },
            ].map(({ label, href }) => (
              <a
                key={href}
                href={href}
                style={{
                  display: "block",
                  marginBottom: 6,
                  fontSize: "0.8rem",
                  color: "rgba(200,160,100,0.65)",
                  textDecoration: "none",
                  transition: "color 0.15s",
                }}
                onMouseEnter={(e) =>
                  (e.target.style.color = "rgba(200,160,100,1)")
                }
                onMouseLeave={(e) =>
                  (e.target.style.color = "rgba(200,160,100,0.65)")
                }
              >
                {label}
              </a>
            ))}
          </div>

          {/* Note */}
          <div style={{ maxWidth: 240 }}>
            <p
              style={{
                fontFamily: "'Cinzel', serif",
                fontSize: "0.6rem",
                fontWeight: 700,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "rgba(200,140,40,0.6)",
                marginBottom: 10,
              }}
            >
              Notice
            </p>
            <p
              style={{
                fontSize: "0.75rem",
                color: "rgba(200,160,100,0.5)",
                lineHeight: 1.7,
              }}
            >
              This is a private portal for organisation members only. If you are
              not a member, please visit our official website.
            </p>
          </div>
        </div>

        {/* Divider */}
        <div
          style={{
            height: 1,
            margin: "0 0 18px",
            background:
              "linear-gradient(90deg, transparent, rgba(200,140,40,0.2), transparent)",
          }}
        />

        {/* Bottom row */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 10,
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <p
            style={{
              fontSize: "0.72rem",
              color: "rgba(200,160,100,0.4)",
              margin: 0,
            }}
          >
            © {year} ISKCON Magadi Main Road. All rights reserved · For members
            only.
          </p>
          <p
            style={{
              fontFamily: "'Noto Serif Devanagari', serif",
              fontSize: "0.8rem",
              color: "rgba(200,140,40,0.35)",
              letterSpacing: "0.06em",
              margin: 0,
            }}
          >
            Hare Krishna
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
