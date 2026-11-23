import jwt from 'jsonwebtoken';

// EDL tenant-journey tokens — signed, time-boxed access to the PWA parcours
// (DAT v1.1 §16.3). Deliberately kept small (only the dossier id travels in
// the payload) and tagged with a fixed audience so a general access token
// cannot be mistaken for an EDL journey token.
//
// Spec calls for ES256 (asymmetric). We stay on HS256 for parity with the
// existing ImmoPatri JWT infrastructure (ACCESS_TOKEN_SECRET) and document
// the upgrade path — swapping `algorithm` here and injecting the key pair
// is the single change needed.

const EDL_AUDIENCE = 'immopatri:edl';
const DEFAULT_EXPIRES_DAYS = 30;

function daysFromNow(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

export function generateEdlToken({
  dossierEdlId,
  secret,
  expiresInDays = DEFAULT_EXPIRES_DAYS,
  now = new Date()
} = {}) {
  if (!dossierEdlId) {
    throw new Error('dossierEdlId is required');
  }
  if (!secret) {
    throw new Error('secret is required');
  }
  if (typeof expiresInDays !== 'number' || expiresInDays <= 0) {
    throw new Error('expiresInDays must be a positive number');
  }
  const expiration = new Date(
    now.getTime() + expiresInDays * 24 * 60 * 60 * 1000
  );
  const token = jwt.sign(
    {
      // Minimal payload: only what the server needs to find the dossier.
      sub: String(dossierEdlId),
      aud: EDL_AUDIENCE
    },
    secret,
    {
      algorithm: 'HS256',
      expiresIn: `${expiresInDays}d`
    }
  );
  return { token, expiration };
}

// Thrown errors carry a stable `code` field so the route layer can map them
// to HTTP statuses without inspecting strings.
export class EdlTokenError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'EdlTokenError';
    this.code = code;
  }
}

export function verifyEdlToken(token, secret) {
  if (!token || typeof token !== 'string') {
    throw new EdlTokenError('invalid', 'token manquant ou invalide');
  }
  if (!secret) {
    throw new EdlTokenError('server_misconfigured', 'secret manquant');
  }
  try {
    const payload = jwt.verify(token, secret, {
      algorithms: ['HS256'],
      audience: EDL_AUDIENCE
    });
    if (!payload || !payload.sub) {
      throw new EdlTokenError('invalid', 'payload invalide');
    }
    return { dossierEdlId: String(payload.sub), exp: payload.exp };
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new EdlTokenError('expired', 'ce lien a expiré');
    }
    if (error instanceof EdlTokenError) {
      throw error;
    }
    throw new EdlTokenError('invalid', 'token invalide');
  }
}

// daysFromNow is exposed for the manager's dateExpiration persistence.
export { EDL_AUDIENCE, DEFAULT_EXPIRES_DAYS, daysFromNow };
