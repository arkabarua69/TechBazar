const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Please Enter Your Name"],
    },
    email: {
        type: String,
        required: [true, "Please Enter Your Email"],
        unique: true,
    },
    gender: {
        type: String,
        required: [true, "Please Enter Gender"]
    },
    phone: {
        type: String,
        default: "",
    },
    password: {
        type: String,
        required: [true, "Please Enter Your Password"],
        minLength: [8, "Password should have atleast 8 chars"],
        select: false,
    },
    avatar: {
        public_id: {
            type: String,
        },
        url: {
            type: String,
        }
    },
    role: {
        type: String,
        default: "user",
        enum: ["user", "admin"],
    },
    // Cash on Delivery permission — the admin grants it per user from
    // Admin → Users (COD toggle). Without it a COD order is rejected at
    // checkout (bKash/Nagad advance orders are unaffected). Admins can
    // always use COD regardless of this flag.
    codAllowed: {
        type: Boolean,
        default: false,
    },
    // Social login (OAuth) linkage. "local" = email/password account.
    provider: {
        type: String,
        default: "local",
    },
    providerId: {
        type: String,
        default: "",
    },
    // Delivery addresses bookmarked by the buyer (Manage Addresses).
    // The checkout screen can pick one of these instead of retyping.
    addresses: [
        {
            fullName: { type: String, default: "" },
            phoneNo: { type: String, default: "" },
            address: { type: String, default: "" },
            city: { type: String, default: "" },
            state: { type: String, default: "" },
            pincode: { type: String, default: "" },
            country: { type: String, default: "Bangladesh" },
            // Address type chip shown in the UI (Home / Office / Other).
            label: { type: String, default: "Home" },
            isDefault: { type: Boolean, default: false },
            createdAt: { type: Date, default: Date.now },
        },
    ],
    createdAt: {
        type: Date,
        default: Date.now,
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
});

// Never expose the password hash (or reset tokens) in API responses.
userSchema.set("toJSON", {
    transform: (doc, ret) => {
        delete ret.password;
        delete ret.resetPasswordToken;
        delete ret.resetPasswordExpire;
        delete ret.__v;
        return ret;
    },
});

userSchema.pre("save", async function (next) {

    if (!this.isModified("password")) {
        return next();
    }

    this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.getJWTToken = function () {
    return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE
    });
}

userSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
}

userSchema.methods.getResetPasswordToken = async function () {

    // generate token
    const resetToken = crypto.randomBytes(20).toString("hex");

    // generate hash token and add to db
    this.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    this.resetPasswordExpire = Date.now() + 15 * 60 * 1000;

    return resetToken;
}

module.exports = mongoose.model('User', userSchema);
