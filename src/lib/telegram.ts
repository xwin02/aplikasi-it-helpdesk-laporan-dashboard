/**
 * Telegram Bot Notification Helper
 * Sends messages to a Telegram chat via Bot API
 */

const TELEGRAM_API = 'https://api.telegram.org';

export async function sendTelegramNotification(message: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.warn('⚠️ Telegram not configured: missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID');
    return;
  }

  try {
    const url = `${TELEGRAM_API}/bot${token}/sendMessage`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('❌ Telegram notification failed:', err);
    } else {
      console.log('✅ Telegram notification sent');
    }
  } catch (error) {
    // Never let notification failure break the main request
    console.error('❌ Telegram notification error:', error);
  }
}

/** Format date to WIB (UTC+7) */
export function formatDateWIB(date: Date = new Date()): string {
  return date.toLocaleString('id-ID', {
    timeZone: 'Asia/Jakarta',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
