/* eslint-disable react/no-unescaped-entities */
export default function CGU() {
  return (
    <main style={{ maxWidth: "640px", margin: "0 auto", padding: "60px 24px", fontFamily: "DM Sans, sans-serif", color: "#1A1210" }}>
      <a href="/" style={{ color: "#5C1A2E", fontSize: "13px", textDecoration: "none", display: "block", marginBottom: "32px" }}>← Retour</a>
      <h1 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "32px", fontWeight: 300, marginBottom: "8px" }}>Conditions Générales d'Utilisation</h1>
      <p style={{ color: "#B0A098", fontSize: "13px", marginBottom: "32px" }}>Dernière mise à jour : mai 2026</p>

      {[
        { title: "1. Objet", content: "Les présentes CGU régissent l'accès et l'utilisation de FIRMAMENT, plateforme de clarification stratégique éditée par Duleme & Cie." },
        { title: "2. Accès au service", content: "FIRMAMENT est accessible via frmmnt.fr après création d'un compte. Une période de découverte gratuite de 30 jours est offerte. L'abonnement FIRMAMENT Pro est disponible à 12,50 €/mois." },
        { title: "3. Règles d'usage", content: "L'utilisateur s'engage à utiliser FIRMAMENT pour un usage personnel et professionnel licite. Il est interdit d'utiliser FIRMAMENT pour générer du contenu illégal, de tenter de contourner les systèmes de sécurité, ou de revendre l'accès à des tiers." },
        { title: "4. Terri ne remplace pas un professionnel", content: "Terri est un compagnon stratégique. Les suggestions de Terri ne constituent en aucun cas des conseils juridiques, fiscaux, médicaux ou financiers. Pour toute décision importante, consultez un professionnel qualifié." },
        { title: "5. Résiliation", content: "L'utilisateur peut supprimer son compte à tout moment depuis les Paramètres. L'abonnement Pro peut être résilié depuis le Stripe Customer Portal, accessible dans les Paramètres. La résiliation prend effet à la fin de la période en cours." },
        { title: "6. Limitation de responsabilité", content: "Duleme & Cie fait son possible pour maintenir FIRMAMENT disponible. En cas d'interruption, notre responsabilité est limitée à la période d'indisponibilité. Nous ne sommes pas responsables des décisions prises sur la base des suggestions de Terri." },
        { title: "7. Droit applicable", content: "Les présentes CGU sont soumises au droit français. Tout litige sera soumis aux tribunaux compétents de Martinique." },
      ].map(({ title, content }) => (
        <div key={title} style={{ marginBottom: "24px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "8px" }}>{title}</h2>
          <p style={{ fontSize: "14px", lineHeight: "1.7", color: "#3D2E28" }}>{content}</p>
        </div>
      ))}

      <p style={{ fontSize: "12px", color: "#B0A098", marginTop: "48px" }}>Powered by Duleme & Cie · frmmnt.fr</p>
    </main>
  );
}
