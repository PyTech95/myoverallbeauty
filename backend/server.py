from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, UploadFile, File
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

import os
import logging
import uuid
import bcrypt
import jwt
import httpx
import aiosmtplib
import mimetypes
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.utils import formataddr
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
from datetime import datetime, timezone, timedelta


# ---------- Env ----------
mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

EMAIL_BASE_URL = "https://integrations.emergentagent.com"
EMAIL_KEY = os.environ.get("EMERGENT_EMAIL_KEY", "")
EMAIL_FROM_NAME = os.environ.get("EMAIL_FROM_NAME", "Overall Beauty & Wellness")
BUSINESS_EMAILS = [
    e.strip()
    for e in os.environ.get("BUSINESS_EMAIL", "Info@myoverallbeauty.com").split(",")
    if e.strip()
]
BUSINESS_EMAIL = BUSINESS_EMAILS[0] if BUSINESS_EMAILS else "Info@myoverallbeauty.com"

# SMTP (Gmail app password recommended)
SMTP_HOST = os.environ.get("SMTP_HOST", "").strip()
SMTP_PORT = int(os.environ.get("SMTP_PORT", "587") or 587)
SMTP_USER = os.environ.get("SMTP_USER", "").strip()
SMTP_PASS = os.environ.get("SMTP_PASS", "").strip()
SMTP_FROM = os.environ.get("SMTP_FROM", "").strip() or SMTP_USER
EMAIL_PROVIDER = "smtp" if SMTP_HOST and SMTP_USER and SMTP_PASS else "resend"
JWT_SECRET = os.environ["JWT_SECRET"]
JWT_ALGORITHM = "HS256"
STAFF_EMAIL = os.environ.get("STAFF_EMAIL", "crystal@overallbeauty.com")
STAFF_PASSWORD = os.environ.get("STAFF_PASSWORD", "Overall2025!")

app = FastAPI(title="Overall Beauty & Wellness API")
api_router = APIRouter(prefix="/api")

# ---------- Uploads config ----------
UPLOAD_DIR = ROOT_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"}
MAX_UPLOAD_BYTES = 8 * 1024 * 1024  # 8 MB


# ---------- Helpers ----------
def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def hash_password(pw: str) -> str:
    return bcrypt.hashpw(pw.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(pw: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(pw.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False


def create_access_token(user_id: str, email: str, role: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "role": role,
        "type": "access",
        "iat": datetime.now(timezone.utc),
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


async def get_current_user(request: Request) -> dict:
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = auth[7:]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


async def require_staff(user: dict = Depends(get_current_user)) -> dict:
    if user.get("role") != "staff":
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    return user


# ---------- Models ----------
class RegisterIn(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=128)
    first_name: str = Field(..., min_length=1, max_length=60)
    last_name: str = Field(..., min_length=1, max_length=60)
    phone: Optional[str] = Field(None, max_length=32)


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    email: EmailStr
    first_name: str
    last_name: str
    role: str
    created_at: str
    phone: Optional[str] = None


class AuthOut(BaseModel):
    token: str
    user: UserOut


class ConsultationCreate(BaseModel):
    model_config = ConfigDict(extra="ignore")
    first_name: str = Field(..., min_length=1, max_length=60)
    last_name: str = Field(..., min_length=1, max_length=60)
    email: EmailStr
    phone: str = Field(..., min_length=6, max_length=32)
    service_interest: Optional[str] = None
    preferred_date: Optional[str] = None
    preferred_time: Optional[str] = None
    message: Optional[str] = None


class Consultation(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    first_name: str
    last_name: str
    email: EmailStr
    phone: str
    service_interest: Optional[str] = None
    preferred_date: Optional[str] = None
    preferred_time: Optional[str] = None
    message: Optional[str] = None
    status: str = "new"
    created_at: str = Field(default_factory=now_iso)
    user_id: Optional[str] = None


class StatusUpdate(BaseModel):
    status: str = Field(..., pattern="^(new|contacted|scheduled|completed|cancelled)$")


class ContactCreate(BaseModel):
    model_config = ConfigDict(extra="ignore")
    name: str = Field(..., min_length=1, max_length=120)
    email: EmailStr
    phone: Optional[str] = None
    message: str = Field(..., min_length=1, max_length=2000)


class ContentIn(BaseModel):
    """Free-form JSON site content payload — validated shallowly."""
    model_config = ConfigDict(extra="allow")
    data: dict = Field(default_factory=dict)


class ScheduleConfig(BaseModel):
    model_config = ConfigDict(extra="ignore")
    working_days: List[int] = Field(default_factory=lambda: [1, 2, 3, 4, 5])  # 0=Mon..6=Sun
    start_time: str = "09:00"  # HH:MM 24h
    end_time: str = "17:00"
    slot_duration_min: int = 45
    buffer_min: int = 0
    blackout_dates: List[str] = Field(default_factory=list)  # YYYY-MM-DD
    lead_time_hours: int = 12
    advance_days: int = 60
    timezone: str = "America/New_York"


# ---------- Email ----------
async def _send_via_smtp(recipient: str, subject: str, html: str, reply_to: Optional[str] = None):
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = formataddr((EMAIL_FROM_NAME, SMTP_FROM))
    msg["To"] = recipient
    if reply_to:
        msg["Reply-To"] = reply_to
    msg.attach(MIMEText(html, "html", "utf-8"))
    try:
        await aiosmtplib.send(
            msg,
            hostname=SMTP_HOST,
            port=SMTP_PORT,
            start_tls=True,
            username=SMTP_USER,
            password=SMTP_PASS,
            timeout=30,
        )
        logging.info(f"SMTP email sent to {recipient}: {subject}")
        return True
    except Exception as e:
        logging.error(f"SMTP send failed to {recipient}: {e}")
        return None


async def _send_via_resend(recipient: str, subject: str, html: str, reply_to: Optional[str] = None):
    if not EMAIL_KEY:
        logging.warning("EMERGENT_EMAIL_KEY not configured")
        return None
    payload = {"to": [recipient], "subject": subject, "html": html, "from_name": EMAIL_FROM_NAME}
    if reply_to:
        payload["contact_email"] = reply_to
    try:
        async with httpx.AsyncClient(timeout=30) as http:
            resp = await http.post(
                f"{EMAIL_BASE_URL}/api/v1/email/send",
                headers={"X-Email-Key": EMAIL_KEY},
                json=payload,
            )
        resp.raise_for_status()
        return resp.json().get("id")
    except httpx.HTTPStatusError as e:
        logging.error(f"Resend send failed: {e.response.status_code} {e.response.text}")
    except Exception as e:
        logging.error(f"Resend send error: {e}")
    return None


async def send_email(recipient: str, subject: str, html: str, reply_to: Optional[str] = None):
    if EMAIL_PROVIDER == "smtp":
        return await _send_via_smtp(recipient, subject, html, reply_to)
    return await _send_via_resend(recipient, subject, html, reply_to)


def _consultation_html(c: Consultation) -> str:
    rows = [
        ("Name", f"{c.first_name} {c.last_name}"),
        ("Email", c.email),
        ("Phone", c.phone),
        ("Service", c.service_interest or "—"),
        ("Preferred Date", c.preferred_date or "—"),
        ("Preferred Time", c.preferred_time or "—"),
        ("Message", (c.message or "—").replace("\n", "<br/>")),
        ("Submitted", c.created_at),
    ]
    tr = "".join(
        f'<tr><td style="padding:10px 14px;border-bottom:1px solid #eee;color:#666;'
        f'font-family:Arial,sans-serif;font-size:12px;letter-spacing:.12em;'
        f'text-transform:uppercase;width:180px;">{k}</td>'
        f'<td style="padding:10px 14px;border-bottom:1px solid #eee;color:#111;'
        f'font-family:Georgia,serif;font-size:15px;">{v}</td></tr>'
        for k, v in rows
    )
    return f"""
    <div style="background:#0A0A0A;padding:40px 20px;font-family:Arial,sans-serif;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0"
        style="max-width:640px;margin:0 auto;background:#F9F6F0;border:1px solid #D4AF37;">
        <tr><td style="padding:36px 40px;border-bottom:1px solid #D4AF3733;">
          <div style="color:#D4AF37;font-size:11px;letter-spacing:.3em;text-transform:uppercase;margin-bottom:12px;">
            Overall Beauty & Wellness
          </div>
          <div style="color:#0A0A0A;font-family:Georgia,serif;font-size:28px;line-height:1.15;font-style:italic;">
            New Consultation Request
          </div>
        </td></tr>
        <tr><td style="padding:24px 24px 32px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0">{tr}</table>
        </td></tr>
      </table>
    </div>
    """


def _parse_slot_to_local(date_str: str, time_str: str) -> Optional[datetime]:
    """Parse '2025-12-05' + '10:00 AM' -> naive datetime (floating local time)."""
    if not date_str or not time_str:
        return None
    try:
        return datetime.strptime(
            f"{date_str} {time_str.strip()}", "%Y-%m-%d %I:%M %p"
        )
    except ValueError:
        try:
            return datetime.strptime(
                f"{date_str} {time_str.strip()}", "%Y-%m-%d %H:%M"
            )
        except ValueError:
            return None


def _calendar_bundle(c: "Consultation") -> Optional[dict]:
    """Return dict of calendar links {google, outlook, ics} for the given booking,
    or None if we don't have a date+time."""
    import urllib.parse as _url
    import base64

    start = _parse_slot_to_local(c.preferred_date, c.preferred_time)
    if not start:
        return None
    end = start + timedelta(minutes=45)

    title = "Complimentary Consultation — Overall Beauty & Wellness"
    location = "Overall Beauty & Wellness, Farmingdale, NY"
    details = (
        "Your complimentary consultation with Crystal G. Marrero, FNP-C at "
        "Overall Beauty & Wellness."
        + (f"\\n\\nService of interest: {c.service_interest}" if c.service_interest else "")
        + "\\n\\nQuestions? Reply to this email or call 516-347-7619."
    )

    # Floating local time (no Z) is safe for a manually-scheduled visit.
    fmt = "%Y%m%dT%H%M%S"
    dtstart = start.strftime(fmt)
    dtend = end.strftime(fmt)
    now_utc = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")

    # Google Calendar
    google = "https://calendar.google.com/calendar/render?" + _url.urlencode(
        {
            "action": "TEMPLATE",
            "text": title,
            "dates": f"{dtstart}/{dtend}",
            "details": details.replace("\\n", "\n"),
            "location": location,
        }
    )

    # Outlook Web
    outlook = "https://outlook.live.com/calendar/0/deeplink/compose?" + _url.urlencode(
        {
            "path": "/calendar/action/compose",
            "rru": "addevent",
            "subject": title,
            "startdt": start.strftime("%Y-%m-%dT%H:%M:%S"),
            "enddt": end.strftime("%Y-%m-%dT%H:%M:%S"),
            "body": details.replace("\\n", "\n"),
            "location": location,
        }
    )

    # .ics as data URL (works with Apple Calendar, Outlook desktop, etc.)
    ics = (
        "BEGIN:VCALENDAR\r\n"
        "VERSION:2.0\r\n"
        "PRODID:-//Overall Beauty and Wellness//EN\r\n"
        "CALSCALE:GREGORIAN\r\n"
        "METHOD:PUBLISH\r\n"
        "BEGIN:VEVENT\r\n"
        f"UID:{c.id}@overallbeauty\r\n"
        f"DTSTAMP:{now_utc}\r\n"
        f"DTSTART:{dtstart}\r\n"
        f"DTEND:{dtend}\r\n"
        f"SUMMARY:{title}\r\n"
        f"DESCRIPTION:{details}\r\n"
        f"LOCATION:{location}\r\n"
        "END:VEVENT\r\n"
        "END:VCALENDAR\r\n"
    )
    ics_b64 = base64.b64encode(ics.encode("utf-8")).decode("ascii")
    ics_data_url = f"data:text/calendar;base64,{ics_b64}"

    return {"google": google, "outlook": outlook, "ics": ics_data_url}


def _client_confirmation_html(c: Consultation) -> str:
    cal = _calendar_bundle(c)
    when_line = ""
    if c.preferred_date and c.preferred_time:
        when_line = (
            f'<p style="margin-top:16px;color:#595654;font-size:13px;">'
            f'When: <b style="color:#0A0A0A;">{c.preferred_date}</b> at '
            f'<b style="color:#0A0A0A;">{c.preferred_time}</b></p>'
        )
    calendar_block = ""
    if cal:
        calendar_block = f"""
        <tr><td style="padding:12px 40px 36px;text-align:center;">
          <div style="color:#D4AF37;font-size:11px;letter-spacing:.28em;text-transform:uppercase;margin-bottom:14px;">
            Add to calendar
          </div>
          <div>
            <a href="{cal['google']}" target="_blank"
              style="display:inline-block;margin:4px;padding:12px 20px;
              background:#0A0A0A;color:#F9F6F0;text-decoration:none;
              font-family:Arial,sans-serif;font-size:11px;letter-spacing:.24em;
              text-transform:uppercase;border:1px solid #D4AF37;">Google</a>
            <a href="{cal['ics']}" download="overall-beauty-consultation.ics"
              style="display:inline-block;margin:4px;padding:12px 20px;
              background:#F9F6F0;color:#0A0A0A;text-decoration:none;
              font-family:Arial,sans-serif;font-size:11px;letter-spacing:.24em;
              text-transform:uppercase;border:1px solid #0A0A0A;">Apple / Outlook</a>
            <a href="{cal['outlook']}" target="_blank"
              style="display:inline-block;margin:4px;padding:12px 20px;
              background:#F9F6F0;color:#0A0A0A;text-decoration:none;
              font-family:Arial,sans-serif;font-size:11px;letter-spacing:.24em;
              text-transform:uppercase;border:1px solid #0A0A0A;">Outlook Web</a>
          </div>
          <div style="margin-top:14px;color:#8b8785;font-size:12px;">
            Save the date so it's on your calendar.
          </div>
        </td></tr>
        """
    return f"""
    <div style="background:#0A0A0A;padding:40px 20px;font-family:Arial,sans-serif;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0"
        style="max-width:640px;margin:0 auto;background:#F9F6F0;border:1px solid #D4AF37;">
        <tr><td style="padding:44px 40px 20px;text-align:center;">
          <div style="color:#D4AF37;font-size:11px;letter-spacing:.3em;text-transform:uppercase;margin-bottom:14px;">
            Overall Beauty & Wellness
          </div>
          <div style="color:#0A0A0A;font-family:Georgia,serif;font-size:32px;line-height:1.15;font-style:italic;">
            Thank you, {c.first_name}.
          </div>
        </td></tr>
        <tr><td style="padding:8px 44px 8px;color:#2C2A29;font-size:15px;line-height:1.7;">
          <p>Your complimentary consultation request has been received. Crystal G. Marrero, FNP-C
          will personally review your inquiry and reach out shortly.</p>
          {when_line}
        </td></tr>
        {calendar_block}
      </table>
    </div>
    """


# ---------- Routes ----------
@api_router.get("/")
async def root():
    return {"status": "ok", "service": "Overall Beauty & Wellness API"}


# --- Auth ---
@api_router.post("/auth/register", response_model=AuthOut)
async def register(payload: RegisterIn):
    email = payload.email.lower().strip()
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="An account with this email already exists.")
    user_doc = {
        "id": str(uuid.uuid4()),
        "email": email,
        "password_hash": hash_password(payload.password),
        "first_name": payload.first_name.strip(),
        "last_name": payload.last_name.strip(),
        "phone": (payload.phone or "").strip() or None,
        "role": "client",
        "created_at": now_iso(),
    }
    await db.users.insert_one(user_doc)
    token = create_access_token(user_doc["id"], email, "client")
    return AuthOut(
        token=token,
        user=UserOut(**{k: v for k, v in user_doc.items() if k != "password_hash"}),
    )


@api_router.post("/auth/login", response_model=AuthOut)
async def login(payload: LoginIn):
    email = payload.email.lower().strip()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Incorrect email or password.")
    token = create_access_token(user["id"], user["email"], user["role"])
    return AuthOut(
        token=token,
        user=UserOut(**{k: v for k, v in user.items() if k not in ("password_hash", "_id")}),
    )


@api_router.get("/auth/me", response_model=UserOut)
async def me(user: dict = Depends(get_current_user)):
    return UserOut(**user)


# --- Consultations ---
@api_router.post("/consultations", response_model=Consultation)
async def create_consultation(payload: ConsultationCreate, request: Request):
    # Prevent double-booking of the same slot
    if payload.preferred_date and payload.preferred_time:
        clash = await db.consultations.find_one(
            {
                "preferred_date": payload.preferred_date,
                "preferred_time": payload.preferred_time,
                "status": {"$ne": "cancelled"},
            }
        )
        if clash:
            raise HTTPException(
                status_code=409,
                detail="That time slot is no longer available. Please choose another.",
            )
    consultation = Consultation(**payload.model_dump())
    # Attach to user if authenticated
    try:
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            u = await get_current_user(request)
            consultation.user_id = u["id"]
    except HTTPException:
        pass
    await db.consultations.insert_one(consultation.model_dump())
    # Notify all business recipients
    for biz in BUSINESS_EMAILS:
        await send_email(
            recipient=biz,
            subject=f"New Consultation — {consultation.first_name} {consultation.last_name}",
            html=_consultation_html(consultation),
            reply_to=consultation.email,
        )
    # Confirm to client
    await send_email(
        recipient=consultation.email,
        subject="Your consultation request — Overall Beauty & Wellness",
        html=_client_confirmation_html(consultation),
        reply_to=BUSINESS_EMAIL,
    )
    return consultation


@api_router.get("/consultations", response_model=List[Consultation])
async def list_consultations(user: dict = Depends(require_staff)):
    docs = await db.consultations.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return docs


@api_router.get("/consultations/mine", response_model=List[Consultation])
async def my_consultations(user: dict = Depends(get_current_user)):
    docs = await db.consultations.find(
        {"$or": [{"user_id": user["id"]}, {"email": user["email"]}]},
        {"_id": 0},
    ).sort("created_at", -1).to_list(500)
    return docs


@api_router.patch("/consultations/{cid}/status", response_model=Consultation)
async def update_consultation_status(
    cid: str, payload: StatusUpdate, user: dict = Depends(require_staff)
):
    res = await db.consultations.find_one_and_update(
        {"id": cid},
        {"$set": {"status": payload.status}},
        return_document=True,
        projection={"_id": 0},
    )
    if not res:
        raise HTTPException(status_code=404, detail="Consultation not found")
    return res


# --- Contact ---
@api_router.post("/contact")
async def create_contact(payload: ContactCreate):
    doc = {
        "id": str(uuid.uuid4()),
        "name": payload.name,
        "email": payload.email,
        "phone": payload.phone,
        "message": payload.message,
        "created_at": now_iso(),
    }
    await db.contacts.insert_one(doc)
    html = (
        f'<div style="font-family:Arial,sans-serif;padding:24px;background:#F9F6F0;">'
        f'<h2 style="font-family:Georgia,serif;color:#0A0A0A;">New Contact Message</h2>'
        f'<p><b>Name:</b> {payload.name}</p>'
        f'<p><b>Email:</b> {payload.email}</p>'
        f'<p><b>Phone:</b> {payload.phone or "—"}</p>'
        f'<p><b>Message:</b><br/>{payload.message.replace(chr(10), "<br/>")}</p>'
        f"</div>"
    )
    for biz in BUSINESS_EMAILS:
        await send_email(
            recipient=biz,
            subject=f"New Contact Message — {payload.name}",
            html=html,
            reply_to=payload.email,
        )
    return {"status": "ok", "id": doc["id"]}


# --- Site content (live editor) ---
@api_router.get("/content")
async def get_content():
    doc = await db.content.find_one({"id": "main"}, {"_id": 0, "id": 0})
    return doc or {}


@api_router.put("/content")
async def put_content(payload: ContentIn, user: dict = Depends(require_staff)):
    data = payload.model_dump().get("data") or {}
    if not isinstance(data, dict):
        raise HTTPException(status_code=400, detail="data must be an object")
    await db.content.update_one(
        {"id": "main"},
        {"$set": {**data, "updated_at": now_iso(), "updated_by": user.get("email")}},
        upsert=True,
    )
    doc = await db.content.find_one({"id": "main"}, {"_id": 0, "id": 0})
    return doc or {}


# ---------- Uploads ----------
@api_router.post("/uploads/image")
async def upload_image(file: UploadFile = File(...), user: dict = Depends(require_staff)):
    ct = (file.content_type or "").lower()
    if ct not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(status_code=415, detail=f"Unsupported image type: {ct or 'unknown'}. Allowed: JPEG, PNG, WEBP, GIF, SVG.")
    ext = mimetypes.guess_extension(ct) or ".bin"
    if ext == ".jpe":
        ext = ".jpg"
    fname = f"{uuid.uuid4().hex}{ext}"
    dest = UPLOAD_DIR / fname
    total = 0
    with dest.open("wb") as f:
        while True:
            chunk = await file.read(1024 * 64)
            if not chunk:
                break
            total += len(chunk)
            if total > MAX_UPLOAD_BYTES:
                f.close()
                try:
                    dest.unlink()
                except Exception:
                    pass
                raise HTTPException(status_code=413, detail="Image too large. Maximum 8 MB.")
            f.write(chunk)
    return {"url": f"/api/uploads/{fname}", "filename": fname, "size": total, "content_type": ct}


@api_router.get("/uploads/{fname}")
async def get_upload(fname: str):
    # Prevent path traversal
    if "/" in fname or ".." in fname or "\\" in fname:
        raise HTTPException(status_code=400, detail="Invalid filename")
    path = UPLOAD_DIR / fname
    if not path.is_file():
        raise HTTPException(status_code=404, detail="Not found")
    return FileResponse(str(path))


# --- Schedule (Calendly-style) ---
DEFAULT_SCHEDULE = ScheduleConfig().model_dump()


def _parse_hhmm(s: str) -> int:
    """Return minutes since midnight."""
    h, m = s.split(":")
    return int(h) * 60 + int(m)


def _fmt_hhmm(minutes: int) -> str:
    h = (minutes // 60) % 24
    m = minutes % 60
    # 12h with AM/PM
    period = "AM" if h < 12 else "PM"
    hh = h % 12 or 12
    return f"{hh}:{m:02d} {period}"


async def _get_schedule() -> dict:
    doc = await db.schedule.find_one({"id": "main"}, {"_id": 0, "id": 0}) or {}
    merged = {**DEFAULT_SCHEDULE, **doc}
    return merged


@api_router.get("/schedule/config")
async def get_schedule_config():
    return await _get_schedule()


@api_router.put("/schedule/config", response_model=ScheduleConfig)
async def put_schedule_config(
    payload: ScheduleConfig, user: dict = Depends(require_staff)
):
    data = payload.model_dump()
    await db.schedule.update_one(
        {"id": "main"},
        {"$set": {**data, "updated_at": now_iso(), "updated_by": user.get("email")}},
        upsert=True,
    )
    return payload


@api_router.get("/schedule/availability")
async def get_availability(date: str):
    """Return list of available slots for a given YYYY-MM-DD date."""
    try:
        d = datetime.strptime(date, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date (YYYY-MM-DD)")

    cfg = await _get_schedule()

    now = datetime.now(timezone.utc)
    # lead time
    min_start = now + timedelta(hours=cfg["lead_time_hours"])
    # advance days
    max_start = (now + timedelta(days=cfg["advance_days"])).date()

    if d > max_start or d < now.date():
        return {"date": date, "available": [], "reason": "out_of_range"}

    weekday = d.weekday()  # 0=Mon..6=Sun
    if weekday not in cfg["working_days"]:
        return {"date": date, "available": [], "reason": "day_off"}

    if date in (cfg.get("blackout_dates") or []):
        return {"date": date, "available": [], "reason": "blackout"}

    start_m = _parse_hhmm(cfg["start_time"])
    end_m = _parse_hhmm(cfg["end_time"])
    slot = int(cfg["slot_duration_min"])
    buf = int(cfg["buffer_min"])

    # Existing bookings for that date
    booked = await db.consultations.find(
        {"preferred_date": date, "status": {"$ne": "cancelled"}},
        {"_id": 0, "preferred_time": 1},
    ).to_list(500)
    taken = {b.get("preferred_time") for b in booked if b.get("preferred_time")}

    slots = []
    cur = start_m
    while cur + slot <= end_m:
        label = _fmt_hhmm(cur)
        # Check lead time — build a datetime at UTC-naive (approx local — user's timezone considered on client)
        slot_dt = datetime.combine(d, datetime.min.time()).replace(
            hour=(cur // 60) % 24, minute=cur % 60, tzinfo=timezone.utc
        )
        if slot_dt < min_start:
            cur += slot + buf
            continue
        if label in taken:
            cur += slot + buf
            continue
        slots.append(label)
        cur += slot + buf

    return {"date": date, "available": slots, "slot_minutes": slot}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=False,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------- Startup ----------
@app.on_event("startup")
async def on_startup():
    try:
        await db.users.create_index("email", unique=True)
        await db.consultations.create_index([("created_at", -1)])
    except Exception as e:
        logging.warning(f"index setup: {e}")

    # Seed staff account (idempotent)
    existing = await db.users.find_one({"email": STAFF_EMAIL.lower()})
    if not existing:
        await db.users.insert_one({
            "id": str(uuid.uuid4()),
            "email": STAFF_EMAIL.lower(),
            "password_hash": hash_password(STAFF_PASSWORD),
            "first_name": "Crystal",
            "last_name": "Marrero",
            "role": "staff",
            "created_at": now_iso(),
        })
        logging.info(f"Seeded staff account: {STAFF_EMAIL}")
    else:
        # Refresh password / role if changed
        updates = {}
        if not verify_password(STAFF_PASSWORD, existing["password_hash"]):
            updates["password_hash"] = hash_password(STAFF_PASSWORD)
        if existing.get("role") != "staff":
            updates["role"] = "staff"
        if updates:
            await db.users.update_one({"email": STAFF_EMAIL.lower()}, {"$set": updates})


logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
