<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Security Code</title>
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f9f9fb; padding: 20px; color: #1a1a1a; line-height: 1.6;">
    <div style="max-width: 480px; margin: 0 auto; background: #ffffff; padding: 40px; border-radius: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); text-align: center;">
        
        <div style="margin-bottom: 30px;">
            <h1 style="color: #6d28d9; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.02em;">Lucky Boba</h1>
            <p style="text-transform: uppercase; font-size: 10px; letter-spacing: 0.2em; color: #a1a1aa; margin-top: 4px; font-weight: 700;">Internal Terminal Access</p>
        </div>

        <div style="background: #f5f3ff; width: 60px; height: 60px; border-radius: 20px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 24px;">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        </div>

        <h2 style="font-size: 20px; font-weight: 700; margin-bottom: 12px; color: #18181b;">Security Verification</h2>
        <p style="color: #71717a; font-size: 15px; margin-bottom: 32px; padding: 0 20px;">
            You are attempting to log in as a <strong>Superadmin</strong>. Please use the verification code below to complete your sign-in:
        </p>

        <div style="background: #fafafa; border: 2px dashed #e4e4e7; color: #18181b; font-size: 36px; font-weight: 800; letter-spacing: 8px; padding: 20px; margin-bottom: 32px; border-radius: 12px; font-family: monospace;">
            {{ $code }}
        </div>

        <p style="color: #a1a1aa; font-size: 13px; margin-bottom: 0;">
            This code expires in <strong>10 minutes</strong>.
        </p>
        
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #f4f4f5;">
            <p style="color: #d4d4d8; font-size: 11px; margin: 0; text-transform: uppercase; letter-spacing: 0.05em;">
                If you did not request this code, please ignore this email.
            </p>
        </div>
    </div>
    
    <div style="text-align: center; margin-top: 24px;">
        <p style="color: #d4d4d8; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em;">
            Lucky Boba POS &copy; 2026
        </p>
    </div>
</body>
</html>
