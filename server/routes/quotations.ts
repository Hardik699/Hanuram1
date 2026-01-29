import { RequestHandler } from "express";
import { ObjectId } from "mongodb";
import { getDB, getConnectionStatus } from "../db";

interface CreateQuotationRequest {
  recipeId: string;
  companyName: string;
  reason: string;
  quantity: number;
  unitId: string;
  date: string;
  createdBy: string;
  phoneNumber: string;
  email: string;
  items: Array<{
    rawMaterialId: string;
    vendorId: string;
    quantity: number;
    price: number;
  }>;
}

// Get all quotations for a recipe
export const handleGetQuotationsByRecipe: RequestHandler = async (req, res) => {
  if (getConnectionStatus() !== "connected") {
    return res
      .status(503)
      .json({ success: false, message: "Database not connected" });
  }

  try {
    const { recipeId } = req.params;
    const db = getDB();
    if (!db) {
      return res
        .status(503)
        .json({ success: false, message: "Database error" });
    }

    // Validate ObjectId format
    if (!ObjectId.isValid(recipeId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid recipe ID format" });
    }

    try {
      const quotations = await db
        .collection("quotations")
        .aggregate([
          { $match: { recipeId: new ObjectId(recipeId) } },
          {
            $lookup: {
              from: "quotation_items",
              localField: "_id",
              foreignField: "quotationId",
              as: "items",
            },
          },
          { $sort: { createdAt: -1 } },
        ])
        .toArray();

      // Enhance quotations with raw material and unit info
      for (const quotation of quotations) {
        const items = quotation.items || [];
        const rawMaterialIds = items
          .map((item: any) => new ObjectId(item.rawMaterialId))
          .filter((id: any) => ObjectId.isValid(id));

        if (rawMaterialIds.length > 0) {
          const rawMaterials = await db
            .collection("raw_materials")
            .find({ _id: { $in: rawMaterialIds } })
            .toArray();

          const unitsIds = new Set<string>();
          items.forEach((item: any) => {
            if (item.unitId) unitsIds.add(item.unitId.toString());
          });

          const units = await db
            .collection("units")
            .find({
              _id: { $in: Array.from(unitsIds).map((id) => new ObjectId(id)) },
            })
            .toArray();

          quotation.items = items.map((item: any) => {
            const rawMaterial = rawMaterials.find(
              (rm) =>
                rm._id.toString() ===
                (typeof item.rawMaterialId === "string"
                  ? item.rawMaterialId
                  : item.rawMaterialId.toString()),
            );
            const unit = units.find(
              (u) =>
                u._id.toString() ===
                (typeof item.unitId === "string"
                  ? item.unitId
                  : item.unitId?.toString()),
            );

            return {
              ...item,
              rawMaterialName: rawMaterial?.name || item.rawMaterialName || "Unknown",
              rawMaterialCode: rawMaterial?.code || item.rawMaterialCode || "-",
              unitName: unit?.name || item.unitName || "-",
            };
          });
        }
      }

      console.log(`✅ Fetched ${quotations.length} quotations for recipe ${recipeId}`);
      res.json({ success: true, data: quotations || [] });
    } catch (aggregationError) {
      console.error("Aggregation error:", aggregationError);
      res
        .status(500)
        .json({
          success: false,
          message: "Error fetching quotations",
          error:
            aggregationError instanceof Error
              ? aggregationError.message
              : String(aggregationError),
        });
    }
  } catch (error) {
    console.error("Error in quotations handler:", error);
    res
      .status(500)
      .json({ success: false, message: "Error fetching quotations", error: error instanceof Error ? error.message : String(error) });
  }
};

// Get single quotation details
export const handleGetQuotation: RequestHandler = async (req, res) => {
  if (getConnectionStatus() !== "connected") {
    return res
      .status(503)
      .json({ success: false, message: "Database not connected" });
  }

  try {
    const { quotationId } = req.params;
    const db = getDB();
    if (!db) {
      return res
        .status(503)
        .json({ success: false, message: "Database error" });
    }

    const quotation = await db
      .collection("quotations")
      .aggregate([
        { $match: { _id: new ObjectId(quotationId) } },
        {
          $lookup: {
            from: "quotation_items",
            localField: "_id",
            foreignField: "quotationId",
            as: "items",
          },
        },
        {
          $addFields: {
            items: {
              $map: {
                input: "$items",
                as: "item",
                in: {
                  $mergeObjects: [
                    "$$item",
                    {
                      $cond: [
                        { $eq: ["$$item.rawMaterialId", null] },
                        {},
                        {
                          rawMaterialId: "$$item.rawMaterialId",
                        },
                      ],
                    },
                  ],
                },
              },
            },
          },
        },
      ])
      .toArray();

    // Fetch raw material details for items
    if (quotation.length > 0) {
      const items = quotation[0].items || [];
      const rawMaterialIds = items.map((item: any) => new ObjectId(item.rawMaterialId)).filter((id: any) => ObjectId.isValid(id));

      if (rawMaterialIds.length > 0) {
        const rawMaterials = await db
          .collection("raw_materials")
          .find({ _id: { $in: rawMaterialIds } })
          .toArray();

        const unitsIds = new Set<string>();
        items.forEach((item: any) => {
          if (item.unitId) unitsIds.add(item.unitId.toString());
        });

        const units = await db
          .collection("units")
          .find({ _id: { $in: Array.from(unitsIds).map(id => new ObjectId(id)) } })
          .toArray();

        // Enhance items with raw material and unit info
        quotation[0].items = items.map((item: any) => {
          const rawMaterial = rawMaterials.find(
            (rm) => rm._id.toString() === (typeof item.rawMaterialId === 'string' ? item.rawMaterialId : item.rawMaterialId.toString())
          );
          const unit = units.find(
            (u) => u._id.toString() === (typeof item.unitId === 'string' ? item.unitId : item.unitId?.toString())
          );

          return {
            ...item,
            rawMaterialName: rawMaterial?.name || item.rawMaterialName || "Unknown",
            rawMaterialCode: rawMaterial?.code || item.rawMaterialCode || "-",
            unitName: unit?.name || item.unitName || "-",
          };
        });
      }
    }

    if (!quotation.length) {
      return res
        .status(404)
        .json({ success: false, message: "Quotation not found" });
    }

    res.json({ success: true, data: quotation[0] });
  } catch (error) {
    console.error("Error fetching quotation:", error);
    res
      .status(500)
      .json({ success: false, message: "Error fetching quotation" });
  }
};

// Create new quotation
export const handleCreateQuotation: RequestHandler = async (req, res) => {
  if (getConnectionStatus() !== "connected") {
    return res
      .status(503)
      .json({ success: false, message: "Database not connected" });
  }

  try {
    const db = getDB();
    if (!db) {
      return res
        .status(503)
        .json({ success: false, message: "Database error" });
    }

    const data: CreateQuotationRequest = req.body;

    // Create quotation
    const quotationResult = await db.collection("quotations").insertOne({
      recipeId: new ObjectId(data.recipeId),
      companyName: data.companyName,
      reason: data.reason,
      quantity: data.quantity,
      unitId: new ObjectId(data.unitId),
      date: new Date(data.date),
      createdBy: data.createdBy,
      phoneNumber: data.phoneNumber,
      email: data.email,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const quotationId = quotationResult.insertedId;

    // Create quotation items
    for (const item of data.items) {
      await db.collection("quotation_items").insertOne({
        quotationId,
        rawMaterialId: new ObjectId(item.rawMaterialId),
        vendorId: new ObjectId(item.vendorId),
        quantity: item.quantity,
        price: item.price,
        totalPrice: item.quantity * item.price,
        createdAt: new Date(),
      });
    }

    // Log creation
    await db.collection("quotation_logs").insertOne({
      quotationId,
      action: "created",
      details: `Quotation created by ${data.createdBy}`,
      createdAt: new Date(),
      changedBy: data.createdBy,
    });

    res.json({
      success: true,
      message: "Quotation created successfully",
      data: { _id: quotationId },
    });
  } catch (error) {
    console.error("Error creating quotation:", error);
    res
      .status(500)
      .json({ success: false, message: "Error creating quotation" });
  }
};

// Update quotation
export const handleUpdateQuotation: RequestHandler = async (req, res) => {
  if (getConnectionStatus() !== "connected") {
    return res
      .status(503)
      .json({ success: false, message: "Database not connected" });
  }

  try {
    const { quotationId } = req.params;
    const db = getDB();
    if (!db) {
      return res
        .status(503)
        .json({ success: false, message: "Database error" });
    }

    const data: CreateQuotationRequest = req.body;

    await db.collection("quotations").updateOne(
      { _id: new ObjectId(quotationId) },
      {
        $set: {
          companyName: data.companyName,
          reason: data.reason,
          quantity: data.quantity,
          unitId: new ObjectId(data.unitId),
          date: new Date(data.date),
          phoneNumber: data.phoneNumber,
          email: data.email,
          updatedAt: new Date(),
        },
      },
    );

    // Delete old items
    await db
      .collection("quotation_items")
      .deleteMany({ quotationId: new ObjectId(quotationId) });

    // Create new items
    for (const item of data.items) {
      await db.collection("quotation_items").insertOne({
        quotationId: new ObjectId(quotationId),
        rawMaterialId: new ObjectId(item.rawMaterialId),
        vendorId: new ObjectId(item.vendorId),
        quantity: item.quantity,
        price: item.price,
        totalPrice: item.quantity * item.price,
        createdAt: new Date(),
      });
    }

    // Log update
    await db.collection("quotation_logs").insertOne({
      quotationId: new ObjectId(quotationId),
      action: "updated",
      details: `Quotation updated by ${data.createdBy}`,
      createdAt: new Date(),
      changedBy: data.createdBy,
    });

    res.json({ success: true, message: "Quotation updated successfully" });
  } catch (error) {
    console.error("Error updating quotation:", error);
    res
      .status(500)
      .json({ success: false, message: "Error updating quotation" });
  }
};

// Delete quotation (password protected)
export const handleDeleteQuotation: RequestHandler = async (req, res) => {
  if (getConnectionStatus() !== "connected") {
    return res
      .status(503)
      .json({ success: false, message: "Database not connected" });
  }

  try {
    const { quotationId } = req.params;
    const { password, deletedBy } = req.body;

    const db = getDB();
    if (!db) {
      return res
        .status(503)
        .json({ success: false, message: "Database error" });
    }

    // Verify password (simple check - in production should hash)
    const adminUser = await db.collection("users").findOne({ role: "admin" });
    if (!adminUser || adminUser.password !== password) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid password" });
    }

    // Delete quotation and items
    await db
      .collection("quotations")
      .deleteOne({ _id: new ObjectId(quotationId) });
    await db
      .collection("quotation_items")
      .deleteMany({ quotationId: new ObjectId(quotationId) });

    // Log deletion
    await db.collection("quotation_logs").insertOne({
      quotationId: new ObjectId(quotationId),
      action: "deleted",
      details: `Quotation deleted by ${deletedBy}`,
      createdAt: new Date(),
      changedBy: deletedBy,
    });

    res.json({ success: true, message: "Quotation deleted successfully" });
  } catch (error) {
    console.error("Error deleting quotation:", error);
    res
      .status(500)
      .json({ success: false, message: "Error deleting quotation" });
  }
};

// Change vendor for quotation item
export const handleChangeQuotationVendor: RequestHandler = async (req, res) => {
  if (getConnectionStatus() !== "connected") {
    return res
      .status(503)
      .json({ success: false, message: "Database not connected" });
  }

  try {
    const { quotationItemId } = req.params;
    const { newVendorId, newPrice, quotationId, rawMaterialId, changedBy } =
      req.body;

    const db = getDB();
    if (!db) {
      return res
        .status(503)
        .json({ success: false, message: "Database error" });
    }

    const oldItem = await db.collection("quotation_items").findOne({
      _id: new ObjectId(quotationItemId),
    });

    if (!oldItem) {
      return res
        .status(404)
        .json({ success: false, message: "Item not found" });
    }

    // Update quotation item with new vendor and price
    await db.collection("quotation_items").updateOne(
      { _id: new ObjectId(quotationItemId) },
      {
        $set: {
          vendorId: new ObjectId(newVendorId),
          price: newPrice,
          totalPrice: oldItem.quantity * newPrice,
        },
      },
    );

    // Log vendor change
    await db.collection("quotation_logs").insertOne({
      quotationId: new ObjectId(quotationId),
      action: "vendor_changed",
      details: `Vendor changed for RM ${rawMaterialId} from ${oldItem.vendorId} to ${newVendorId}. Price: ${oldItem.price} → ${newPrice}`,
      oldValue: { vendorId: oldItem.vendorId, price: oldItem.price },
      newValue: { vendorId: newVendorId, price: newPrice },
      createdAt: new Date(),
      changedBy,
    });

    res.json({ success: true, message: "Vendor changed successfully" });
  } catch (error) {
    console.error("Error changing vendor:", error);
    res.status(500).json({ success: false, message: "Error changing vendor" });
  }
};

// Get quotation logs
export const handleGetQuotationLogs: RequestHandler = async (req, res) => {
  if (getConnectionStatus() !== "connected") {
    return res
      .status(503)
      .json({ success: false, message: "Database not connected" });
  }

  try {
    const { quotationId } = req.params;
    const db = getDB();
    if (!db) {
      return res
        .status(503)
        .json({ success: false, message: "Database error" });
    }

    const logs = await db
      .collection("quotation_logs")
      .find({ quotationId: new ObjectId(quotationId) })
      .sort({ createdAt: -1 })
      .toArray();

    res.json({ success: true, data: logs });
  } catch (error) {
    console.error("Error fetching quotation logs:", error);
    res
      .status(500)
      .json({ success: false, message: "Error fetching quotation logs" });
  }
};
