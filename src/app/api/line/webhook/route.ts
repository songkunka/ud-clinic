import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const channelSecret = process.env.LINE_CHANNEL_SECRET;
    const bodyText = await req.text();

    // Verify signature if secret is provided
    if (channelSecret) {
      const signature = req.headers.get('x-line-signature');
      if (signature) {
        const hash = crypto
          .createHmac('sha256', channelSecret)
          .update(bodyText)
          .digest('base64');
        if (hash !== signature) {
          return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
        }
      }
    }

    const body = JSON.parse(bodyText);
    const events = body.events || [];

    for (const event of events) {
      const userId = event.source?.userId;
      // When a user follows or sends text (e.g. phone number)
      if (event.type === 'message' && event.message?.type === 'text') {
        const text = (event.message.text || '').trim();
        const cleanPhone = text.replace(/[^0-9]/g, '');

        // If user typed a phone number, reply with registration confirmation and deep link
        const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
        if (token && event.replyToken && (cleanPhone.length === 9 || cleanPhone.length === 10)) {
          const host = req.headers.get('host') || 'localhost:3000';
          const proto = host.includes('localhost') ? 'http' : 'https';
          const linkUrl = `${proto}://${host}/client?lineUserId=${userId}&phone=${cleanPhone}`;

          await fetch('https://api.line.me/v2/bot/message/reply', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              replyToken: event.replyToken,
              messages: [
                {
                  type: 'text',
                  text: `ขอบคุณค่ะ ระบบได้บันทึก LINE ID ของท่านแล้ว สามารถแตะลิงก์นี้เพื่อเข้าสู่ระบบติดตามอาการและถ่ายภาพประจำวันได้ทันทีค่ะ:\n\n${linkUrl}`,
                },
              ],
            }),
          });
        }
      }
    }

    return NextResponse.json({ status: 'ok' });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Webhook error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
