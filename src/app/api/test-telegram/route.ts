import { NextResponse } from 'next/server';
import { sendTelegramNotification, formatDateWIB } from '@/lib/telegram';

export async function GET() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  // Log env state for debugging
  console.log('🔍 TELEGRAM_BOT_TOKEN:', token ? `SET (${token.substring(0, 10)}...)` : 'NOT SET');
  console.log('🔍 TELEGRAM_CHAT_ID:', chatId ? `SET (${chatId})` : 'NOT SET');

  if (!token || !chatId) {
    return NextResponse.json({
      success: false,
      error: 'Telegram env vars not set',
      TELEGRAM_BOT_TOKEN: token ? 'SET' : 'NOT SET',
      TELEGRAM_CHAT_ID: chatId ? 'SET' : 'NOT SET',
    });
  }

  await sendTelegramNotification(
    `🧪 <b>TEST NOTIFIKASI</b>\n\n` +
    `✅ Telegram berhasil terhubung!\n` +
    `🕐 Waktu: ${formatDateWIB()}\n` +
    `🌐 Server: Production`
  );

  return NextResponse.json({
    success: true,
    message: 'Test notification sent',
    TELEGRAM_BOT_TOKEN: `SET (${token.substring(0, 10)}...)`,
    TELEGRAM_CHAT_ID: chatId,
  });
}
