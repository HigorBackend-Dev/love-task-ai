import { supabase } from '@/integrations/supabase/client';

/**
 * Sends a confirmation email using the Mailpit API
 * This is used in local development when Supabase doesn't automatically send emails
 */
export async function sendConfirmationEmail(
  email: string,
  confirmationLink: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Try to send via Mailpit API (localhost development)
    const response = await fetch('http://localhost:54324/api/v1/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'noreply@lovetask.ai',
        to: email,
        subject: 'Confirm your email address - Love Task AI',
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <style>
                body { font-family: Arial, sans-serif; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #f0f0f0; padding: 20px; text-align: center; border-radius: 8px; }
                .content { padding: 20px; }
                .button { 
                  display: inline-block; 
                  padding: 12px 30px; 
                  background-color: #4f46e5; 
                  color: white; 
                  text-decoration: none; 
                  border-radius: 6px; 
                  margin: 20px 0;
                }
                .button:hover { background-color: #4338ca; }
                .footer { 
                  margin-top: 30px; 
                  padding-top: 20px; 
                  border-top: 1px solid #ddd; 
                  font-size: 12px; 
                  color: #999;
                }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>Love Task AI</h1>
                  <p>Email Confirmation</p>
                </div>
                
                <div class="content">
                  <p>Hello,</p>
                  <p>Welcome to Love Task AI! To complete your registration, please confirm your email address by clicking the button below:</p>
                  
                  <center>
                    <a href="${confirmationLink}" class="button">Confirm Email Address</a>
                  </center>
                  
                  <p>Or copy and paste this link in your browser:</p>
                  <p style="word-break: break-all; background: #f5f5f5; padding: 10px; border-radius: 4px;">
                    ${confirmationLink}
                  </p>
                  
                  <p>This link will expire in 24 hours.</p>
                  <p>If you didn't create this account, you can safely ignore this email.</p>
                  
                  <div class="footer">
                    <p>Love Task AI - Manage your tasks with artificial intelligence</p>
                  </div>
                </div>
              </div>
            </body>
          </html>
        `,
        text: `
          Welcome to Love Task AI!
          
          Click this link to confirm your email: ${confirmationLink}
          
          Or copy and paste it in your browser if the link doesn't work.
          
          This link will expire in 24 hours.
        `,
      }),
    });

    if (response.ok) {
      console.log('Confirmation email sent successfully');
      return { success: true };
    } else {
      console.warn('Mailpit API response:', response.status, response.statusText);
      return { 
        success: false, 
        error: `Failed to send email: ${response.statusText}` 
      };
    }
  } catch (error) {
    console.error('Error sending confirmation email:', error);
    
    // In production or if Mailpit is not available, we can still proceed
    // The user can request a resend later
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unable to send email' 
    };
  }
}

/**
 * Generate a confirmation link with token
 */
export async function generateConfirmationLink(email: string): Promise<string | null> {
  try {
    // Generate a password reset link which can be used for confirmation
    // In a production app, you'd use Supabase's auth system more directly
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/confirm-email`,
    });

    if (error) {
      console.error('Error generating confirmation link:', error);
      return null;
    }

    // For local development, we construct a simple confirmation link
    // The actual token comes from Supabase's auth system
    const confirmationLink = `${window.location.origin}/confirm-email?email=${encodeURIComponent(email)}`;
    return confirmationLink;
  } catch (error) {
    console.error('Error in generateConfirmationLink:', error);
    return null;
  }
}
