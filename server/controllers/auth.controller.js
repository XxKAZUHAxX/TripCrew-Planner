import User from "../models/User.js";
import { issueToken } from "../middleware/auth.middleware.js";

export async function register(req, res, next) {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res
                .status(400)
                .json({ message: "name, email and password are required" });
        }
        const existing = await User.findOne({ email: email.toLowerCase() });
        if (existing) {
            return res
                .status(409)
                .json({ message: "Email already registered" });
        }
        const user = new User({ name, email });
        await user.setPassword(password);
        await user.save();
        const token = issueToken(user);
        res.status(201).json({ token, user: user.toSafeJSON() });
    } catch (err) {
        next(err);
    }
}

export async function login(req, res, next) {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res
                .status(400)
                .json({ message: "email and password are required" });
        }
        const user = await User.findOne({ email: email.toLowerCase() }).select(
            "+passwordHash",
        );
        if (!user) {
            return res.status(401).json({ message: "Invalid credentials" });
        }
        const ok = await user.verifyPassword(password);
        if (!ok) {
            return res.status(401).json({ message: "Invalid credentials" });
        }
        const token = issueToken(user);
        res.json({ token, user: user.toSafeJSON() });
    } catch (err) {
        next(err);
    }
}

export async function me(req, res, next) {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.json({ user: user.toSafeJSON() });
    } catch (err) {
        next(err);
    }
}
