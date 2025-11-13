import mongoose from "mongoose";

const GoogleTokensSchema = new mongoose.Schema({
    access_token: String, // lets you call gmail API 
    refresh_token: String,
    scope: String, // permissions granted (read only)
    token_type: String,
    expiry_date: Number
}, { _id: false });

// User schema to store email and Google OAuth tokens on MongoDB
const UserSchema = new mongoose.Schema({
    email: { type: String, index: true, unique: true },  // unique: no users have the same email
    googleTokens: GoogleTokensSchema
}, { timestamps: true });

export default mongoose.model("User", UserSchema);