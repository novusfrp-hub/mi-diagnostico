// pages/api/notificar-telegram.js
// Endpoint para notificar al propietario (Marshall Cell) vía Telegram cuando un nuevo usuario se registra

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido. Utilizar POST.' });
  }

  try {
    const { nombre, email, taller, telefono, uid } = req.body || {};

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID || process.env.TELEGRAM_ADMIN_CHAT_ID;

    // Si aún no se han configurado los tokens de Telegram en .env.local, responder de forma exitosa sin romper el flujo
    if (!botToken || !chatId) {
      console.warn('⚠️ [TELEGRAM NOTIFY] Variables TELEGRAM_BOT_TOKEN o TELEGRAM_CHAT_ID no configuradas en .env.local');
      return res.status(200).json({
        ok: true,
        enviado: false,
        motivo: 'Variables de entorno de Telegram no configuradas'
      });
    }

    const fechaHora = new Date().toLocaleString('es-PE', {
      timeZone: 'America/Lima',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    const mensajeTelegram = [
      `🔔 *NUEVO REGISTRO EN MARSHALL HARDWARE SUITE™*`,
      `━━━━━━━━━━━━━━━━━━━━`,
      `👤 *Técnico:* ${nombre || 'Sin nombre'}`,
      `🏢 *Taller / Lab:* ${taller || 'No especificado'}`,
      `📧 *Email:* ${email || 'No especificado'}`,
      `📱 *WhatsApp:* ${telefono || 'No especificado'}`,
      `🆔 *UID:* \`${uid || 'N/A'}\``,
      `📅 *Fecha:* ${fechaHora}`,
      `━━━━━━━━━━━━━━━━━━━━`,
      `⚙️ *Estado:* 🟡 *PENDIENTE DE ACTIVACIÓN*`,
      `👉 _Ingresa a Marshall Hardware Suite para activar el acceso o asignar rol de Editor/Técnico._`
    ].join('\n');

    const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const response = await fetch(telegramUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: mensajeTelegram,
        parse_mode: 'Markdown'
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ [TELEGRAM ERROR]', data);
      return res.status(200).json({
        ok: false,
        enviado: false,
        error: data.description || 'Error al comunicarse con Telegram'
      });
    }

    return res.status(200).json({ ok: true, enviado: true });
  } catch (error) {
    console.error('❌ [API NOTIFICAR TELEGRAM ERROR]:', error);
    return res.status(500).json({ ok: false, error: error.message });
  }
}
