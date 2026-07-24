import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from app.core.config import settings


def send_otp_email(to_email: str, otp: str):
    subject = "OTP"
    body = f"Your OTP is {otp}"

    msg = MIMEMultipart()
    msg["From"] = settings.SMTP_USERNAME
    msg["To"] = to_email
    msg["Subject"] = subject
    msg.attach(MIMEText(body, "plain"))

    server = smtplib.SMTP("smtp.gmail.com", 587)

    print(server.ehlo())

    print(server.starttls())

    print(server.ehlo())

    print(server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD))
    print("Logged in")

    server.sendmail(
        settings.SMTP_USERNAME,
        to_email,
        msg.as_string(),
    )

    print("Mail sent")
    server.quit()

def send_admin_request_status_email(
    to_email: str,
    full_name: str,
    is_approved: bool,
):
    if is_approved:
        subject = "Admin Access Approved"

        body = f"""
Hello {full_name},

Congratulations!

Your request for admin access has been approved by the SuperAdmin.

You can now login using your registered email and the password you created while submitting your request.

Email: {to_email}

Best Regards,
SuperAdmin
"""
    else:
        subject = "Admin Access Request Rejected"

        body = f"""
Hello {full_name},

Thank you for showing interest in becoming an administrator.

Unfortunately, your request has been rejected by the SuperAdmin.

If you believe this was a mistake, please contact the SuperAdmin.

Best Regards,
SuperAdmin
"""

    msg = MIMEMultipart()
    msg["From"] = settings.SMTP_USERNAME
    msg["To"] = to_email
    msg["Subject"] = subject

    msg.attach(MIMEText(body, "plain"))

    server = smtplib.SMTP("smtp.gmail.com", 587)

    server.ehlo()
    server.starttls()
    server.ehlo()

    server.login(
        settings.SMTP_USERNAME,
        settings.SMTP_PASSWORD,
    )

    server.sendmail(
        settings.SMTP_USERNAME,
        to_email,
        msg.as_string(),
    )

    server.quit()