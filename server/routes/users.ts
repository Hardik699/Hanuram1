import { RequestHandler } from "express";
import { getDB } from "../db";
import { getUserPermissions } from "../rbac";
import { ObjectId } from "mongodb";

/**
 * Get all users
 */
export const handleGetUsers: RequestHandler = async (req, res) => {
  try {
    const db = getDB();
    if (!db) {
      return res.status(503).json({
        success: false,
        message: "Database connection lost",
      });
    }

    const users = await db
      .collection("users")
      .find({})
      .project({ password: 0 })
      .toArray();

    // Add permissions to each user
    const usersWithPermissions = await Promise.all(
      users.map(async (user) => {
        const permissions = await getUserPermissions(user.role_id);
        return {
          ...user,
          permissions,
        };
      }),
    );

    res.json({
      success: true,
      data: usersWithPermissions,
    });
  } catch (error) {
    console.error("Error getting users:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/**
 * Get a single user by ID
 */
export const handleGetUserById: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const db = getDB();
    if (!db) {
      return res.status(503).json({
        success: false,
        message: "Database connection lost",
      });
    }

    const user = await db
      .collection("users")
      .findOne({ _id: new ObjectId(id) }, { projection: { password: 0 } });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const permissions = await getUserPermissions(user.role_id);

    res.json({
      success: true,
      user: {
        ...user,
        permissions,
      },
    });
  } catch (error) {
    console.error("Error getting user by ID:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/**
 * Update user information (username, email, role)
 */
export const handleUpdateUser: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, role_id } = req.body;

    if (!username || !email || role_id === undefined) {
      return res.status(400).json({
        success: false,
        message: "Username, email, and role_id are required",
      });
    }

    const db = getDB();
    if (!db) {
      return res.status(503).json({
        success: false,
        message: "Database connection lost",
      });
    }

    const result = await db.collection("users").updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          username,
          email,
          role_id: parseInt(role_id),
          updatedAt: new Date(),
        },
      },
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const updatedUser = await db
      .collection("users")
      .findOne({ _id: new ObjectId(id) }, { projection: { password: 0 } });

    const permissions = await getUserPermissions(updatedUser?.role_id || 2);

    res.json({
      success: true,
      message: "User updated successfully",
      user: {
        ...updatedUser,
        permissions,
      },
    });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/**
 * Create a new user
 */
export const handleCreateUser: RequestHandler = async (req, res) => {
  try {
    const { username, email, password, role_id, modules } = req.body;

    if (!username || !email || !password || !role_id) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    if (!modules || !Array.isArray(modules) || modules.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one module must be selected",
      });
    }

    const db = getDB();
    if (!db) {
      return res.status(503).json({
        success: false,
        message: "Database connection lost",
      });
    }

    // Check if user already exists
    const existingUser = await db.collection("users").findOne({
      username: username.trim(),
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User already exists",
      });
    }

    // Create new user
    const newUser = {
      username: username.trim(),
      email: email.trim(),
      password: password, // In production, hash this with bcrypt
      role_id: parseInt(role_id),
      status: "active",
      createdAt: new Date(),
    };

    const result = await db.collection("users").insertOne(newUser);
    const userId = result.insertedId.toString();

    // Add user modules to user_modules collection
    const userModules = modules.map((moduleKey: string) => ({
      user_id: userId,
      module_key: moduleKey,
    }));

    await db.collection("user_modules").insertMany(userModules);

    // Get permissions for the user
    const permissions = await getUserPermissions(role_id);

    res.status(201).json({
      success: true,
      message: "User created successfully",
      user: {
        _id: result.insertedId,
        ...newUser,
        password: undefined,
        permissions,
        modules,
      },
    });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/**
 * Update user role
 */
export const handleUpdateUserRole: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { role_id } = req.body;

    if (!role_id) {
      return res.status(400).json({
        success: false,
        message: "Role ID is required",
      });
    }

    const db = getDB();
    if (!db) {
      return res.status(503).json({
        success: false,
        message: "Database connection lost",
      });
    }

    const result = await db.collection("users").updateOne(
      { _id: new ObjectId(id) },
      {
        $set: { role_id: parseInt(role_id) },
      },
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Get updated user with permissions
    const updatedUser = await db
      .collection("users")
      .findOne({ _id: new ObjectId(id) });

    if (updatedUser) {
      const permissions = await getUserPermissions(updatedUser.role_id);

      res.json({
        success: true,
        message: "User role updated successfully",
        user: {
          ...updatedUser,
          password: undefined,
          permissions,
        },
      });
    } else {
      res.status(500).json({
        success: false,
        message: "Error fetching updated user",
      });
    }
  } catch (error) {
    console.error("Error updating user role:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/**
 * Update user status (block/unblock)
 */
export const handleUpdateUserStatus: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !["active", "blocked"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Use 'active' or 'blocked'",
      });
    }

    const db = getDB();
    if (!db) {
      return res.status(503).json({
        success: false,
        message: "Database connection lost",
      });
    }

    const result = await db.collection("users").updateOne(
      { _id: new ObjectId(id) },
      {
        $set: { status: status },
      },
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const updatedUser = await db
      .collection("users")
      .findOne({ _id: new ObjectId(id) });

    res.json({
      success: true,
      message: `User ${status}`,
      user: {
        ...updatedUser,
        password: undefined,
      },
    });
  } catch (error) {
    console.error("Error updating user status:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/**
 * Delete a user
 */
export const handleDeleteUser: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const db = getDB();
    if (!db) {
      return res.status(503).json({
        success: false,
        message: "Database connection lost",
      });
    }

    const result = await db
      .collection("users")
      .deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/**
 * Get roles
 */
export const handleGetRoles: RequestHandler = async (req, res) => {
  try {
    const db = getDB();
    if (!db) {
      return res.status(503).json({
        success: false,
        message: "Database connection lost",
      });
    }

    const roles = await db.collection("roles").find({}).toArray();

    res.json({
      success: true,
      data: roles,
    });
  } catch (error) {
    console.error("Error getting roles:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/**
 * Get all permissions
 */
export const handleGetPermissions: RequestHandler = async (req, res) => {
  try {
    const db = getDB();
    if (!db) {
      return res.status(503).json({
        success: false,
        message: "Database connection lost",
      });
    }

    const permissions = await db.collection("permissions").find({}).toArray();

    res.json({
      success: true,
      data: permissions,
    });
  } catch (error) {
    console.error("Error getting permissions:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/**
 * Update user permissions by finding the best matching role
 * Permissions in this system are role-based, so we find the role that matches
 * the selected permissions and update the user's role
 */
export const handleUpdateUserPermissions: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { permissions } = req.body;

    if (!id || !Array.isArray(permissions)) {
      return res.status(400).json({
        success: false,
        message: "User ID and permissions array are required",
      });
    }

    const db = getDB();
    if (!db) {
      return res.status(503).json({
        success: false,
        message: "Database connection lost",
      });
    }

    // Get the user
    const user = await db
      .collection("users")
      .findOne({ _id: new ObjectId(id) });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // In this system, permissions are derived from roles
    // We'll store the custom permissions on the user document
    const result = await db.collection("users").updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          customPermissions: permissions,
          updatedAt: new Date(),
        },
      },
    );

    if (result.modifiedCount === 0 && result.matchedCount === 0) {
      return res.status(500).json({
        success: false,
        message: "Failed to update user",
      });
    }

    // Return the updated user
    const updatedUser = await db
      .collection("users")
      .findOne({ _id: new ObjectId(id) }, { projection: { password: 0 } });

    res.json({
      success: true,
      message: "Permissions updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error updating user permissions:", error);
    res.status(500).json({
      success: false,
      message: "Server error updating permissions",
    });
  }
};
