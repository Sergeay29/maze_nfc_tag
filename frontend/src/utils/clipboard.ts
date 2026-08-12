export async function copyToClipboard(text: string): Promise<void> {
  if (!text) {
    throw new Error('Aucun texte à copier');
  }

  /*
   * Méthode moderne, disponible principalement en HTTPS
   * et sur localhost.
   */
  if (window.isSecureContext && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  /*
   * Fallback pour l'accès temporaire en HTTP par adresse IP.
   * L'opération doit rester déclenchée directement par le clic.
   */
  const textarea = document.createElement('textarea');

  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.setAttribute('aria-hidden', 'true');

  Object.assign(textarea.style, {
    position: 'fixed',
    top: '0',
    left: '0',
    width: '1px',
    height: '1px',
    padding: '0',
    border: '0',
    outline: '0',
    boxShadow: 'none',
    background: 'transparent',
    opacity: '0.01',
  });

  document.body.appendChild(textarea);

  textarea.focus();
  textarea.select();
  textarea.setSelectionRange(0, textarea.value.length);

  const copied = document.execCommand('copy');

  document.body.removeChild(textarea);

  if (!copied) {
    throw new Error('La copie a été refusée par le navigateur');
  }
}
