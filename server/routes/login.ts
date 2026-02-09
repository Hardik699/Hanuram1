import { RequestHandler } from "express";
import { getDB, getConnectionStatus } from "../db";
import { getUserPermissions, getUserModules } from "../rbac";
import { LoginRequest, LoginResponse } from "@shared/api";

export const handleLogin: RequestHandler = async (req, res) => {
  const dbStatus = getConnectionStatus();

  if (dbStatus !== "connected") {
    return res.status(503).json({
      success: false,
      message: "Database not connected. Please try again later.",
    } as LoginResponse);
  }

  const { username, password } = req.body as LoginRequest;

  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: "Username and password are required",
    } as LoginResponse);
  }

  try {
    const db = getDB();
    if (!db) {
      return res.status(503).json({
        success: false,
        message: "Database connection lost",
      } as LoginResponse);
    }

    const user = await db.collection("users").findOne({
      username: username.trim(),
      password: password, // In production, use bcrypt.compare()
    });

    if (user) {
      // Get user permissions based on role
      const permissions = await getUserPermissions(user.role_id);

      // Get user modules for module-based access control
      const modules = await getUserModules(user._id.toString());

      // Log for debugging
      console.log(`\n🔐 LOGIN DEBUG - User: ${username}`);
      console.log(`   User ID: ${user._id.toString()}`);
      console.log(`   Role ID: ${user.role_id}`);
      console.log(`   Permissions fetched: ${permissions.length} items`);
      console.log(`   Permissions: ${permissions.join(", ") || "NONE!"}`);
      console.log(`   Modules: ${modules.join(", ") || "NONE!"}\n`);

      // In production, use JWT token
      const token = Buffer.from(`${username}:${Date.now()}`).toString("base64");

      res.json({
        success: true,
        message: "Login successful",
        user: {
          id: user._id.toString(),
          username: user.username,
          email: user.email,
          role_id: user.role_id,
          permissions: permissions,
          modules: modules,
        },
        token: token,
      } as LoginResponse);
    } else {
      // Debug: check if user exists with just username
      const userExists = await db.collection("users").findOne({
        username: username.trim(),
      });

      if (userExists) {
        console.warn(
          `Login failed: User '${username}' found but password mismatch. Expected: '${userExists.password}', Received: '${password}'`,
        );
      } else {
        console.warn(`Login failed: User '${username}' not found in database`);
      }

      res.status(401).json({
        success: false,
        message: "Invalid username or password",
      } as LoginResponse);
    }
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during login",
    } as LoginResponse);
  }
};
