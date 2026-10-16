import { extractVerificationFromEmail } from './gemini.ts';

export interface GmailVerificationResult {
  found: boolean;
  messageId?: string;
  sender?: string;
  subject?: string;
  verificationUrl?: string;
  otpCode?: string;
  receivedAt?: string;
  error?: string;
}

export async function checkGmailForVerification(
  accessToken: string,
  targetDomain: string,
  accountEmail?: string,
  sinceEpochMs: number = Date.now() - 15 * 60 * 1000 // Last 15 minutes
): Promise<GmailVerificationResult> {
  if (!accessToken) {
    return {
      found: false,
      error: 'Gmail access token not provided',
    };
  }

  try {
    // Clean target domain to core e.g. "github.com" or "wordpress.org"
    const cleanDomain = targetDomain.replace(/^(?:https?:\/\/)?(?:www\.)?/i, '').split('/')[0].split(':')[0];
    
    // Construct query targeting the domain and verification keywords
    const query = `to:me (${cleanDomain} OR "verify" OR "activate" OR "confirmation" OR "confirm your account")`;
    const searchUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=5`;

    const searchRes = await fetch(searchUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!searchRes.ok) {
      const errText = await searchRes.text();
      return {
        found: false,
        error: `Gmail API error (${searchRes.status}): ${errText.slice(0, 120)}`,
      };
    }

    const searchData = await searchRes.json();
    const messages = searchData.messages || [];

    if (messages.length === 0) {
      return { found: false, error: `No matching verification email found for ${cleanDomain}` };
    }

    // Inspect recent messages
    for (const msg of messages) {
      const detailUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`;
      const detailRes = await fetch(detailUrl, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!detailRes.ok) continue;

      const detailData = await detailRes.json();
      const internalDate = parseInt(detailData.internalDate, 10);

      // Only check recent emails (within last 15 min or close)
      if (internalDate < sinceEpochMs - 60000) {
        continue;
      }

      const headers = detailData.payload?.headers || [];
      const subjectHeader = headers.find((h: any) => h.name.toLowerCase() === 'subject')?.value || '';
      const fromHeader = headers.find((h: any) => h.name.toLowerCase() === 'from')?.value || '';

      // Extract body
      let bodyText = detailData.snippet || '';
      const parts = detailData.payload?.parts || [];

      function extractPartData(partList: any[]): string {
        let content = '';
        for (const p of partList) {
          if (p.body?.data) {
            try {
              const decoded = Buffer.from(p.body.data, 'base64url').toString('utf8');
              content += ' ' + decoded;
            } catch (e) {}
          }
          if (p.parts) {
            content += ' ' + extractPartData(p.parts);
          }
        }
        return content;
      }

      if (parts.length > 0) {
        bodyText += ' ' + extractPartData(parts);
      } else if (detailData.payload?.body?.data) {
        try {
          bodyText += ' ' + Buffer.from(detailData.payload.body.data, 'base64url').toString('utf8');
        } catch (e) {}
      }

      // Check if matches domain or subject
      const verification = await extractVerificationFromEmail(subjectHeader, bodyText, cleanDomain);
      if (verification.isMatch && (verification.verificationUrl || verification.otpCode)) {
        return {
          found: true,
          messageId: msg.id,
          sender: fromHeader,
          subject: subjectHeader,
          verificationUrl: verification.verificationUrl,
          otpCode: verification.otpCode,
          receivedAt: new Date(internalDate).toISOString(),
        };
      }
    }

    return {
      found: false,
      error: `Checked ${messages.length} recent emails; no active verification link or OTP detected for ${cleanDomain}`,
    };
  } catch (err: any) {
    return {
      found: false,
      error: `Gmail lookup error: ${err.message}`,
    };
  }
}
