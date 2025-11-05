"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetUserPassword = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
admin.initializeApp();
/**
 * Cloud Function to reset user password using Firebase Admin SDK
 * This allows admin to reset password directly without needing email verification
 */
exports.resetUserPassword = functions.https.onCall(async (data, context) => {
    // Verify that user is authenticated and is admin
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { userId, newPassword, email } = data;
    if (!userId || !newPassword || !email) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing required parameters');
    }
    try {
        // Verify user making request is admin
        const adminUserDoc = await admin.firestore().collection('users').doc(context.auth.uid).get();
        if (!adminUserDoc.exists) {
            throw new functions.https.HttpsError('permission-denied', 'Admin user not found');
        }
        const adminUserData = adminUserDoc.data();
        if ((adminUserData === null || adminUserData === void 0 ? void 0 : adminUserData.role) !== 'admin' && (adminUserData === null || adminUserData === void 0 ? void 0 : adminUserData.role) !== 'department_admin') {
            throw new functions.https.HttpsError('permission-denied', 'Only admin can reset passwords');
        }
        // Get user document to verify user exists
        const userDoc = await admin.firestore().collection('users').doc(userId).get();
        if (!userDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'User not found');
        }
        const userData = userDoc.data();
        // Reset password using Admin SDK (this actually updates Firebase Auth password)
        await admin.auth().updateUser(userId, {
            password: newPassword
        });
        // Update user document in Firestore
        await admin.firestore().collection('users').doc(userId).update({
            passwordResetRequired: false,
            passwordResetTime: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        // Log activity in Firestore
        await admin.firestore().collection('activityLogs').add({
            userId: userId,
            username: (userData === null || userData === void 0 ? void 0 : userData.username) || email.split('@')[0],
            role: (userData === null || userData === void 0 ? void 0 : userData.role) || 'staff',
            department: (userData === null || userData === void 0 ? void 0 : userData.department) || 'System',
            position: (userData === null || userData === void 0 ? void 0 : userData.position) || 'Employee',
            action: 'password_reset',
            description: `Password reset by admin ${(adminUserData === null || adminUserData === void 0 ? void 0 : adminUserData.username) || context.auth.uid}`,
            performedBy: context.auth.uid,
            performedByRole: (adminUserData === null || adminUserData === void 0 ? void 0 : adminUserData.role) || 'admin',
            performedByDepartment: (adminUserData === null || adminUserData === void 0 ? void 0 : adminUserData.department) || 'System',
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        });
        return { success: true, message: 'Password reset successfully' };
    }
    catch (error) {
        console.error('Error resetting password:', error);
        throw new functions.https.HttpsError('internal', error.message || 'Failed to reset password');
    }
});
//# sourceMappingURL=index.js.map