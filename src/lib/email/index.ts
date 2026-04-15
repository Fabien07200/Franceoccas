import nodemailer from 'nodemailer';

const FROM = `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM}>`;

// Use SendGrid SMTP
const transporter = nodemailer.createTransport({
  host: 'smtp.sendgrid.net',
  port: 587,
  auth: {
    user: 'apikey',
    pass: process.env.SENDGRID_API_KEY,
  },
});

// ─── Email Templates ──────────────────────────────────────────────────────────
function baseTemplate(content: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body { font-family: 'DM Sans', Arial, sans-serif; background: #F7F5F0; margin: 0; padding: 20px; }
  .container { max-width: 580px; margin: 0 auto; background: #fff; border-radius: 14px; overflow: hidden; border: 1px solid #E2DDD6; }
  .header { background: #1A1A18; padding: 24px 28px; }
  .logo { font-size: 20px; font-weight: 800; color: #fff; }
  .logo span { color: #E8460A; }
  .body { padding: 28px; }
  h2 { font-size: 20px; font-weight: 700; color: #1A1A18; margin: 0 0 12px; }
  p { font-size: 14px; color: #6B6B66; line-height: 1.7; margin: 0 0 14px; }
  .btn { display: inline-block; background: #E8460A; color: #fff !important; text-decoration: none; padding: 12px 24px; border-radius: 9px; font-size: 14px; font-weight: 600; margin: 8px 0; }
  .price { font-size: 28px; font-weight: 800; color: #1A1A18; }
  .footer { padding: 16px 28px; border-top: 1px solid #E2DDD6; font-size: 11px; color: #AEABA3; }
  .info-box { background: #E1F5EE; border-radius: 9px; padding: 14px; margin: 14px 0; }
  .info-box p { color: #085041; margin: 0; }
  .warning-box { background: #FFF0EB; border-radius: 9px; padding: 14px; margin: 14px 0; }
  .warning-box p { color: #993C1D; margin: 0; }
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <div class="logo">France<span>Occas</span>.fr</div>
  </div>
  <div class="body">${content}</div>
  <div class="footer">
    FranceOccas.fr — La marketplace des objets qui valent de l'argent<br>
    Pour ne plus recevoir ces emails, <a href="${process.env.NEXT_PUBLIC_APP_URL}/compte/notifications">gérez vos préférences</a>
  </div>
</div>
</body>
</html>`;
}

// ─── Email Functions ──────────────────────────────────────────────────────────

export async function sendWelcomeEmail(params: {
  to: string;
  name: string;
  verifyToken: string;
}): Promise<void> {
  const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify?token=${params.verifyToken}`;

  await transporter.sendMail({
    from: FROM,
    to: params.to,
    subject: 'Bienvenue sur FranceOccas.fr — Confirmez votre email',
    html: baseTemplate(`
      <h2>Bienvenue ${params.name} !</h2>
      <p>Votre compte FranceOccas.fr a bien été créé. Pour publier vos premières annonces gratuitement, confirmez votre adresse email.</p>
      <p><a href="${verifyUrl}" class="btn">Confirmer mon email →</a></p>
      <div class="info-box">
        <p>✓ Annonces gratuites et illimitées<br>✓ Paiement sécurisé entre particuliers<br>✓ Livraison assurée partout en France</p>
      </div>
      <p>Ce lien expire dans 24 heures.</p>
    `),
  });
}

export async function sendOfferNotification(params: {
  to: string;
  sellerName: string;
  buyerName: string;
  listingTitle: string;
  offerAmount: number;
  listingPrice: number;
  conversationUrl: string;
}): Promise<void> {
  await transporter.sendMail({
    from: FROM,
    to: params.to,
    subject: `💬 Nouvelle offre reçue — ${params.listingTitle}`,
    html: baseTemplate(`
      <h2>Vous avez reçu une offre !</h2>
      <p>${params.buyerName} a fait une offre sur votre annonce <strong>${params.listingTitle}</strong>.</p>
      <p>Votre prix : <strong>${(params.listingPrice / 100).toFixed(0)} €</strong><br>
      Offre proposée : <span class="price">${(params.offerAmount / 100).toFixed(0)} €</span></p>
      <p><a href="${params.conversationUrl}" class="btn">Voir l'offre et répondre →</a></p>
      <p>L'offre expire dans 24 heures. Vous pouvez l'accepter, la refuser ou faire une contre-offre.</p>
    `),
  });
}

export async function sendSaleConfirmedEmail(params: {
  to: string;
  name: string;
  listingTitle: string;
  amount: number;
  isVendor: boolean;
  deliveryMethod: string;
  transactionId: string;
}): Promise<void> {
  const subject = params.isVendor
    ? `✅ Vente confirmée — ${params.listingTitle}`
    : `✅ Achat confirmé — ${params.listingTitle}`;

  const content = params.isVendor ? `
    <h2>Félicitations, votre vente est confirmée !</h2>
    <p>L'acheteur a effectué le paiement de <span class="price">${(params.amount / 100).toFixed(2)} €</span> pour votre annonce <strong>${params.listingTitle}</strong>.</p>
    <div class="info-box">
      <p>Mode de livraison : <strong>${params.deliveryMethod}</strong><br>
      Le paiement est sécurisé en séquestre. Vous recevrez les fonds dès que l'acheteur confirme la réception.</p>
    </div>
    <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/compte/ventes/${params.transactionId}" class="btn">Gérer la livraison →</a></p>
  ` : `
    <h2>Votre achat est confirmé !</h2>
    <p>Votre paiement de <span class="price">${(params.amount / 100).toFixed(2)} €</span> pour <strong>${params.listingTitle}</strong> a bien été reçu.</p>
    <div class="info-box">
      <p>Le paiement est sécurisé. Les fonds ne seront libérés au vendeur qu'après confirmation de votre réception.</p>
    </div>
    <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/compte/achats/${params.transactionId}" class="btn">Suivre ma commande →</a></p>
  `;

  await transporter.sendMail({ from: FROM, to: params.to, subject, html: baseTemplate(content) });
}

export async function sendBoostExpiringEmail(params: {
  to: string;
  name: string;
  listingTitle: string;
  expiresAt: Date;
  renewUrl: string;
}): Promise<void> {
  await transporter.sendMail({
    from: FROM,
    to: params.to,
    subject: `⚡ Votre boost expire bientôt — ${params.listingTitle}`,
    html: baseTemplate(`
      <h2>Votre boost arrive à expiration</h2>
      <p>Bonjour ${params.name}, le boost de votre annonce <strong>${params.listingTitle}</strong> expire le <strong>${params.expiresAt.toLocaleDateString('fr-FR')}</strong>.</p>
      <div class="warning-box">
        <p>⚡ Sans boost, votre annonce retournera dans les résultats standard. Renouvelez maintenant pour maintenir sa visibilité !</p>
      </div>
      <p><a href="${params.renewUrl}" class="btn">Renouveler le boost →</a></p>
    `),
  });
}

export async function sendListingStagnantEmail(params: {
  to: string;
  name: string;
  listingTitle: string;
  views: number;
  daysActive: number;
  boostUrl: string;
}): Promise<void> {
  await transporter.sendMail({
    from: FROM,
    to: params.to,
    subject: `💡 Boostez votre annonce — ${params.listingTitle}`,
    html: baseTemplate(`
      <h2>Votre annonce peut aller plus loin</h2>
      <p>Votre annonce <strong>${params.listingTitle}</strong> est active depuis ${params.daysActive} jours avec ${params.views} vues. Boostez-la pour être vu par 10× plus d'acheteurs !</p>
      <p><a href="${params.boostUrl}" class="btn">Booster mon annonce dès 2,90 € →</a></p>
    `),
  });
}

export async function sendDisputeOpenedEmail(params: {
  to: string;
  name: string;
  listingTitle: string;
  disputeId: string;
}): Promise<void> {
  await transporter.sendMail({
    from: FROM,
    to: params.to,
    subject: `⚖️ Litige ouvert — ${params.listingTitle}`,
    html: baseTemplate(`
      <h2>Un litige a été ouvert</h2>
      <p>Un litige concernant la transaction pour <strong>${params.listingTitle}</strong> a été ouvert. Notre équipe va analyser le dossier sous 48 heures.</p>
      <div class="warning-box">
        <p>Les fonds sont bloqués en séquestre pendant la durée du litige. Préparez vos preuves (photos, messages).</p>
      </div>
      <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/compte/litiges/${params.disputeId}" class="btn">Accéder au dossier →</a></p>
    `),
  });
}

export async function sendFranchiseInvitationEmail(params: {
  to: string;
  concessionName: string;
  franchiseName: string;
  managerName: string;
  inviteUrl: string;
}): Promise<void> {
  await transporter.sendMail({
    from: FROM,
    to: params.to,
    subject: `Invitation à rejoindre ${params.franchiseName} sur FranceOccas.fr`,
    html: baseTemplate(`
      <h2>Vous êtes invité à rejoindre ${params.franchiseName}</h2>
      <p>${params.managerName}, manager du réseau ${params.franchiseName}, vous invite à rejoindre la plateforme FranceOccas.fr en tant que concessionnaire affilié.</p>
      <div class="info-box">
        <p>✓ Badge franchise visible sur toutes vos annonces<br>✓ Import catalogue automatique<br>✓ Saisie par plaque d'immatriculation<br>✓ Cote Argus Pro en temps réel</p>
      </div>
      <p><a href="${params.inviteUrl}" class="btn">Créer mon compte concessionnaire →</a></p>
      <p>Ce lien d'invitation expire dans 7 jours.</p>
    `),
  });
}

export async function sendPasswordResetEmail(params: {
  to: string;
  name: string;
  resetToken: string;
}): Promise<void> {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password?token=${params.resetToken}`;

  await transporter.sendMail({
    from: FROM,
    to: params.to,
    subject: 'Réinitialisation de votre mot de passe',
    html: baseTemplate(`
      <h2>Réinitialisation du mot de passe</h2>
      <p>Bonjour ${params.name}, vous avez demandé la réinitialisation de votre mot de passe FranceOccas.fr.</p>
      <p><a href="${resetUrl}" class="btn">Réinitialiser mon mot de passe →</a></p>
      <div class="warning-box">
        <p>Ce lien expire dans 1 heure. Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.</p>
      </div>
    `),
  });
}
