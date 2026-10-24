/**
 * LINE Official Account Messaging API Service for UD Clinic
 * Handles real Push Messages and Flex Message templates
 */

export interface LineFlexMessagePayload {
  to: string; // LINE User ID (e.g. U12345678...)
  patientName: string;
  hn: string;
  postOpDay: number;
  messageType: 'retake_request' | 'doctor_feedback' | 'urgent_alert';
  doctorOrStaffName?: string;
  customerMessage: string;
  retakeAngles?: Array<{ key: string; labelThai: string }>;
  clientWebUrl: string;
}

export function buildLineFlexBubble(payload: LineFlexMessagePayload) {
  const isRetake = payload.messageType === 'retake_request';
  const isUrgent = payload.messageType === 'urgent_alert';

  const headerColor = isUrgent ? '#DC2626' : isRetake ? '#D97706' : '#1E293B';
  const titleText = isUrgent
    ? '⚠️ แจ้งเตือนด่วนจากแพทย์'
    : isRetake
    ? '📸 แจ้งขอภาพถ่ายซ่อมเพิ่มเติม'
    : '🩺 ผลการตรวจประเมินภาพถ่าย';

  const badgeText = `D+${payload.postOpDay}`;

  // Build angle tags if retake requested
  const angleBoxes = (payload.retakeAngles || []).map((ang) => ({
    type: 'box',
    layout: 'horizontal',
    contents: [
      {
        type: 'text',
        text: '•',
        size: 'sm',
        color: '#D97706',
        flex: 0,
      },
      {
        type: 'text',
        text: ang.labelThai,
        size: 'sm',
        color: '#1E293B',
        weight: 'bold',
        margin: 'sm',
        flex: 1,
      },
    ],
  }));

  return {
    type: 'flex',
    altText: `UD Clinic: ${titleText} (คนไข้: ${payload.patientName})`,
    contents: {
      type: 'bubble',
      size: 'mega',
      header: {
        type: 'box',
        layout: 'vertical',
        backgroundColor: headerColor,
        paddingAll: '16px',
        contents: [
          {
            type: 'box',
            layout: 'horizontal',
            contents: [
              {
                type: 'text',
                text: 'UD CLINIC TORO',
                color: '#FFFFFF',
                size: 'xs',
                weight: 'bold',
                flex: 1,
              },
              {
                type: 'text',
                text: badgeText,
                color: '#FFFFFF',
                size: 'xs',
                weight: 'bold',
                align: 'end',
                flex: 0,
              },
            ],
          },
          {
            type: 'text',
            text: titleText,
            color: '#FFFFFF',
            size: 'md',
            weight: 'bold',
            margin: 'sm',
          },
        ],
      },
      body: {
        type: 'box',
        layout: 'vertical',
        paddingAll: '16px',
        contents: [
          {
            type: 'box',
            layout: 'horizontal',
            contents: [
              {
                type: 'text',
                text: 'คนไข้:',
                size: 'xs',
                color: '#64748B',
                flex: 0,
              },
              {
                type: 'text',
                text: `${payload.patientName} (HN: ${payload.hn})`,
                size: 'xs',
                color: '#0F172A',
                weight: 'bold',
                margin: 'sm',
                flex: 1,
              },
            ],
          },
          {
            type: 'separator',
            margin: 'md',
            color: '#E2E8F0',
          },
          ...(isRetake && angleBoxes.length > 0
            ? [
                {
                  type: 'text',
                  text: 'มุมภาพที่ทีมแพทย์ขอความกรุณาถ่ายใหม่:',
                  size: 'xs',
                  color: '#D97706',
                  weight: 'bold',
                  margin: 'md',
                },
                {
                  type: 'box',
                  layout: 'vertical',
                  margin: 'sm',
                  spacing: 'xs',
                  contents: angleBoxes,
                },
              ]
            : []),
          {
            type: 'text',
            text: 'คำแนะนำจากแพทย์ / ทีมดูแล:',
            size: 'xs',
            color: '#64748B',
            margin: 'md',
          },
          {
            type: 'box',
            layout: 'vertical',
            margin: 'sm',
            paddingAll: '12px',
            backgroundColor: '#F8FAFC',
            cornerRadius: '8px',
            borderColor: '#E2E8F0',
            borderWidth: '1px',
            contents: [
              {
                type: 'text',
                text: payload.customerMessage || 'แผลแห้งดี ไม่มีความผิดปกติ ติดตามอาการตามรอบนัดค่ะ',
                size: 'sm',
                color: '#0F172A',
                wrap: true,
                lineSpacing: '4px',
              },
            ],
          },
          ...(payload.doctorOrStaffName
            ? [
                {
                  type: 'text',
                  text: `ผู้ตรวจ: ${payload.doctorOrStaffName}`,
                  size: 'xxs',
                  color: '#94A3B8',
                  align: 'end',
                  margin: 'sm',
                },
              ]
            : []),
        ],
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        paddingAll: '14px',
        contents: [
          {
            type: 'button',
            action: {
              type: 'uri',
              label: isRetake ? 'แตะเพื่อเปิดกล้องถ่ายซ่อม' : 'เปิดดูผลตรวจในระบบ',
              uri: payload.clientWebUrl,
            },
            style: 'primary',
            color: isRetake ? '#D97706' : '#2563EB',
            height: 'sm',
          },
          {
            type: 'text',
            text: 'ระบบติดตามอาการอัตโนมัติ UD Clinic • สายด่วน 081-456-7890',
            size: 'xxs',
            color: '#94A3B8',
            align: 'center',
            margin: 'md',
          },
        ],
      },
    },
  };
}

/**
 * Send real Push Message to patient via LINE Messaging API
 */
export async function sendLinePushMessage(
  channelAccessToken: string,
  toLineUserId: string,
  flexMessage: ReturnType<typeof buildLineFlexBubble>
): Promise<{ success: boolean; status: number; error?: string }> {
  try {
    const res = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${channelAccessToken.trim()}`,
      },
      body: JSON.stringify({
        to: toLineUserId.trim(),
        messages: [flexMessage],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return {
        success: false,
        status: res.status,
        error: `LINE API Error (${res.status}): ${errText}`,
      };
    }

    return { success: true, status: 200 };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown network error';
    return { success: false, status: 500, error: msg };
  }
}
