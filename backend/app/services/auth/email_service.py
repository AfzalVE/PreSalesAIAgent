import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from app.core.config import settings


def send_otp_email(to_email: str, otp: str) -> None:
    """
    Sends the OTP to the user's Gmail via SMTP.
    Requires SMTP_HOST=smtp.gmail.com, SMTP_PORT=587,
    SMTP_USERNAME=<your gmail>, SMTP_PASSWORD=<gmail app password>.
    """
    subject = "Your Login Verification Code"
    body = f"Your OTP for login is: {otp}\n\nThis code expires in 5 minutes. If you did not request this, please ignore this email."

    message = MIMEMultipart()
    message["From"] = settings.SMTP_USERNAME
    message["To"] = to_email
    message["Subject"] = subject
    message.attach(MIMEText(body, "plain"))

    with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
        server.starttls()
        server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
        server.sendmail(settings.SMTP_USERNAME, to_email, message.as_string())