import { NextRequest, NextResponse } from 'next/server';
import { buildLineFlexBubble, sendLinePushMessage } from '@/lib/line-service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      toLineUserId,
      patientName,
      hn,
      postOpDay,
      messageType,
      customerMessage,
      retakeAngles,
      doctorOrStaffName,
      caseId,
    } = body;

    const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error:
            'ยังไม่ได้ระบุ LINE_CHANNEL_ACCESS_TOKEN ในไฟล์ .env.local กรุณาตั้งค่า Channel Access Token จาก LINE Developers Console',
          requiresConfig: true,
        },
        { status: 400 }
      );
    }

    if (!toLineUserId || !toLineUserId.startsWith('U')) {
      return NextResponse.json(
        {
          success: false,
          error:
            'เคสนี้ยังไม่มี LINE User ID ของคนไข้ (ต้องให้คนไข้ทัก LINE OA หรือเปิดผ่าน LINE เพื่อบันทึก User ID ก่อน)',
          missingUserId: true,
        },
        { status: 400 }
      );
    }

    const host = req.headers.get('host') || 'localhost:3000';
    const proto = host.includes('localhost') ? 'http' : 'https';
    const clientWebUrl = `${proto}://${host}/client${caseId ? `?caseId=${caseId}` : ''}`;

    const flexBubble = buildLineFlexBubble({
      to: toLineUserId,
      patientName: patientName || 'คนไข้',
      hn: hn || '-',
      postOpDay: Number(postOpDay) || 1,
      messageType: messageType || 'doctor_feedback',
      doctorOrStaffName: doctorOrStaffName || 'ทีมแพทย์ UD Clinic',
      customerMessage: customerMessage || '',
      retakeAngles: retakeAngles || [],
      clientWebUrl,
    });

    const result = await sendLinePushMessage(token, toLineUserId, flexBubble);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'เกิดข้อผิดพลาดในการส่งข้อความผ่าน LINE API',
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'ส่งข้อความ Flex Message เข้าแชท LINE คนไข้สำเร็จ',
      to: toLineUserId,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
