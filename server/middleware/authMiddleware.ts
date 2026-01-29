import { RequestHandler } from "express";
import { getDB } from "../db";
import { hasPermission } from "../rbac";

/**
 * Middleware to check if user has required permission
 */
export function requirePermission(requiredPermission: string): RequestHandler {
  return async (req, res, next) => {
    try {
      // Get user from request or headers
      let username = (req as any).user?.username || (req.headers["x-user"] as string);

      // If no username in headers, try to get from Authorization header or skip for now
      // (Frontend authentication is handled via localStorage, not headers)
      if (!username) {
        // For now, skip permission check and allow the request
        // In production, implement proper JWT-based authentication
        console.warn("⚠️  No user information in request, skipping permission check");
        next();
        return;
      }

      const db = getDB();
      if (!db) {
        return res.status(503).json({
          success: false,
          message: "Database connection lost",
        });
      }

      // Get user from database
      const user = await db.collection("users").findOne({
        username: username,
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized: User not found",
        });
      }

      if (user.status !== "active") {
        return res.status(403).json({
          success: false,
          message: "Forbidden: User account is blocked",
        });
      }

      // Check if user has required permission
      const hasAccess = await hasPermission(user.role_id, requiredPermission);

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: `Forbidden: Missing required permission: ${requiredPermission}`,
        });
      }

      // Attach user to request for use in route handlers
      (req as any).user = user;
      next();
    } catch (error) {
      console.error("Permission check error:", error);
      res.status(500).json({
        success: false,
        message: "Server error during permission check",
      });
    }
  };
}

/**
 * Middleware to check if user is authenticated (has any valid role)
 */
export const requireAuth: RequestHandler = async (req, res, next) => {
  try {
    const username = (req as any).user?.username || req.headers["x-user"];

    if (!username) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: No user information",
      });
    }

    const db = getDB();
    if (!db) {
      return res.status(503).json({
        success: false,
        message: "Database connection lost",
      });
    }

    const user = await db.collection("users").findOne({
      username: username as string,
    });

    if (!user || user.status !== "active") {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Invalid or inactive user",
      });
    }

    (req as any).user = user;
    next();
  } catch (error) {
    console.error("Auth error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during authentication",
    });
  }
};
