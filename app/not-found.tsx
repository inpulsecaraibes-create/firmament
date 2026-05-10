import Link from "next/link";

export default function NotFound() {
  return (
    <main
      style={{ backgroundColor: "var(--fond)", minHeight: "100dvh" }}
      className="flex flex-col items-center justify-center px-6 text-center"
    >
      <div style={{ marginBottom: "16px" }}>
        <div style={{ width: "44px", height: "44px", borderRadius: "50%", backgroundColor: "var(--bordeaux)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
          <span style={{ fontFamily: "Cormorant Garamond, serif", color: "var(--fond-blanc)", fontSize: "24px", fontStyle: "italic" }}>t</span>
        </div>
        <h1 style={{ fontFamily: "Cormorant Garamond, serif", color: "var(--texte)", fontSize: "28px", fontWeight: 300, marginBottom: "14px", lineHeight: "1.3" }}>
          Tu t&apos;es égaré au-delà du Firmament.
        </h1>
        <p style={{ color: "var(--texte-discret)", fontSize: "15px", lineHeight: "1.6", maxWidth: "320px", margin: "0 auto 32px" }}>
          Cette page n&apos;existe pas — mais ta clarté, elle, t&apos;attend.
        </p>
        <Link
          href="/"
          style={{ backgroundColor: "var(--bordeaux)", color: "var(--fond-blanc)", borderRadius: "12px", padding: "14px 28px", fontSize: "15px", fontFamily: "DM Sans, sans-serif", fontWeight: 500, textDecoration: "none", display: "inline-block" }}
        >
          Retourner à l&apos;essentiel →
        </Link>
      </div>
    </main>
  );
}
