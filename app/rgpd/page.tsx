export default function RGPD() {
  return (
    <main style={{ maxWidth: "640px", margin: "0 auto", padding: "60px 24px", fontFamily: "DM Sans, sans-serif", color: "#1A1210" }}>
      <a href="/" style={{ color: "#5C1A2E", fontSize: "13px", textDecoration: "none", display: "block", marginBottom: "32px" }}>← Retour</a>
      <h1 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "32px", fontWeight: 300, marginBottom: "8px" }}>Politique de confidentialité</h1>
      <p style={{ color: "#B0A098", fontSize: "13px", marginBottom: "32px" }}>Dernière mise à jour : mai 2026</p>

      {[
        { title: "Qui collecte vos données ?", content: "Duleme & Cie — 27, chemin Malanga, 97215 Rivière Salée — admin@frmmnt.fr" },
        { title: "Ce que nous collectons", content: "Prénom, adresse email professionnelle, nom ou secteur de l'entreprise, ancienneté en tant que dirigeant, état du moment. Contenus des conversations avec Terri, smart to-dos, décisions prises, objectifs formulés." },
        { title: "Pourquoi nous le collectons", content: "Pour faire fonctionner FIRMAMENT — vous identifier, sauvegarder vos données, personnaliser les réponses de Terri et vous envoyer les communications que vous avez acceptées." },
        { title: "Où vos données sont stockées", content: "Base de données Supabase hébergée en Europe (West EU — Irlande). Vos conversations sont chiffrées en transit et au repos. Elles ne quittent pas FIRMAMENT." },
        { title: "Durée de conservation", content: "Durée de votre abonnement ou compte actif + 12 mois après fermeture. Vous pouvez demander la suppression à tout moment." },
        { title: "Pas de partage ni revente", content: "Nous ne vendons pas vos données. Nous ne les partageons avec aucun tiers sauf nécessité technique (hébergeurs listés dans les mentions légales)." },
        { title: "Vos droits", content: "Accès, rectification, suppression depuis vos Paramètres FIRMAMENT ou par email à admin@frmmnt.fr. Réponse sous 30 jours." },
        { title: "Cookies", content: "Uniquement des cookies fonctionnels (authentification, session). Aucun cookie publicitaire ni de suivi tiers. Vous pouvez refuser les non-essentiels via la bannière à votre première visite." },
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
