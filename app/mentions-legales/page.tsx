/* eslint-disable react/no-unescaped-entities */
export default function MentionsLegales() {
  return (
    <main style={{ maxWidth: "640px", margin: "0 auto", padding: "60px 24px", fontFamily: "DM Sans, sans-serif", color: "#1A1210" }}>
      <a href="/" style={{ color: "#5C1A2E", fontSize: "13px", textDecoration: "none", display: "block", marginBottom: "32px" }}>← Retour</a>
      <h1 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "32px", fontWeight: 300, marginBottom: "32px" }}>Mentions légales</h1>

      <h2 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "8px", marginTop: "24px" }}>Éditeur</h2>
      <p style={{ fontSize: "14px", lineHeight: "1.7", color: "#3D2E28" }}>
        DULEME AND CIE<br />
        27, chemin Malanga<br />
        97215 Rivière Salée<br />
        Martinique, France<br />
        Email : admin@frmmnt.fr<br />SAS, société par actions simplifiées<br />
        <br />
        SIRET : 932 389 844 00014<br />
        N° TVA : FR41932389844 · RCS Fort-de-France 932 389 844
      </p>

      <h2 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "8px", marginTop: "24px" }}>Hébergement</h2>
      <p style={{ fontSize: "14px", lineHeight: "1.7", color: "#3D2E28" }}>
        Vercel Inc. — 440 N Barranca Ave #4133, Covina, CA 91723, USA<br />
        Supabase Inc. — Données hébergées en Europe (West EU)
      </p>

      <h2 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "8px", marginTop: "24px" }}>Propriété intellectuelle</h2>
      <p style={{ fontSize: "14px", lineHeight: "1.7", color: "#3D2E28" }}>
        L'ensemble du contenu de FIRMAMENT (textes, design, logo, système prompt Terri) est la propriété exclusive de Duleme & Cie. Toute reproduction est interdite sans autorisation préalable.
      </p>

      <p style={{ fontSize: "12px", color: "#B0A098", marginTop: "48px" }}>Powered by Duleme & Cie · frmmnt.fr</p>
    </main>
  );
}
