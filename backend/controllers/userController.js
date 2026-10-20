const User = require('../models/userModel');
const asyncErrorHandler = require('../middlewares/asyncErrorHandler');
const sendToken = require('../utils/sendToken');
const ErrorHandler = require('../utils/errorHandler');
const sendEmail = require('../utils/sendEmail');
const crypto = require('crypto');
const { uploadToImgBBCompat } = require('../utils/imgbb');
const { notifyAuthEvent, logEvent } = require('../utils/discordNotify');

// Register User
exports.registerUser = asyncErrorHandler(async (req, res, next) => {
    const { name, email, gender, password } = req.body;

    if (!name || !email || !gender || !password) {
        return next(new ErrorHandler("Please provide all required fields", 400));
    }

    // Default avatar
    let avatarData = {
        public_id: "avatars/default_avatar",
        url: "/avatar-placeholder.svg",
    };

    if (req.body.avatar && req.body.avatar.trim() !== "") {
        try {
            const result = await uploadToImgBBCompat(req.body.avatar, `avatar-${name}-${Date.now()}`);
            avatarData = result;
        } catch (imgbbErr) {
            console.warn("ImgBB avatar upload failed, using default:", imgbbErr.message);
        }
    }

    const user = await User.create({ name, email, gender, password, avatar: avatarData });
    notifyAuthEvent('register', user.toObject ? user.toObject() : user).catch(() => {});
    sendToken(user, 201, res);
});

// Login User
exports.loginUser = asyncErrorHandler(async (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return next(new ErrorHandler("Please enter email and password", 400));
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
        return next(new ErrorHandler("Invalid email or password", 401));
    }

    const isPasswordMatched = await user.comparePassword(password);
    if (!isPasswordMatched) {
        return next(new ErrorHandler("Invalid email or password", 401));
    }

    notifyAuthEvent('login', user.toObject()).catch(() => {});
    sendToken(user, 200, res);
});

// Logout User
exports.logoutUser = asyncErrorHandler(async (req, res, next) => {
    if (req.user) {
        notifyAuthEvent('logout', req.user.toObject ? req.user.toObject() : req.user).catch(() => {});
    }
    res.cookie("token", null, {
        expires: new Date(Date.now()),
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    });

    res.status(200).json({
        success: true,
        message: "Logged out successfully",
    });
});

// Get User Details
exports.getUserDetails = asyncErrorHandler(async (req, res, next) => {
    const user = await User.findById(req.user.id);
    if (!user) {
        return next(new ErrorHandler("User not found", 404));
    }
    res.status(200).json({ success: true, user });
});

// Forgot Password
exports.forgotPassword = asyncErrorHandler(async (req, res, next) => {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
        return next(new ErrorHandler("User not found with this email", 404));
    }

    const resetToken = await user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    notifyAuthEvent('password_reset', user.toObject()).catch(() => {});

    const resetPasswordUrl = `https://${req.get("host")}/password/reset/${resetToken}`;

    try {
        await sendEmail({
            email: user.email,
            templateId: process.env.SENDGRID_RESET_TEMPLATEID,
            data: { reset_url: resetPasswordUrl },
        });

        res.status(200).json({
            success: true,
            message: `Password reset email sent to ${user.email}`,
        });
    } catch (error) {
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save({ validateBeforeSave: false });
        return next(new ErrorHandler(error.message, 500));
    }
});

// Reset Password
exports.resetPassword = asyncErrorHandler(async (req, res, next) => {
    const resetPasswordToken = crypto
        .createHash("sha256")
        .update(req.params.token)
        .digest("hex");

    const user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
        return next(new ErrorHandler("Reset token is invalid or has expired", 400));
    }

    if (!req.body.password || req.body.password.length < 8) {
        return next(new ErrorHandler("Password must be at least 8 characters", 400));
    }

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    notifyAuthEvent('password_changed', user.toObject()).catch(() => {});
    sendToken(user, 200, res);
});

// Update Password
exports.updatePassword = asyncErrorHandler(async (req, res, next) => {
    const user = await User.findById(req.user.id).select("+password");

    const isPasswordMatched = await user.comparePassword(req.body.oldPassword);
    if (!isPasswordMatched) {
        return next(new ErrorHandler("Old password is incorrect", 400));
    }

    if (!req.body.newPassword || req.body.newPassword.length < 8) {
        return next(new ErrorHandler("New password must be at least 8 characters", 400));
    }

    user.password = req.body.newPassword;
    await user.save();
    notifyAuthEvent('password_changed', user.toObject()).catch(() => {});
    sendToken(user, 200, res);
});

// Update Profile
exports.updateProfile = asyncErrorHandler(async (req, res, next) => {
    const newUserData = {
        name: req.body.name,
        email: req.body.email,
    };

    if (req.body.avatar && req.body.avatar !== "") {
        try {
            const result = await uploadToImgBBCompat(req.body.avatar, `avatar-${req.user.id}-${Date.now()}`);
            newUserData.avatar = result;
        } catch (imgbbErr) {
            console.warn("ImgBB avatar update failed, keeping existing:", imgbbErr.message);
        }
    }

    await User.findByIdAndUpdate(req.user.id, newUserData, {
        new: true,
        runValidators: true,
    });

    res.status(200).json({ success: true });
});

// ── Manage Addresses ─────────────────────────────────────────────────────────
// Saved delivery addresses on the logged-in user's profile. Used by the
// Account → Manage Addresses tab and (optionally) pre-filled at checkout.

// List the logged-in user's addresses
exports.getMyAddresses = asyncErrorHandler(async (req, res, next) => {
    const user = await User.findById(req.user.id);
    if (!user) {
        return next(new ErrorHandler('User not found', 404));
    }
    res.status(200).json({ success: true, addresses: user.addresses || [] });
});

// Add a new address
exports.addAddress = asyncErrorHandler(async (req, res, next) => {
    const user = await User.findById(req.user.id);
    if (!user) {
        return next(new ErrorHandler('User not found', 404));
    }

    const {
        fullName = '', phoneNo = '', address = '', city = '',
        state = '', pincode = '', country = 'Bangladesh', label = 'Home',
    } = req.body || {};

    if (!address.trim() || !city.trim()) {
        return next(new ErrorHandler('Address and city are required', 400));
    }

    const makeDefault = Boolean(req.body.isDefault) || (user.addresses || []).length === 0;

    // Only one default at a time.
    if (makeDefault) {
        (user.addresses || []).forEach((a) => { a.isDefault = false; });
    }

    user.addresses.push({
        fullName, phoneNo, address, city, state, pincode, country, label,
        isDefault: makeDefault,
        createdAt: new Date(),
    });

    await user.save();

    res.status(201).json({ success: true, addresses: user.addresses });
});

// Update an existing address
exports.updateAddress = asyncErrorHandler(async (req, res, next) => {
    const user = await User.findById(req.user.id);
    if (!user) {
        return next(new ErrorHandler('User not found', 404));
    }

    const addr = (user.addresses || []).id(req.params.addressId);
    if (!addr) {
        return next(new ErrorHandler('Address not found', 404));
    }

    const fields = ['fullName', 'phoneNo', 'address', 'city', 'state', 'pincode', 'country', 'label'];
    fields.forEach((f) => {
        if (req.body[f] !== undefined) addr[f] = req.body[f];
    });

    if (req.body.isDefault === true) {
        (user.addresses || []).forEach((a) => { a.isDefault = false; });
        addr.isDefault = true;
    }

    await user.save();

    res.status(200).json({ success: true, addresses: user.addresses });
});

// Delete an address
exports.deleteAddress = asyncErrorHandler(async (req, res, next) => {
    const user = await User.findById(req.user.id);
    if (!user) {
        return next(new ErrorHandler('User not found', 404));
    }

    const addr = (user.addresses || []).id(req.params.addressId);
    if (!addr) {
        return next(new ErrorHandler('Address not found', 404));
    }

    const wasDefault = addr.isDefault;
    addr.remove();

    // If we removed the default, promote the first remaining address.
    if (wasDefault && user.addresses.length > 0) {
        user.addresses[0].isDefault = true;
    }

    await user.save();

    res.status(200).json({ success: true, addresses: user.addresses });
});

// Make one address the default
exports.setDefaultAddress = asyncErrorHandler(async (req, res, next) => {
    const user = await User.findById(req.user.id);
    if (!user) {
        return next(new ErrorHandler('User not found', 404));
    }

    const addr = (user.addresses || []).id(req.params.addressId);
    if (!addr) {
        return next(new ErrorHandler('Address not found', 404));
    }

    (user.addresses || []).forEach((a) => { a.isDefault = false; });
    addr.isDefault = true;

    await user.save();

    res.status(200).json({ success: true, addresses: user.addresses });
});
exports.getAllUsers = asyncErrorHandler(async (req, res, next) => {
    const users = await User.find();
    res.status(200).json({ success: true, users });
});

// Get Single User — ADMIN
exports.getSingleUser = asyncErrorHandler(async (req, res, next) => {
    const user = await User.findById(req.params.id);
    if (!user) {
        return next(new ErrorHandler(`User not found with id: ${req.params.id}`, 404));
    }
    res.status(200).json({ success: true, user });
});

// Update User Role — ADMIN
exports.updateUserRole = asyncErrorHandler(async (req, res, next) => {
    const newUserData = {
        name: req.body.name,
        email: req.body.email,
        gender: req.body.gender,
        phone: req.body.phone,
        role: req.body.role,
    };

    const user = await User.findByIdAndUpdate(req.params.id, newUserData, {
        new: true,
        runValidators: true,
    });

    if (!user) {
        return next(new ErrorHandler(`User not found with id: ${req.params.id}`, 404));
    }

    logEvent('user_role_updated', {
        title: '🛡️ User role updated',
        color: 0x8b5cf6,
        fields: [
            { name: '👤 User', value: user.name || '—', inline: true },
            { name: '📧 Email', value: user.email || '—', inline: true },
            { name: '🎚️ New role', value: user.role || '—', inline: true },
            { name: '🛠️ By', value: req.user?.email || 'admin', inline: true },
        ],
    }).catch(() => {});

    res.status(200).json({ success: true });
});

// Grant/revoke Cash on Delivery for one user — ADMIN
// (Admin → Users → COD toggle. The guest checkout can never use COD;
// only logged-in users with this flag — or admins — can.)
exports.updateCodAllowed = asyncErrorHandler(async (req, res, next) => {
    const user = await User.findById(req.params.id);
    if (!user) {
        return next(new ErrorHandler(`User not found with id: ${req.params.id}`, 404));
    }

    user.codAllowed = req.body.codAllowed === true;
    await user.save({ validateBeforeSave: false });

    logEvent('user_cod_toggled', {
        title: '💵 COD permission updated',
        color: 0xf59e0b,
        fields: [
            { name: '👤 User', value: user.name || '—', inline: true },
            { name: '📧 Email', value: user.email || '—', inline: true },
            { name: '💵 COD', value: user.codAllowed ? 'Enabled' : 'Disabled', inline: true },
            { name: '🛠️ By', value: req.user?.email || 'admin', inline: true },
        ],
    }).catch(() => {});

    res.status(200).json({ success: true, codAllowed: user.codAllowed });
});

// Delete User — ADMIN
exports.deleteUser = asyncErrorHandler(async (req, res, next) => {
    const user = await User.findById(req.params.id);
    if (!user) {
        return next(new ErrorHandler(`User not found with id: ${req.params.id}`, 404));
    }

    const snapshot = user.toObject();
    await user.deleteOne();

    logEvent('user_deleted', {
        title: '🗑️ User account deleted',
        color: 0xef4444,
        fields: [
            { name: '👤 User', value: snapshot.name || '—', inline: true },
            { name: '📧 Email', value: snapshot.email || '—', inline: true },
            { name: '🛠️ By', value: req.user?.email || 'admin', inline: true },
        ],
    }).catch(() => {});

    res.status(200).json({
        success: true,
        message: "User deleted successfully",
    });
});
