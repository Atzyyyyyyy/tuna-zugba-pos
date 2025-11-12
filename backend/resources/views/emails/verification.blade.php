<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Verify Your Email - Tuna Zugba</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #f7f7f7; padding: 30px;">
    <div style="background: white; border-radius: 8px; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd;">
        <h2 style="color: #2d6a4f;">Welcome to Tuna Zugba!</h2>
        <p>Hi <strong>{{ $user->name }}</strong>,</p>
        <p>Thank you for signing up. Please click the link below to verify your email address:</p>

        <p style="text-align: center; margin: 25px 0;">
            <a href="http://localhost:8000/api/verify-email?token={{ $token }}"
                style="background-color: #2d6a4f; color: white; padding: 12px 20px; border-radius: 6px; text-decoration: none;">
                Verify Email
            </a>
        </p>

        <p>If the button doesn’t work, copy and paste this URL into your browser:</p>
        <p style="word-break: break-all;">http://localhost:8000/api/verify-email?token={{ $token }}</p>

        <p style="margin-top: 30px; font-size: 0.9em; color: gray;">
            This link will expire after 24 hours for security reasons.<br>
            If you didn’t create an account, you can ignore this email.
        </p>

        <hr>
        <p style="text-align: center; font-size: 0.8em; color: #777;">
            Tuna Zugba POS & Online Ordering System © 2025
        </p>
    </div>
</body>
</html>
