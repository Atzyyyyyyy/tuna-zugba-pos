<!DOCTYPE html>
<html>
<head>
    <title>Password Reset</title>
</head>
<body style="font-family: Arial, sans-serif;">
    <h2>Reset Your Password - Tuna Zugba</h2>
    <p>Hello,</p>
    <p>Click the button below to reset your password:</p>

    <p>
        <a href="{{ url('http://localhost:5173/reset-password?token=' . $token . '&email=' . urlencode($notifiable->getEmailForPasswordReset())) }}"
           style="background-color:#2d6a4f; color:white; padding:10px 20px; text-decoration:none; border-radius:5px;">
            Reset Password
        </a>
    </p>

    <p>If you didn’t request a password reset, you can safely ignore this email.</p>
    <p>Thank you,<br><strong>Tuna Zugba Team</strong></p>
</body>
</html>
