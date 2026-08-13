// services/emailService.js
const nodemailer = require('nodemailer');

/**
 * Crée un transporteur nodemailer depuis les variables d'environnement.
 * En développement, si SMTP_HOST n'est pas défini, on imprime simplement
 * le contenu du mail dans la console (mode "preview").
 */
function createTransport() {
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  // Mode développement : log dans la console
  return {
    sendMail: async (options) => {
      console.log('\n📧 ══════════════════════════════════════');
      console.log(`   À       : ${options.to}`);
      console.log(`   Sujet   : ${options.subject}`);
      console.log('   Contenu :');
      console.log(options.text || options.html);
      console.log('══════════════════════════════════════\n');
      return { messageId: 'dev-preview' };
    },
  };
}

/**
 * Envoie l'email de réinitialisation de mot de passe.
 * @param {string} to       - Adresse email du destinataire
 * @param {string} resetUrl - URL complète de réinitialisation
 */
async function sendPasswordResetEmail(to, resetUrl) {
  const transport = createTransport();
  const from = process.env.SMTP_FROM || 'Maze NFC <noreply@mazenfc.com>';

  await transport.sendMail({
    from,
    to,
    subject: 'Réinitialisation de votre mot de passe — Maze NFC',
    text: `
Bonjour,

Vous avez demandé la réinitialisation de votre mot de passe.
Cliquez sur le lien ci-dessous (valable 1 heure) :

${resetUrl}

Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.

L'équipe Maze NFC
    `.trim(),
    html: `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f5f5f5">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding:40px 20px">
        <table width="100%" max-width="560" cellpadding="0" cellspacing="0"
               style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08)">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#6A35FF,#BC43FF);padding:40px 40px 30px;text-align:center">
              <h1 style="color:#fff;margin:0;font-size:24px;font-weight:700">Maze NFC</h1>
              <p style="color:rgba(255,255,255,.85);margin:8px 0 0;font-size:14px">Gestion de fidélité NFC</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px">
              <h2 style="color:#1a1a2e;margin:0 0 16px;font-size:20px">Réinitialisation du mot de passe</h2>
              <p style="color:#64748b;line-height:1.6;margin:0 0 24px">
                Vous avez demandé la réinitialisation de votre mot de passe.<br>
                Cliquez sur le bouton ci-dessous pour en choisir un nouveau.
              </p>
              <div style="text-align:center;margin:32px 0">
                <a href="${resetUrl}"
                   style="display:inline-block;background:linear-gradient(135deg,#6A35FF,#BC43FF);color:#fff;
                          text-decoration:none;padding:14px 32px;border-radius:12px;font-weight:600;font-size:15px">
                  Réinitialiser le mot de passe
                </a>
              </div>
              <p style="color:#94a3b8;font-size:13px;margin:0">
                ⏱ Ce lien expire dans <strong>1 heure</strong>.<br>
                Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;padding:24px 40px;text-align:center;border-top:1px solid #e2e8f0">
              <p style="color:#94a3b8;font-size:12px;margin:0">© ${new Date().getFullYear()} Maze NFC. Tous droits réservés.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim(),
  });
}

module.exports = { sendPasswordResetEmail };
