import { Schema, model, type Model, type HydratedDocument, type Types } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser {
    name: string;
    email: string;
    passwordHash: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface SafeUser {
    id: Types.ObjectId;
    name: string;
    email: string;
    createdAt: Date;
}

export interface IUserMethods {
    setPassword(plain: string): Promise<void>;
    verifyPassword(plain: string): Promise<boolean>;
    toSafeJSON(): SafeUser;
}

type UserModel = Model<IUser, Record<string, never>, IUserMethods>;

const userSchema = new Schema<IUser, UserModel, IUserMethods>(
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
    { timestamps: true }
);

userSchema.methods.setPassword = async function setPassword(plain: string): Promise<void> {
    const salt = await bcrypt.genSalt(10);
    this.passwordHash = await bcrypt.hash(plain, salt);
};

userSchema.methods.verifyPassword = function verifyPassword(plain: string): Promise<boolean> {
    return bcrypt.compare(plain, this.passwordHash);
};

// Strip sensitive fields from any serialized output.
userSchema.methods.toSafeJSON = function toSafeJSON(): SafeUser {
    return {
        id: this._id,
        name: this.name,
        email: this.email,
        createdAt: this.createdAt,
    };
};

export type UserDocument = HydratedDocument<IUser, IUserMethods>;

const User = model<IUser, UserModel>('User', userSchema);
export default User;
