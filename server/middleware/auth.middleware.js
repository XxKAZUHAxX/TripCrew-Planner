import jwt from "jsonwebtoken";

// This module is the SINGLE place that understands JWT. To migrate to
// Firebase Auth later, rewrite only this file to verify a Firebase ID token
// and populate req.user — no downstream code needs to change.

export function issueToken(user) {
    const payload = { sub: user._id.toString(), email: user.email };
    return jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    });
}

export function requireAuth(req, res, next) {
    try {
        const header = req.headers.authorization || "";
        const [scheme, token] = header.split(" ");
        if (scheme !== "Bearer" || !token) {
            return res
                .status(401)
                .json({ message: "Missing or malformed Authorization header" });
        }
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        req.user = { id: payload.sub, email: payload.email };
        next();
    } catch {
        return res.status(401).json({ message: "Invalid or expired token" });
    }
}
