<!DOCTYPE html>
<html>
<head>
    <title>Your 2FA Code</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #f4f4f5; padding: 40px; text-align: center;">
    <div style="max-width: 500px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
        <h2 style="color: #6d28d9; margin-bottom: 20px;">Lucky Boba POS</h2>
        <p style="color: #52525b; font-size: 16px;">You are attempting to log in as a Superadmin. Please enter the following 6-digit code to verify your identity:</p>
        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; color: #16a34a; font-size: 32px; font-weight: bold; letter-spacing: 5px; padding: 15px; margin: 30px 0; border-radius: 8px;">
            {{ $code }}
        </div>
        <p style="color: #a1a1aa; font-size: 12px; margin-top: 30px;">This code will expire in 10 minutes. If you did not request this login, please secure your account immediately.</p>
    </div>
</body>
</html>
