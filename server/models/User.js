import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        passwordHash: { type: String, required: true, select: false },
    },
    { timestamps: true },
);

userSchema.methods.setPassword = async function setPassword(plain) {
    const salt = await bcrypt.genSalt(10);
    this.passwordHash = await bcrypt.hash(plain, salt);
};

userSchema.methods.verifyPassword = function verifyPassword(plain) {
    return bcrypt.compare(plain, this.passwordHash);
};

// Strip sensitive fields from any serialized output.
userSchema.methods.toSafeJSON = function toSafeJSON() {
    return {
        id: this._id,
        name: this.name,
        email: this.email,
        createdAt: this.createdAt,
    };
};

const User = mongoose.model("User", userSchema);
export default User;
