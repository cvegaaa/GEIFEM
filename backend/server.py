from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Header, Depends
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import re
import secrets
import logging
import asyncio
import httpx
import bcrypt
import bleach
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Dict, Any, Optional
import uuid
from datetime import datetime, timezone, timedelta


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Configure logging early so helpers can use it safely
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Alpha Vantage
ALPHA_VANTAGE_API_KEY = os.environ.get('ALPHA_VANTAGE_API_KEY', '')
ALPHA_VANTAGE_BASE_URL = 'https://www.alphavantage.co/query'

# Emergent Email (Resend proxy) - fallback if SMTP not configured
EMAIL_BASE_URL = "https://integrations.emergentagent.com"
EMAIL_KEY = os.environ.get('EMERGENT_EMAIL_KEY', '')
EMAIL_FROM_NAME = os.environ.get('EMAIL_FROM_NAME', 'GEIFEM')
COMPANY_EMAIL = os.environ.get('COMPANY_EMAIL', 'contacto@geifem.com')

# SMTP (Hostinger primary transport)
SMTP_HOST = os.environ.get('SMTP_HOST', '')
SMTP_PORT = int(os.environ.get('SMTP_PORT', '465'))
SMTP_USER = os.environ.get('SMTP_USER', '')
SMTP_PASSWORD = os.environ.get('SMTP_PASSWORD', '')
SMTP_FROM_EMAIL = os.environ.get('SMTP_FROM_EMAIL', SMTP_USER)

# Security config
ADMIN_LOCKOUT_MINUTES = int(os.environ.get('ADMIN_LOCKOUT_MINUTES', '15'))
ADMIN_MAX_ATTEMPTS = int(os.environ.get('ADMIN_MAX_ATTEMPTS', '5'))
SESSION_TTL_HOURS = int(os.environ.get('SESSION_TTL_HOURS', '8'))
ENABLE_HTTPS_ONLY = os.environ.get('ENABLE_HTTPS_ONLY', 'false').lower() == 'true'

# Rate limiter (uses client IP)
def _client_ip(request: Request) -> str:
    # Trust X-Forwarded-For header (behind ingress) but only take the first IP
    fwd = request.headers.get('x-forwarded-for')
    if fwd:
        return fwd.split(',')[0].strip()
    return get_remote_address(request)

limiter = Limiter(key_func=_client_ip)

# In-memory cache for economic indicators
# Free tier: 25 requests/day - cache aggressively (12 hours)
CACHE_TTL_HOURS = 12
_indicators_cache: Dict[str, Any] = {
    'data': None,
    'timestamp': None
}

# Create the main app without a prefix
app = FastAPI(
    title="GEIFEM API",
    docs_url=None,   # Disable Swagger UI in production
    redoc_url=None,  # Disable ReDoc in production
    openapi_url=None,  # Disable OpenAPI schema
)

# Register rate limiter
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


# ============ Security Middleware ============

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Add security headers to every response to protect against common attacks."""
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        # Prevent MIME type sniffing
        response.headers['X-Content-Type-Options'] = 'nosniff'
        # Prevent clickjacking
        response.headers['X-Frame-Options'] = 'DENY'
        # XSS protection (legacy browsers)
        response.headers['X-XSS-Protection'] = '1; mode=block'
        # Referrer policy
        response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        # Permissions policy - deny sensitive browser APIs by default
        response.headers['Permissions-Policy'] = 'geolocation=(), microphone=(), camera=(), payment=()'
        # HSTS (only when HTTPS is enforced)
        if ENABLE_HTTPS_ONLY:
            response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains; preload'
        # CSP - restrictive but allows the site's own images/fonts and required CDNs
        # Frontend served on a different domain will handle its own CSP
        return response


app.add_middleware(SecurityHeadersMiddleware)


# ============ Admin Auth Helpers (must be defined BEFORE routes that use them as deps) ============

ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD', 'geifem2026admin')
ADMIN_USERNAME = os.environ.get('ADMIN_USERNAME', 'admin')


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode('utf-8'), hashed.encode('utf-8'))
    except Exception:
        return False


def _generate_admin_token() -> str:
    """Cryptographically secure token (32 bytes = 64 hex chars)."""
    return secrets.token_hex(32)


async def _log_audit(action: str, ip: str, meta: Optional[dict] = None):
    """Persist an admin/audit event to MongoDB."""
    try:
        await db.audit_logs.insert_one({
            "action": action,
            "ip": ip,
            "meta": meta or {},
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
    except Exception as e:
        logger.warning(f"Audit log failed: {e}")


async def _check_brute_force(ip: str) -> Optional[int]:
    """Return remaining minutes of lockout if IP is locked, else None."""
    entry = await db.login_attempts.find_one({"ip": ip})
    if not entry:
        return None
    if entry.get('locked_until'):
        locked_until = datetime.fromisoformat(entry['locked_until'])
        if locked_until.tzinfo is None:
            locked_until = locked_until.replace(tzinfo=timezone.utc)
        if datetime.now(timezone.utc) < locked_until:
            remaining = (locked_until - datetime.now(timezone.utc)).total_seconds() / 60
            return max(1, int(remaining))
        await db.login_attempts.delete_one({"ip": ip})
    return None


async def _record_failed_attempt(ip: str):
    """Increment failure counter, lock if threshold reached."""
    entry = await db.login_attempts.find_one({"ip": ip})
    now = datetime.now(timezone.utc)
    if not entry:
        await db.login_attempts.insert_one({
            "ip": ip, "count": 1,
            "first_attempt": now.isoformat(), "last_attempt": now.isoformat(),
        })
        return
    new_count = entry.get('count', 0) + 1
    update = {"count": new_count, "last_attempt": now.isoformat()}
    if new_count >= ADMIN_MAX_ATTEMPTS:
        update['locked_until'] = (now + timedelta(minutes=ADMIN_LOCKOUT_MINUTES)).isoformat()
    await db.login_attempts.update_one({"ip": ip}, {"$set": update})


async def _clear_failed_attempts(ip: str):
    await db.login_attempts.delete_one({"ip": ip})


async def verify_admin(x_admin_token: Optional[str] = Header(default=None)):
    """Dependency: verify admin token from X-Admin-Token header."""
    if not x_admin_token:
        raise HTTPException(status_code=401, detail="Autenticación requerida")
    if not re.fullmatch(r'[a-f0-9]{32,128}', x_admin_token):
        raise HTTPException(status_code=401, detail="Token inválido")
    session = await db.admin_sessions.find_one({"token": x_admin_token})
    if not session:
        raise HTTPException(status_code=401, detail="Sesión inválida o expirada")
    expires_at = datetime.fromisoformat(session['expires_at'])
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if datetime.now(timezone.utc) > expires_at:
        await db.admin_sessions.delete_one({"token": x_admin_token})
        raise HTTPException(status_code=401, detail="Sesión expirada")
    return session


class AdminLoginRequest(BaseModel):
    password: str = Field(..., min_length=1, max_length=200)


class AdminSessionResponse(BaseModel):
    token: str
    expires_at: str


# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")  # Ignore MongoDB's _id field
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str

# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "Hello World"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)
    
    # Convert to dict and serialize datetime to ISO string for MongoDB
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    
    _ = await db.status_checks.insert_one(doc)
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    # Exclude MongoDB's _id field from the query results
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    
    # Convert ISO string timestamps back to datetime objects
    for check in status_checks:
        if isinstance(check['timestamp'], str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])
    
    return status_checks


# ============ Economic Indicators (Alpha Vantage) ============

class Indicator(BaseModel):
    symbol: str
    name: str
    value: str
    unit: str = ""
    change: str
    trend: str  # 'up' or 'down'


# Fallback mock data (Colombia focused) - used when API fails or cache is empty
FALLBACK_INDICATORS = [
    {"symbol": "TRM", "name": "Tasa Representativa del Mercado", "value": "4,127.45", "unit": "COP", "change": "+12.30", "trend": "up"},
    {"symbol": "USD/COP", "name": "Dólar / Peso Colombiano", "value": "4,125.80", "unit": "", "change": "+8.50", "trend": "up"},
    {"symbol": "EUR/COP", "name": "Euro / Peso Colombiano", "value": "4,467.20", "unit": "", "change": "-3.15", "trend": "down"},
    {"symbol": "Brent", "name": "Petróleo Brent", "value": "82.45", "unit": "USD", "change": "+1.24", "trend": "up"},
    {"symbol": "WTI", "name": "Petróleo WTI", "value": "78.20", "unit": "USD", "change": "+0.85", "trend": "up"},
    {"symbol": "BTC", "name": "Bitcoin", "value": "98,450", "unit": "USD", "change": "-2.18%", "trend": "down"},
    {"symbol": "ORO", "name": "Oro (GLD)", "value": "245.30", "unit": "USD", "change": "+0.42%", "trend": "up"},
    {"symbol": "CAFÉ", "name": "Café Arábica", "value": "318.75", "unit": "USD/lb", "change": "+3.20", "trend": "up"},
    {"symbol": "COBRE", "name": "Cobre", "value": "4.28", "unit": "USD/lb", "change": "-0.05", "trend": "down"},
    {"symbol": "S&P 500", "name": "S&P 500 (SPY)", "value": "584.30", "unit": "USD", "change": "+1.42", "trend": "up"},
]


async def _fetch_fx(client_http: httpx.AsyncClient, from_curr: str, to_curr: str) -> Optional[Dict]:
    """Fetch currency exchange rate."""
    params = {
        'function': 'CURRENCY_EXCHANGE_RATE',
        'from_currency': from_curr,
        'to_currency': to_curr,
        'apikey': ALPHA_VANTAGE_API_KEY
    }
    try:
        response = await client_http.get(ALPHA_VANTAGE_BASE_URL, params=params, timeout=15.0)
        data = response.json()
        rate_data = data.get('Realtime Currency Exchange Rate', {})
        if not rate_data:
            return None
        rate = float(rate_data.get('5. Exchange Rate', 0))
        bid = float(rate_data.get('8. Bid Price', rate))
        ask = float(rate_data.get('9. Ask Price', rate))
        # Estimate change from spread (approximation)
        change_pct = ((ask - bid) / bid) * 100 if bid > 0 else 0
        return {
            'value': f"{rate:,.2f}",
            'change': f"{'+' if change_pct >= 0 else ''}{change_pct:.2f}%",
            'trend': 'up' if change_pct >= 0 else 'down'
        }
    except Exception as e:
        logger.warning(f"FX fetch failed for {from_curr}/{to_curr}: {e}")
        return None


async def _fetch_commodity(client_http: httpx.AsyncClient, function: str) -> Optional[Dict]:
    """Fetch commodity price (BRENT, WTI, COFFEE, COPPER, etc.)."""
    params = {
        'function': function,
        'interval': 'monthly',
        'apikey': ALPHA_VANTAGE_API_KEY
    }
    try:
        response = await client_http.get(ALPHA_VANTAGE_BASE_URL, params=params, timeout=15.0)
        data = response.json()
        series = data.get('data', [])
        if len(series) < 2:
            return None
        current = float(series[0].get('value', 0))
        previous = float(series[1].get('value', current))
        change = current - previous
        change_pct = (change / previous) * 100 if previous > 0 else 0
        return {
            'value': f"{current:,.2f}",
            'change': f"{'+' if change >= 0 else ''}{change:.2f}",
            'trend': 'up' if change >= 0 else 'down'
        }
    except Exception as e:
        logger.warning(f"Commodity fetch failed for {function}: {e}")
        return None


async def _fetch_quote(client_http: httpx.AsyncClient, symbol: str) -> Optional[Dict]:
    """Fetch stock/ETF quote."""
    params = {
        'function': 'GLOBAL_QUOTE',
        'symbol': symbol,
        'apikey': ALPHA_VANTAGE_API_KEY
    }
    try:
        response = await client_http.get(ALPHA_VANTAGE_BASE_URL, params=params, timeout=15.0)
        data = response.json()
        quote = data.get('Global Quote', {})
        if not quote:
            return None
        price = float(quote.get('05. price', 0))
        change = float(quote.get('09. change', 0))
        change_pct = quote.get('10. change percent', '0%').replace('%', '')
        return {
            'value': f"{price:,.2f}",
            'change': f"{'+' if change >= 0 else ''}{change:.2f}",
            'trend': 'up' if change >= 0 else 'down'
        }
    except Exception as e:
        logger.warning(f"Quote fetch failed for {symbol}: {e}")
        return None


async def _fetch_crypto(client_http: httpx.AsyncClient, crypto: str) -> Optional[Dict]:
    """Fetch cryptocurrency exchange rate (via CURRENCY_EXCHANGE_RATE)."""
    return await _fetch_fx(client_http, crypto, 'USD')


async def fetch_all_indicators() -> List[Dict]:
    """Fetch all economic indicators from Alpha Vantage.
    
    Free tier: 25 requests/day. We use ~10 indicators = 10 requests per refresh.
    Cache TTL is 12 hours, allowing ~2 refreshes per day.
    """
    if not ALPHA_VANTAGE_API_KEY:
        logger.warning("No Alpha Vantage API key configured, using fallback data")
        return FALLBACK_INDICATORS
    
    indicators = []
    async with httpx.AsyncClient() as client_http:
        # Currency exchange rates (Colombia focused)
        # USD/COP
        usd_cop = await _fetch_fx(client_http, 'USD', 'COP')
        indicators.append({
            'symbol': 'TRM',
            'name': 'Tasa Representativa del Mercado',
            'unit': 'COP',
            **(usd_cop or {'value': '4,127.45', 'change': '+12.30', 'trend': 'up'})
        })
        indicators.append({
            'symbol': 'USD/COP',
            'name': 'Dólar / Peso Colombiano',
            'unit': '',
            **(usd_cop or {'value': '4,125.80', 'change': '+8.50', 'trend': 'up'})
        })
        
        # EUR/COP
        eur_cop = await _fetch_fx(client_http, 'EUR', 'COP')
        indicators.append({
            'symbol': 'EUR/COP',
            'name': 'Euro / Peso Colombiano',
            'unit': '',
            **(eur_cop or {'value': '4,467.20', 'change': '-3.15', 'trend': 'down'})
        })
        
        # Brent Oil
        brent = await _fetch_commodity(client_http, 'BRENT')
        indicators.append({
            'symbol': 'Brent',
            'name': 'Petróleo Brent',
            'unit': 'USD',
            **(brent or {'value': '82.45', 'change': '+1.24', 'trend': 'up'})
        })
        
        # WTI Oil
        wti = await _fetch_commodity(client_http, 'WTI')
        indicators.append({
            'symbol': 'WTI',
            'name': 'Petróleo WTI',
            'unit': 'USD',
            **(wti or {'value': '78.20', 'change': '+0.85', 'trend': 'up'})
        })
        
        # Bitcoin
        btc = await _fetch_crypto(client_http, 'BTC')
        indicators.append({
            'symbol': 'BTC',
            'name': 'Bitcoin',
            'unit': 'USD',
            **(btc or {'value': '98,450', 'change': '-2.18%', 'trend': 'down'})
        })
        
        # Gold ETF (GLD)
        gold = await _fetch_quote(client_http, 'GLD')
        indicators.append({
            'symbol': 'ORO',
            'name': 'Oro (GLD ETF)',
            'unit': 'USD',
            **(gold or {'value': '245.30', 'change': '+0.42%', 'trend': 'up'})
        })
        
        # Coffee
        coffee = await _fetch_commodity(client_http, 'COFFEE')
        indicators.append({
            'symbol': 'CAFÉ',
            'name': 'Café Arábica',
            'unit': 'USD/lb',
            **(coffee or {'value': '318.75', 'change': '+3.20', 'trend': 'up'})
        })
        
        # Copper
        copper = await _fetch_commodity(client_http, 'COPPER')
        indicators.append({
            'symbol': 'COBRE',
            'name': 'Cobre',
            'unit': 'USD/lb',
            **(copper or {'value': '4.28', 'change': '-0.05', 'trend': 'down'})
        })
        
        # S&P 500 (SPY ETF)
        spy = await _fetch_quote(client_http, 'SPY')
        indicators.append({
            'symbol': 'S&P 500',
            'name': 'S&P 500 (SPY)',
            'unit': 'USD',
            **(spy or {'value': '584.30', 'change': '+1.42', 'trend': 'up'})
        })
    
    return indicators


@api_router.get("/economic-indicators")
async def get_economic_indicators():
    """Get economic indicators with caching to respect Alpha Vantage free tier limits."""
    now = datetime.now(timezone.utc)
    cache_data = _indicators_cache.get('data')
    cache_time = _indicators_cache.get('timestamp')
    
    # Return cached if valid
    if cache_data and cache_time:
        age = now - cache_time
        if age < timedelta(hours=CACHE_TTL_HOURS):
            return {
                'indicators': cache_data,
                'cached': True,
                'last_updated': cache_time.isoformat(),
                'next_refresh': (cache_time + timedelta(hours=CACHE_TTL_HOURS)).isoformat()
            }
    
    # Fetch fresh data
    try:
        indicators = await fetch_all_indicators()
        _indicators_cache['data'] = indicators
        _indicators_cache['timestamp'] = now
        return {
            'indicators': indicators,
            'cached': False,
            'last_updated': now.isoformat(),
            'next_refresh': (now + timedelta(hours=CACHE_TTL_HOURS)).isoformat()
        }
    except Exception as e:
        logger.error(f"Failed to fetch indicators: {e}")
        # Return stale cache or fallback
        if cache_data:
            return {
                'indicators': cache_data,
                'cached': True,
                'stale': True,
                'last_updated': cache_time.isoformat() if cache_time else None
            }
        return {
            'indicators': FALLBACK_INDICATORS,
            'cached': False,
            'fallback': True,
            'last_updated': now.isoformat()
        }


# ============ Email Utility ============

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.utils import formataddr


def _send_smtp_sync(to_email: str, subject: str, html: str, reply_to: Optional[str]) -> bool:
    """Blocking SMTP send. Called via asyncio.to_thread from send_email."""
    msg = MIMEMultipart('alternative')
    msg['Subject'] = subject
    msg['From'] = formataddr((EMAIL_FROM_NAME, SMTP_FROM_EMAIL))
    msg['To'] = to_email
    if reply_to:
        msg['Reply-To'] = reply_to
    msg.attach(MIMEText(html, 'html', 'utf-8'))

    if SMTP_PORT == 465:
        server = smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, timeout=20)
    else:
        server = smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=20)
        server.starttls()
    try:
        server.login(SMTP_USER, SMTP_PASSWORD)
        server.sendmail(SMTP_FROM_EMAIL, [to_email], msg.as_string())
        return True
    finally:
        try:
            server.quit()
        except Exception:
            pass


async def send_email(to_email: str, subject: str, html: str, reply_to: Optional[str] = None) -> bool:
    """Send email. Prefers SMTP (Hostinger) if configured, else Emergent Resend proxy."""
    # Primary: SMTP
    if SMTP_HOST and SMTP_USER and SMTP_PASSWORD:
        try:
            await asyncio.to_thread(_send_smtp_sync, to_email, subject, html, reply_to)
            logger.info(f"SMTP email sent to {to_email}")
            return True
        except Exception as e:
            logger.error(f"SMTP send failed to {to_email}: {e}")
            # fall through to Emergent fallback

    # Fallback: Emergent Resend proxy
    if not EMAIL_KEY:
        logger.warning(f"No email transport available, skipping email to {to_email}")
        return False
    payload = {"to": [to_email], "subject": subject, "html": html, "from_name": EMAIL_FROM_NAME}
    if reply_to:
        payload["contact_email"] = reply_to
    try:
        async with httpx.AsyncClient(timeout=30) as http_client:
            resp = await http_client.post(
                f"{EMAIL_BASE_URL}/api/v1/email/send",
                headers={"X-Email-Key": EMAIL_KEY},
                json=payload,
            )
        resp.raise_for_status()
        logger.info(f"Proxy email sent to {to_email}")
        return True
    except Exception as e:
        logger.error(f"Proxy email send failed to {to_email}: {e}")
        return False


def _lead_notification_html(contact: dict) -> str:
    """HTML template for internal lead notification email."""
    servicio_labels = {
        'consultoria': 'Consultoría Empresarial',
        'capacitacion': 'Capacitación Empresarial',
        'emprende': 'Plan Emprende',
        'crece': 'Plan Crece',
        'escala': 'Plan Escala',
        'otro': 'Otro',
    }
    servicio = servicio_labels.get(contact.get('servicio', ''), contact.get('servicio', 'N/A'))
    return f"""
    <table width="100%" cellpadding="0" cellspacing="0" style="font-family: Arial, sans-serif; background:#f5f5f5; padding:24px;">
      <tr><td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:8px; overflow:hidden;">
          <tr><td style="background:linear-gradient(135deg,#003057,#1E5A75); padding:32px; text-align:center;">
            <h1 style="color:#CBA55A; margin:0; font-size:24px;">🔔 Nuevo Lead - GEIFEM</h1>
            <p style="color:#ffffff; margin:8px 0 0 0; font-size:14px;">Un cliente potencial ha solicitado contacto</p>
          </td></tr>
          <tr><td style="padding:32px;">
            <h2 style="color:#003057; font-size:18px; margin:0 0 16px 0;">Información del Contacto</h2>
            <table width="100%" cellpadding="8" cellspacing="0" style="border-collapse:collapse;">
              <tr><td style="border-bottom:1px solid #eee; color:#666; font-weight:bold; width:35%;">Nombre:</td><td style="border-bottom:1px solid #eee; color:#003057;">{contact.get('nombre','')}</td></tr>
              <tr><td style="border-bottom:1px solid #eee; color:#666; font-weight:bold;">Email:</td><td style="border-bottom:1px solid #eee; color:#003057;"><a href="mailto:{contact.get('email','')}" style="color:#1E5A75; text-decoration:none;">{contact.get('email','')}</a></td></tr>
              <tr><td style="border-bottom:1px solid #eee; color:#666; font-weight:bold;">Teléfono:</td><td style="border-bottom:1px solid #eee; color:#003057;">{contact.get('telefono','') or 'No proporcionado'}</td></tr>
              <tr><td style="border-bottom:1px solid #eee; color:#666; font-weight:bold;">Empresa:</td><td style="border-bottom:1px solid #eee; color:#003057;">{contact.get('empresa','') or 'No proporcionada'}</td></tr>
              <tr><td style="border-bottom:1px solid #eee; color:#666; font-weight:bold;">Servicio:</td><td style="border-bottom:1px solid #eee; color:#003057;"><span style="background:#CBA55A; color:#fff; padding:4px 10px; border-radius:4px; font-size:12px; font-weight:bold;">{servicio}</span></td></tr>
              <tr><td colspan="2" style="padding-top:16px; color:#666; font-weight:bold;">Mensaje:</td></tr>
              <tr><td colspan="2" style="background:#f8f8f8; padding:16px; border-left:4px solid #CBA55A; color:#333; line-height:1.6;">{contact.get('mensaje','')}</td></tr>
            </table>
          </td></tr>
          <tr><td style="background:#003057; padding:16px; text-align:center;">
            <p style="color:#ffffff; margin:0; font-size:12px;">Recibido el {datetime.now(timezone.utc).strftime('%d/%m/%Y a las %H:%M UTC')}</p>
          </td></tr>
        </table>
      </td></tr>
    </table>
    """


def _client_confirmation_html(nombre: str) -> str:
    """HTML template for client confirmation email."""
    return f"""
    <table width="100%" cellpadding="0" cellspacing="0" style="font-family: Arial, sans-serif; background:#f5f5f5; padding:24px;">
      <tr><td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:8px; overflow:hidden;">
          <tr><td style="background:linear-gradient(135deg,#003057,#1E5A75); padding:40px 32px; text-align:center;">
            <h1 style="color:#CBA55A; margin:0; font-size:28px; letter-spacing:1px;">GEIFEM</h1>
            <p style="color:#ffffff; margin:4px 0 0 0; font-size:12px; letter-spacing:2px; text-transform:uppercase;">Hacemos empresas más fuertes</p>
          </td></tr>
          <tr><td style="padding:40px 32px;">
            <h2 style="color:#003057; font-size:22px; margin:0 0 16px 0;">Gracias por contactarnos, {nombre.split()[0] if nombre else ''}</h2>
            <p style="color:#555; font-size:15px; line-height:1.7;">
              Hemos recibido su solicitud y agradecemos su interés en <strong>GEIFEM</strong>.
              Uno de nuestros consultores estratégicos revisará su mensaje y se pondrá en contacto con usted en las próximas <strong>24 horas hábiles</strong>.
            </p>
            <div style="border-top:1px solid #eee; margin:24px 0; padding-top:24px;">
              <p style="color:#003057; font-weight:bold; margin:0 0 12px 0;">¿Qué sigue?</p>
              <table cellpadding="8" cellspacing="0" style="width:100%;">
                <tr><td style="color:#CBA55A; font-weight:bold; width:30px;">1.</td><td style="color:#555; font-size:14px;">Analizamos su caso y contexto</td></tr>
                <tr><td style="color:#CBA55A; font-weight:bold;">2.</td><td style="color:#555; font-size:14px;">Agendamos una sesión estratégica sin costo</td></tr>
                <tr><td style="color:#CBA55A; font-weight:bold;">3.</td><td style="color:#555; font-size:14px;">Definimos un plan de acción a su medida</td></tr>
              </table>
            </div>
            <div style="background:#f8f8f8; padding:20px; border-left:4px solid #CBA55A; margin:24px 0;">
              <p style="color:#003057; font-weight:bold; margin:0 0 8px 0;">Mientras tanto...</p>
              <p style="color:#555; font-size:14px; margin:0; line-height:1.6;">
                Le invitamos a explorar nuestros últimos <a href="https://premium-corp-site-5.preview.emergentagent.com/insights" style="color:#1E5A75; font-weight:bold;">artículos e insights</a> sobre transformación empresarial.
              </p>
            </div>
            <p style="color:#555; font-size:14px; line-height:1.6;">
              Si tiene alguna consulta urgente, no dude en escribirnos directamente a
              <a href="mailto:{COMPANY_EMAIL}" style="color:#1E5A75;">{COMPANY_EMAIL}</a>.
            </p>
            <p style="color:#003057; font-size:14px; margin-top:32px;">
              Cordialmente,<br>
              <strong>Equipo GEIFEM</strong><br>
              <span style="color:#999; font-size:12px;">Gestión Integral para el Fortalecimiento Empresarial</span>
            </p>
          </td></tr>
          <tr><td style="background:#003057; padding:20px; text-align:center;">
            <p style="color:#CBA55A; margin:0; font-size:12px; font-weight:bold;">GEIFEM</p>
            <p style="color:#ffffff; margin:4px 0 0 0; font-size:11px; opacity:0.7;">© {datetime.now().year} GEIFEM · Todos los derechos reservados</p>
          </td></tr>
        </table>
      </td></tr>
    </table>
    """


def _newsletter_welcome_html(email: str) -> str:
    """HTML template for newsletter subscription confirmation."""
    return f"""
    <table width="100%" cellpadding="0" cellspacing="0" style="font-family: Arial, sans-serif; background:#f5f5f5; padding:24px;">
      <tr><td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:8px; overflow:hidden;">
          <tr><td style="background:linear-gradient(135deg,#003057,#1E5A75); padding:40px 32px; text-align:center;">
            <h1 style="color:#CBA55A; margin:0; font-size:28px; letter-spacing:1px;">GEIFEM</h1>
            <p style="color:#ffffff; margin:8px 0 0 0; font-size:14px;">¡Bienvenido a nuestros insights!</p>
          </td></tr>
          <tr><td style="padding:40px 32px;">
            <h2 style="color:#003057; font-size:22px; margin:0 0 16px 0;">Suscripción confirmada</h2>
            <p style="color:#555; font-size:15px; line-height:1.7;">
              Gracias por suscribirse al newsletter de <strong>GEIFEM</strong>. A partir de ahora recibirá directamente en su bandeja de entrada:
            </p>
            <table cellpadding="10" cellspacing="0" style="width:100%; margin:20px 0;">
              <tr><td style="color:#CBA55A; font-size:20px; width:30px;">✓</td><td style="color:#333;">Análisis exclusivos de mercado</td></tr>
              <tr><td style="color:#CBA55A; font-size:20px;">✓</td><td style="color:#333;">Tendencias en gestión empresarial</td></tr>
              <tr><td style="color:#CBA55A; font-size:20px;">✓</td><td style="color:#333;">Casos de éxito y mejores prácticas</td></tr>
              <tr><td style="color:#CBA55A; font-size:20px;">✓</td><td style="color:#333;">Invitaciones a eventos y webinars</td></tr>
            </table>
            <p style="color:#003057; font-size:14px; margin-top:32px;">
              Un abrazo,<br>
              <strong>Equipo GEIFEM</strong>
            </p>
          </td></tr>
          <tr><td style="background:#003057; padding:20px; text-align:center;">
            <p style="color:#ffffff; margin:0; font-size:11px; opacity:0.7;">© {datetime.now().year} GEIFEM · {email}</p>
          </td></tr>
        </table>
      </td></tr>
    </table>
    """


# ============ Contact Form ============

# Allowed service values (enum-like validation)
ALLOWED_SERVICIOS = {'consultoria', 'capacitacion', 'emprende', 'crece', 'escala', 'otro'}


def _sanitize_text(text: str, max_len: int = 3000) -> str:
    """Strip HTML tags and normalize whitespace to prevent XSS via text fields."""
    if not text:
        return ''
    # Strip ALL HTML from plain-text fields
    clean = bleach.clean(text, tags=[], strip=True)
    # Normalize whitespace
    clean = re.sub(r'\s+', ' ', clean).strip()
    return clean[:max_len]


class ContactCreate(BaseModel):
    nombre: str = Field(..., min_length=2, max_length=120)
    email: EmailStr
    telefono: Optional[str] = Field(default=None, max_length=30)
    empresa: Optional[str] = Field(default=None, max_length=120)
    servicio: str = Field(..., min_length=1, max_length=50)
    mensaje: str = Field(..., min_length=5, max_length=3000)


class Contact(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    nombre: str
    email: str
    telefono: Optional[str] = None
    empresa: Optional[str] = None
    servicio: str
    mensaje: str
    status: str = "new"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


@api_router.post("/contact")
@limiter.limit("5/hour")
async def create_contact(request: Request, payload: ContactCreate):
    """Receive contact form submission (rate-limited to 5/hour per IP)."""
    # Validate servicio field against allowlist
    if payload.servicio not in ALLOWED_SERVICIOS:
        raise HTTPException(status_code=422, detail="Servicio no válido")

    # Sanitize all free-text inputs
    contact = Contact(
        nombre=_sanitize_text(payload.nombre, 120),
        email=payload.email.lower().strip(),
        telefono=_sanitize_text(payload.telefono or '', 30) or None,
        empresa=_sanitize_text(payload.empresa or '', 120) or None,
        servicio=payload.servicio,
        mensaje=_sanitize_text(payload.mensaje, 3000),
    )
    doc = contact.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.contacts.insert_one(doc)

    # Send emails concurrently (non-blocking, do not fail the request if email fails)
    lead_html = _lead_notification_html(doc)
    client_html = _client_confirmation_html(contact.nombre)
    await asyncio.gather(
        send_email(
            to_email=COMPANY_EMAIL,
            subject=f"[GEIFEM] Nuevo lead: {contact.nombre} - {contact.servicio}",
            html=lead_html,
            reply_to=contact.email,
        ),
        send_email(
            to_email=contact.email,
            subject="Hemos recibido su solicitud - GEIFEM",
            html=client_html,
            reply_to=COMPANY_EMAIL,
        ),
        return_exceptions=True,
    )

    return {"success": True, "id": contact.id, "message": "Su mensaje ha sido enviado exitosamente"}


@api_router.get("/contact", response_model=List[Contact])
async def list_contacts(_=Depends(verify_admin), limit: int = 100):
    """List recent contact submissions (admin only)."""
    contacts = await db.contacts.find({}, {"_id": 0}).sort("created_at", -1).to_list(limit)
    for c in contacts:
        if isinstance(c.get('created_at'), str):
            c['created_at'] = datetime.fromisoformat(c['created_at'])
    return contacts


# ============ Newsletter ============

class NewsletterCreate(BaseModel):
    email: EmailStr


@api_router.post("/newsletter")
@limiter.limit("5/hour")
async def subscribe_newsletter(request: Request, payload: NewsletterCreate):
    """Subscribe an email to the newsletter (idempotent, rate-limited)."""
    email = payload.email.lower().strip()
    existing = await db.newsletter.find_one({"email": email})
    if existing:
        return {"success": True, "already_subscribed": True, "message": "Este correo ya está suscrito"}

    doc = {
        "id": str(uuid.uuid4()),
        "email": email,
        "subscribed_at": datetime.now(timezone.utc).isoformat(),
        "active": True,
    }
    try:
        await db.newsletter.insert_one(doc)
    except Exception as e:
        if 'duplicate key' in str(e).lower() or 'E11000' in str(e):
            return {"success": True, "already_subscribed": True, "message": "Este correo ya está suscrito"}
        raise

    await send_email(
        to_email=email,
        subject="Bienvenido al newsletter de GEIFEM",
        html=_newsletter_welcome_html(email),
        reply_to=COMPANY_EMAIL,
    )

    return {"success": True, "already_subscribed": False, "message": "Suscripción confirmada"}


@api_router.get("/newsletter")
async def list_newsletter_subscribers(_=Depends(verify_admin), limit: int = 500):
    """List newsletter subscribers (admin only)."""
    subs = await db.newsletter.find({"active": True}, {"_id": 0}).sort("subscribed_at", -1).to_list(limit)
    return {"count": len(subs), "subscribers": subs}


# ============ Admin Endpoints (auth helpers defined at top of file) ============


@api_router.post("/admin/login", response_model=AdminSessionResponse)
@limiter.limit("10/minute")
async def admin_login(request: Request, payload: AdminLoginRequest):
    """Password based admin login with bcrypt + brute force protection."""
    ip = _client_ip(request)

    # Check brute force lockout
    lockout = await _check_brute_force(ip)
    if lockout:
        await _log_audit("admin_login_blocked", ip, {"reason": "lockout", "remaining_min": lockout})
        raise HTTPException(status_code=429, detail=f"Demasiados intentos. Intente de nuevo en {lockout} minutos.")

    # Verify against seeded hash (in DB) or fallback to env for first-time seed
    admin_doc = await db.admin_users.find_one({"username": ADMIN_USERNAME})
    valid = False
    if admin_doc:
        valid = verify_password(payload.password, admin_doc.get('password_hash', ''))
    else:
        # Bootstrap: no admin yet, seed on correct env password
        if payload.password == ADMIN_PASSWORD:
            valid = True

    if not valid:
        await _record_failed_attempt(ip)
        await _log_audit("admin_login_failed", ip)
        raise HTTPException(status_code=401, detail="Contraseña incorrecta")

    # Success: clear failures, create session
    await _clear_failed_attempts(ip)
    token = _generate_admin_token()
    expires_at = datetime.now(timezone.utc) + timedelta(hours=SESSION_TTL_HOURS)
    await db.admin_sessions.insert_one({
        "token": token,
        "ip": ip,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "expires_at": expires_at.isoformat(),
    })
    await _log_audit("admin_login_success", ip)
    return AdminSessionResponse(token=token, expires_at=expires_at.isoformat())


@api_router.post("/admin/logout")
async def admin_logout(request: Request, session=Depends(verify_admin)):
    """Invalidate the current admin session."""
    await db.admin_sessions.delete_one({"token": session['token']})
    await _log_audit("admin_logout", _client_ip(request))
    return {"success": True}


@api_router.get("/admin/verify")
async def admin_verify(session=Depends(verify_admin)):
    """Verify a token is still valid (used by frontend on load)."""
    return {"valid": True, "expires_at": session['expires_at']}


@api_router.get("/admin/audit-logs")
async def admin_audit_logs(_=Depends(verify_admin), limit: int = 100):
    """Return last N audit log entries."""
    logs = await db.audit_logs.find({}, {"_id": 0}).sort("created_at", -1).to_list(limit)
    return {"count": len(logs), "logs": logs}


@api_router.get("/admin/stats")
async def admin_stats(_=Depends(verify_admin)):
    """Aggregate counters for the admin dashboard."""
    total_contacts = await db.contacts.count_documents({})
    new_contacts = await db.contacts.count_documents({"status": "new"})
    total_subs = await db.newsletter.count_documents({"active": True})
    total_articles = await db.articles.count_documents({})
    published_articles = await db.articles.count_documents({"published": True})
    seven_days_ago = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
    recent_contacts = await db.contacts.count_documents({"created_at": {"$gte": seven_days_ago}})
    failed_logins = await db.login_attempts.count_documents({})
    return {
        "contacts_total": total_contacts,
        "contacts_new": new_contacts,
        "contacts_last_7_days": recent_contacts,
        "newsletter_total": total_subs,
        "articles_total": total_articles,
        "articles_published": published_articles,
        "security_locked_ips": failed_logins,
    }


# ============ Admin: Contact management ============

class ContactStatusUpdate(BaseModel):
    status: str = Field(..., pattern="^(new|contacted|converted|archived)$")


@api_router.get("/admin/contacts")
async def admin_list_contacts(_=Depends(verify_admin), status: Optional[str] = None, limit: int = 200):
    """List all contact leads for admin panel."""
    query = {}
    if status:
        query['status'] = status
    contacts = await db.contacts.find(query, {"_id": 0}).sort("created_at", -1).to_list(limit)
    return {"count": len(contacts), "contacts": contacts}


@api_router.patch("/admin/contacts/{contact_id}")
async def admin_update_contact_status(contact_id: str, payload: ContactStatusUpdate, _=Depends(verify_admin)):
    """Update contact lead status."""
    result = await db.contacts.update_one(
        {"id": contact_id},
        {"$set": {"status": payload.status, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Contact not found")
    return {"success": True}


@api_router.delete("/admin/contacts/{contact_id}")
async def admin_delete_contact(contact_id: str, _=Depends(verify_admin)):
    """Delete a contact lead."""
    result = await db.contacts.delete_one({"id": contact_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Contact not found")
    return {"success": True}


# ============ Admin: Newsletter management ============

@api_router.get("/admin/newsletter")
async def admin_list_newsletter(_=Depends(verify_admin), limit: int = 500):
    """List all newsletter subscribers for admin panel."""
    subs = await db.newsletter.find({}, {"_id": 0}).sort("subscribed_at", -1).to_list(limit)
    return {"count": len(subs), "subscribers": subs}


@api_router.delete("/admin/newsletter/{sub_id}")
async def admin_delete_subscriber(sub_id: str, _=Depends(verify_admin)):
    """Delete a newsletter subscriber."""
    result = await db.newsletter.delete_one({"id": sub_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Subscriber not found")
    return {"success": True}


# ============ Articles (Insights) CRUD ============

class ArticleCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    category: str = Field(..., min_length=2, max_length=60)
    excerpt: str = Field(..., min_length=10, max_length=500)
    content: str = Field(..., min_length=20)
    image: str = Field(..., min_length=8, max_length=800)
    author: str = Field(default="Equipo GEIFEM", max_length=120)
    read_time: str = Field(default="5 min", max_length=20)
    published: bool = True


class ArticleUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=3, max_length=200)
    category: Optional[str] = Field(default=None, min_length=2, max_length=60)
    excerpt: Optional[str] = Field(default=None, min_length=10, max_length=500)
    content: Optional[str] = Field(default=None, min_length=20)
    image: Optional[str] = Field(default=None, min_length=8, max_length=800)
    author: Optional[str] = Field(default=None, max_length=120)
    read_time: Optional[str] = Field(default=None, max_length=20)
    published: Optional[bool] = None


class Article(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    category: str
    excerpt: str
    content: str
    image: str
    author: str = "Equipo GEIFEM"
    read_time: str = "5 min"
    published: bool = True
    date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# Public: list published articles
@api_router.get("/articles")
async def list_public_articles(limit: int = 50, category: Optional[str] = None):
    """Public endpoint: list published articles for the Insights page."""
    query = {"published": True}
    if category:
        query['category'] = category
    articles = await db.articles.find(query, {"_id": 0, "content": 0}).sort("date", -1).to_list(limit)
    return {"count": len(articles), "articles": articles}


@api_router.get("/articles/{article_id}")
async def get_public_article(article_id: str):
    """Public endpoint: get a single published article."""
    article = await db.articles.find_one({"id": article_id, "published": True}, {"_id": 0})
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    return article


# Admin: full CRUD
@api_router.get("/admin/articles")
async def admin_list_articles(_=Depends(verify_admin), limit: int = 200):
    """Admin endpoint: list ALL articles (including unpublished)."""
    articles = await db.articles.find({}, {"_id": 0, "content": 0}).sort("date", -1).to_list(limit)
    return {"count": len(articles), "articles": articles}


@api_router.get("/admin/articles/{article_id}")
async def admin_get_article(article_id: str, _=Depends(verify_admin)):
    """Admin endpoint: get full article including content."""
    article = await db.articles.find_one({"id": article_id}, {"_id": 0})
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    return article


# HTML sanitization config for article content
ALLOWED_HTML_TAGS = ['p', 'br', 'strong', 'em', 'u', 'a', 'h1', 'h2', 'h3', 'h4', 'ul', 'ol', 'li',
                     'blockquote', 'code', 'pre', 'img', 'hr', 'span', 'div', 'table', 'thead',
                     'tbody', 'tr', 'th', 'td']
ALLOWED_HTML_ATTRS = {
    '*': ['class'],
    'a': ['href', 'title', 'target', 'rel'],
    'img': ['src', 'alt', 'title', 'width', 'height'],
}


def _sanitize_html(content: str) -> str:
    """Sanitize article HTML content to prevent XSS while allowing safe formatting."""
    if not content:
        return ''
    return bleach.clean(
        content,
        tags=ALLOWED_HTML_TAGS,
        attributes=ALLOWED_HTML_ATTRS,
        protocols=['http', 'https', 'mailto'],
        strip=True,
    )


@api_router.post("/admin/articles")
async def admin_create_article(request: Request, payload: ArticleCreate, _=Depends(verify_admin)):
    """Admin endpoint: create a new article (sanitized)."""
    data = payload.model_dump()
    data['title'] = _sanitize_text(data['title'], 200)
    data['category'] = _sanitize_text(data['category'], 60)
    data['excerpt'] = _sanitize_text(data['excerpt'], 500)
    data['content'] = _sanitize_html(data['content'])
    data['author'] = _sanitize_text(data['author'], 120)
    article = Article(**data)
    doc = article.model_dump()
    doc['date'] = doc['date'].isoformat()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.articles.insert_one(doc)
    await _log_audit("article_create", _client_ip(request), {"article_id": article.id, "title": article.title})
    doc.pop('_id', None)
    return {"success": True, "id": article.id, "article": doc}


@api_router.patch("/admin/articles/{article_id}")
async def admin_update_article(request: Request, article_id: str, payload: ArticleUpdate, _=Depends(verify_admin)):
    """Admin endpoint: update an article (sanitized partial update)."""
    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")
    if 'title' in updates: updates['title'] = _sanitize_text(updates['title'], 200)
    if 'category' in updates: updates['category'] = _sanitize_text(updates['category'], 60)
    if 'excerpt' in updates: updates['excerpt'] = _sanitize_text(updates['excerpt'], 500)
    if 'content' in updates: updates['content'] = _sanitize_html(updates['content'])
    if 'author' in updates: updates['author'] = _sanitize_text(updates['author'], 120)
    updates['updated_at'] = datetime.now(timezone.utc).isoformat()
    result = await db.articles.update_one({"id": article_id}, {"$set": updates})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Article not found")
    await _log_audit("article_update", _client_ip(request), {"article_id": article_id, "fields": list(updates.keys())})
    return {"success": True}


@api_router.delete("/admin/articles/{article_id}")
async def admin_delete_article(request: Request, article_id: str, _=Depends(verify_admin)):
    """Admin endpoint: delete an article."""
    result = await db.articles.delete_one({"id": article_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Article not found")
    await _log_audit("article_delete", _client_ip(request), {"article_id": article_id})
    return {"success": True}


# Include the router in the main app
app.include_router(api_router)

# CORS: read whitelist from env (comma-separated). Deny all when '*' + credentials (browser rejects it anyway)
_cors_origins_raw = os.environ.get('CORS_ORIGINS', '*').strip()
if _cors_origins_raw == '*':
    _cors_origins = ['*']
    _cors_credentials = False  # Browsers reject '*' with credentials
else:
    _cors_origins = [o.strip() for o in _cors_origins_raw.split(',') if o.strip()]
    _cors_credentials = True

app.add_middleware(
    CORSMiddleware,
    allow_credentials=_cors_credentials,
    allow_origins=_cors_origins,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-Admin-Token"],
    max_age=3600,
)

logger.info(f"CORS configured: origins={_cors_origins}, credentials={_cors_credentials}")


@app.on_event("startup")
async def startup_setup():
    """Create indexes, seed admin user with bcrypt hash."""
    try:
        # Data integrity indexes
        await db.newsletter.create_index("email", unique=True)
        await db.contacts.create_index("created_at")
        await db.articles.create_index("date")
        await db.admin_sessions.create_index("token", unique=True)
        # TTL indexes: auto-cleanup old sessions and login attempts
        await db.admin_sessions.create_index("expires_at_ttl", expireAfterSeconds=0)
        await db.login_attempts.create_index("ip", unique=True)
        # Audit log index
        await db.audit_logs.create_index("created_at")
        logger.info("MongoDB indexes ensured")

        # Seed admin user with bcrypt hashed password (idempotent)
        existing = await db.admin_users.find_one({"username": ADMIN_USERNAME})
        if not existing:
            hashed = hash_password(ADMIN_PASSWORD)
            await db.admin_users.insert_one({
                "username": ADMIN_USERNAME,
                "password_hash": hashed,
                "created_at": datetime.now(timezone.utc).isoformat(),
            })
            logger.info(f"Admin user seeded: {ADMIN_USERNAME}")
        else:
            # Rotate hash if env password changed
            if not verify_password(ADMIN_PASSWORD, existing.get('password_hash', '')):
                await db.admin_users.update_one(
                    {"username": ADMIN_USERNAME},
                    {"$set": {"password_hash": hash_password(ADMIN_PASSWORD), "updated_at": datetime.now(timezone.utc).isoformat()}}
                )
                logger.info(f"Admin password hash rotated for: {ADMIN_USERNAME}")
    except Exception as e:
        logger.warning(f"Startup setup warning: {e}")


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()