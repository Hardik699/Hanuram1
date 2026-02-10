import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch, cn } from "@/lib/utils";
import {
  Check,
  AlertCircle,
  Plus,
  X,
  MoreVertical,
  Download,
  Upload,
  ChevronLeft,
  ChevronRight,
  Package,
  History,
  TrendingUp,
  Trash2,
  RefreshCw,
  Search,
  LayoutGrid,
} from "lucide-react";
import { Layout } from "@/components/Layout";
import { PageHeader } from "@/components/PageHeader";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Category {
  _id: string;
  name: string;
}

interface SubCategory {
  _id: string;
  name: string;
  categoryId: string;
}

interface Unit {
  _id: string;
  name: string;
}

interface Vendor {
  _id: string;
  name: string;
}

interface RawMaterial {
  _id: string;
  code: string;
  name: string;
  categoryId: string;
  categoryName: string;
  subCategoryId: string;
  subCategoryName: string;
  unitId?: string;
  unitName?: string;
  hsnCode?: string;
  createdAt: string;
  lastAddedPrice?: number;
  lastVendorName?: string;
  lastPriceDate?: string;
}

interface VendorPrice {
  _id: string;
  rawMaterialId: string;
  vendorId: string;
  vendorName: string;
  quantity: number;
  unitName?: string;
  price: number;
  addedDate: string;
}

interface PriceLog {
  _id: string;
  rawMaterialId: string;
  vendorId: string;
  vendorName: string;
  oldPrice: number;
  newPrice: number;
  quantity: number;
  unitName?: string;
  changeDate: string;
  changedBy: string;
}

export default function RMManagement() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);

  // Filter state
  const [filterCategoryId, setFilterCategoryId] = useState("");
  const [filterSubCategoryId, setFilterSubCategoryId] = useState("");
  const [filterVendorId, setFilterVendorId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Form state
  const [showAddRMForm, setShowAddRMForm] = useState(false);
  const [rmFormData, setRmFormData] = useState({
    name: "",
    categoryId: "",
    subCategoryId: "",
    unitId: "",
    hsnCode: "",
  });
  const [editingRMId, setEditingRMId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">(
    "success",
  );
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const uploadInputRef = useRef<HTMLInputElement | null>(null);
  const priceUploadInputRef = useRef<HTMLInputElement | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Price History modal state
  const [showPriceHistoryModal, setShowPriceHistoryModal] = useState(false);
  const [selectedRMForHistory, setSelectedRMForHistory] =
    useState<RawMaterial | null>(null);
  const [rmPriceHistory, setRmPriceHistory] = useState<any[]>([]);
  const [uploadErrors, setUploadErrors] = useState<any[]>([]);
  const [showUploadErrorsModal, setShowUploadErrorsModal] = useState(false);
  const [showClearConfirmModal, setShowClearConfirmModal] = useState(false);
  const [clearPassword, setClearPassword] = useState("");

  // Fetch data on mount
  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      navigate("/");
      return;
    }
    fetchCategories();
    fetchSubCategories();
    fetchUnits();
    fetchVendors();
    fetchRawMaterials();
  }, [navigate]);

  const fetchCategories = async () => {
    try {
      const response = await apiFetch("/api/categories");
      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        setCategories(data.data);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      setMessage(
        error instanceof Error ? error.message : "Failed to fetch categories",
      );
      setMessageType("error");
    }
  };

  const fetchSubCategories = async () => {
    try {
      const response = await apiFetch("/api/subcategories");
      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        setSubCategories(data.data);
      }
    } catch (error) {
      console.error("Error fetching subcategories:", error);
      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to fetch subcategories",
      );
      setMessageType("error");
    }
  };

  const fetchUnits = async () => {
    try {
      const response = await apiFetch("/api/units");
      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        setUnits(data.data);
      }
    } catch (error) {
      console.error("Error fetching units:", error);
      setMessage(
        error instanceof Error ? error.message : "Failed to fetch units",
      );
      setMessageType("error");
    }
  };

  const fetchVendors = async () => {
    try {
      const response = await apiFetch("/api/vendors");
      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        setVendors(data.data);
      }
    } catch (error) {
      console.error("Error fetching vendors:", error);
      setMessage(
        error instanceof Error ? error.message : "Failed to fetch vendors",
      );
      setMessageType("error");
    }
  };

  const fetchRawMaterials = async () => {
    try {
      const response = await apiFetch("/api/raw-materials");
      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        setRawMaterials(data.data);
      }
    } catch (error) {
      console.error("Error fetching raw materials:", error);
      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to fetch raw materials",
      );
      setMessageType("error");
    }
  };

  const getFilteredSubCategories = () => {
    if (!filterCategoryId) return subCategories;
    return subCategories.filter((sc) => sc.categoryId === filterCategoryId);
  };

  const getSelectedCategorySubCategories = () => {
    if (!rmFormData.categoryId) return [];
    return subCategories.filter(
      (sc) => sc.categoryId === rmFormData.categoryId,
    );
  };

  const getFilteredRawMaterials = () => {
    return rawMaterials.filter((rm) => {
      const matchesCategory =
        !filterCategoryId || rm.categoryId === filterCategoryId;
      const matchesSubCategory =
        !filterSubCategoryId || rm.subCategoryId === filterSubCategoryId;
      const matchesVendor = !filterVendorId || false;

      // Search matching - search in code, name, category, subcategory
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        !searchTerm ||
        rm.code.toLowerCase().includes(searchLower) ||
        rm.name.toLowerCase().includes(searchLower) ||
        rm.categoryName.toLowerCase().includes(searchLower) ||
        rm.subCategoryName.toLowerCase().includes(searchLower);

      return (
        matchesCategory && matchesSubCategory && matchesVendor && matchesSearch
      );
    });
  };

  const filteredRawMaterials = getFilteredRawMaterials();
  const totalPages = Math.ceil(filteredRawMaterials.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedRawMaterials = filteredRawMaterials.slice(
    startIndex,
    endIndex,
  );

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(parseInt(value));
    setCurrentPage(1);
  };

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const handleSaveRawMaterial = async () => {
    const newErrors: Record<string, string> = {};
    if (!rmFormData.name.trim()) newErrors.name = "RM name is required";
    if (!rmFormData.categoryId) newErrors.categoryId = "Category is required";
    if (!rmFormData.subCategoryId)
      newErrors.subCategoryId = "Sub-category is required";

    if (Object.keys(newErrors).length > 0) {
      return;
    }

    try {
      const selectedCategory = categories.find(
        (c) => c._id === rmFormData.categoryId,
      );
      const selectedSubCategory = subCategories.find(
        (sc) => sc._id === rmFormData.subCategoryId,
      );
      const selectedUnit = units.find((u) => u._id === rmFormData.unitId);

      if (editingRMId) {
        const response = await fetch(`/api/raw-materials/${editingRMId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: rmFormData.name,
            categoryId: rmFormData.categoryId,
            categoryName: selectedCategory?.name,
            subCategoryId: rmFormData.subCategoryId,
            subCategoryName: selectedSubCategory?.name,
            unitId: rmFormData.unitId,
            unitName: selectedUnit?.name,
            hsnCode: rmFormData.hsnCode,
          }),
        });

        const data = await response.json();
        if (data.success) {
          setMessage("Raw material updated successfully");
          setMessageType("success");
          setShowAddRMForm(false);
          setEditingRMId(null);
          setRmFormData({
            name: "",
            categoryId: "",
            subCategoryId: "",
            unitId: "",
            hsnCode: "",
          });
          fetchRawMaterials();
        } else {
          setMessage(data.message || "Update failed");
          setMessageType("error");
        }
      } else {
        const response = await fetch("/api/raw-materials", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: rmFormData.name,
            categoryId: rmFormData.categoryId,
            categoryName: selectedCategory?.name,
            subCategoryId: rmFormData.subCategoryId,
            subCategoryName: selectedSubCategory?.name,
            unitId: rmFormData.unitId,
            unitName: selectedUnit?.name,
            hsnCode: rmFormData.hsnCode,
            createdBy: "admin",
          }),
        });

        const data = await response.json();
        if (data.success) {
          setMessage("Raw material created successfully");
          setMessageType("success");
          setShowAddRMForm(false);
          setRmFormData({
            name: "",
            categoryId: "",
            subCategoryId: "",
            unitId: "",
            hsnCode: "",
          });
          fetchRawMaterials();
        } else {
          setMessage(data.message || "Creation failed");
          setMessageType("error");
        }
      }
    } catch (error) {
      console.error("Error saving raw material:", error);
      setMessage("Error saving raw material");
      setMessageType("error");
    }
  };

  const handleDeleteRawMaterial = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this raw material?")) {
      return;
    }

    try {
      const response = await fetch(`/api/raw-materials/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();
      if (data.success) {
        setMessage("Raw material deleted successfully");
        setMessageType("success");
        fetchRawMaterials();
      } else {
        setMessage(data.message || "Delete failed");
        setMessageType("error");
      }
    } catch (error) {
      console.error("Error deleting raw material:", error);
      setMessage("Error deleting raw material");
      setMessageType("error");
    }
  };

  const handleEditRawMaterial = (rm: RawMaterial) => {
    navigate(`/raw-materials/${rm._id}/edit`);
  };

  // CSV upload handler with progress tracking
  const handleUploadRawMaterials = async (file: File) => {
    if (!file) return;

    setUploadLoading(true);
    setUploadProgress(0);
    setMessage("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      // Use XMLHttpRequest to track upload progress
      const response = await new Promise<Response>((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        // Track upload progress
        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) {
            const percentComplete = (e.loaded / e.total) * 100;
            setUploadProgress(Math.round(percentComplete));
          }
        });

        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(
              new Response(xhr.responseText, {
                status: xhr.status,
                statusText: xhr.statusText,
              }),
            );
          } else {
            reject(new Error(`HTTP error! status: ${xhr.status}`));
          }
        });

        xhr.addEventListener("error", () => {
          reject(new Error("Upload failed"));
        });

        xhr.addEventListener("abort", () => {
          reject(new Error("Upload cancelled"));
        });

        xhr.open("POST", "/api/raw-materials/upload");
        xhr.send(formData);
      });

      const data = await response.json();

      if (data.success) {
        setUploadProgress(100);
        setMessageType("success");
        setMessage(
          `Successfully uploaded! Created: ${data.data.created}, Updated: ${data.data.updated}, Skipped: ${data.data.skipped.length}`,
        );
        setTimeout(() => {
          fetchRawMaterials();
          setMessage("");
          setUploadProgress(0);
        }, 1500);
      } else {
        setMessageType("error");
        setMessage(data.message || "Failed to upload raw materials");
        setUploadProgress(0);
      }
    } catch (error) {
      console.error("Error uploading raw materials:", error);
      setMessageType("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "Error uploading raw materials",
      );
      setUploadProgress(0);
    } finally {
      setUploadLoading(false);
      if (uploadInputRef.current) {
        uploadInputRef.current.value = "";
      }
    }
  };

  // CSV upload handler for prices with progress tracking
  const handleUploadPrices = async (file: File) => {
    if (!file) return;

    setUploadLoading(true);
    setUploadProgress(0);
    setMessage("");
    setUploadErrors([]);

    try {
      const formData = new FormData();
      formData.append("file", file);

      // Use XMLHttpRequest to track upload progress
      const response = await new Promise<Response>((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        // Track upload progress
        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) {
            const percentComplete = (e.loaded / e.total) * 100;
            setUploadProgress(Math.round(percentComplete));
          }
        });

        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(
              new Response(xhr.responseText, {
                status: xhr.status,
                statusText: xhr.statusText,
              }),
            );
          } else {
            reject(new Error(`HTTP error! status: ${xhr.status}`));
          }
        });

        xhr.addEventListener("error", () => {
          reject(new Error("Upload failed"));
        });

        xhr.addEventListener("abort", () => {
          reject(new Error("Upload cancelled"));
        });

        xhr.open("POST", "/api/raw-materials/upload-prices");
        xhr.send(formData);
      });

      const data = await response.json();

      if (data.success) {
        setUploadProgress(100);
        setMessageType("success");
        let msg = `Successfully uploaded prices! Created: ${data.data.created}, Updated: ${data.data.updated}`;

        if (data.data.skipped.length > 0) {
          msg += `, Skipped: ${data.data.skipped.length}`;
          setUploadErrors(data.data.skipped);
          setShowUploadErrorsModal(true);
        }

        setMessage(msg);
        setTimeout(() => {
          if (data.data.skipped.length === 0) {
            fetchRawMaterials();
            setMessage("");
            setUploadProgress(0);
          }
        }, 1500);

        if (data.data.skipped.length === 0) {
          fetchRawMaterials();
        }
      } else {
        setMessageType("error");
        setMessage(data.message || "Failed to upload prices");
        setUploadProgress(0);
      }
    } catch (error) {
      console.error("Error uploading prices:", error);
      setMessageType("error");
      setMessage(
        error instanceof Error ? error.message : "Error uploading prices",
      );
      setUploadProgress(0);
    } finally {
      setUploadLoading(false);
      if (priceUploadInputRef.current) {
        priceUploadInputRef.current.value = "";
      }
    }
  };

  useEffect(() => {
    const input = uploadInputRef.current;
    if (!input) return;

    const handleChange = (e: Event) => {
      const target = e.target as HTMLInputElement;
      if (target.files?.[0]) {
        handleUploadRawMaterials(target.files[0]);
      }
    };

    input.addEventListener("change", handleChange);
    return () => input.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    const input = priceUploadInputRef.current;
    if (!input) return;

    const handleChange = (e: Event) => {
      const target = e.target as HTMLInputElement;
      if (target.files?.[0]) {
        handleUploadPrices(target.files[0]);
      }
    };

    input.addEventListener("change", handleChange);
    return () => input.removeEventListener("change", handleChange);
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatUnit = (u?: string | null) => {
    if (!u) return null;
    const s = u.toLowerCase().trim();
    if (s.includes("kg") || s.includes("kilogram")) return "kg";
    if (s === "g" || s.includes("gram")) return "g";
    if (
      s.includes("lit") ||
      s === "l" ||
      s.includes("ltr") ||
      s.includes("litre")
    )
      return "L";
    if (s.includes("ml")) return "ml";
    if (s.includes("piece") || s.includes("pc") || s === "pcs") return "pcs";
    return u;
  };

  const handleViewRMPriceHistory = async (rm: RawMaterial) => {
    setSelectedRMForHistory(rm);
    setShowPriceHistoryModal(true);
    try {
      const response = await fetch(
        `/api/raw-materials/${rm._id}/price-history`,
      );
      const data = await response.json();
      if (data.success) setRmPriceHistory(data.data);
    } catch (error) {
      console.error("Error fetching RM price history:", error);
    }
  };

  const handleClearAllClick = () => {
    setShowClearConfirmModal(true);
    setClearPassword("");
  };

  const confirmClearAllRawMaterials = async () => {
    const CLEAR_PASSWORD = "1212";

    if (clearPassword !== CLEAR_PASSWORD) {
      setMessage("Incorrect password");
      setMessageType("error");
      return;
    }

    setShowClearConfirmModal(false);

    try {
      const response = await fetch("/api/raw-materials/clear/all", {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const text = await response.text();
      if (!text) {
        throw new Error("Empty response from server");
      }

      const data = JSON.parse(text);
      if (data.success) {
        setMessageType("success");
        setMessage(data.message);
        setClearPassword("");
        setTimeout(() => {
          fetchRawMaterials();
          setMessage("");
        }, 1000);
      } else {
        setMessageType("error");
        setMessage(data.message || "Failed to clear raw materials");
      }
    } catch (error) {
      console.error("Error clearing raw materials:", error);
      setMessageType("error");
      setMessage(
        error instanceof Error ? error.message : "Error clearing raw materials",
      );
    }
  };

  const headerActions = (
    <>
      <button
        onClick={() => navigate("/raw-materials/new")}
        className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-2.5 px-5 rounded-xl transition-all shadow-elevation-3 hover:shadow-elevation-5 transform hover:scale-105 hover:-translate-y-0.5 whitespace-nowrap text-sm"
      >
        <Plus className="w-4 h-4" />
        <span>Add Raw Material</span>
      </button>

      <button
        onClick={handleClearAllClick}
        disabled={rawMaterials.length === 0}
        className="flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-slate-300 dark:disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold py-2.5 px-5 rounded-xl transition-all shadow-elevation-2 hover:shadow-elevation-4 transform hover:scale-105 hover:-translate-y-0.5"
      >
        <Trash2 className="w-4 h-4" />
        Clear All
      </button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
            title="CSV Options"
          >
            <MoreVertical className="w-5 h-5" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem
            onClick={async () => {
              try {
                const res = await fetch("/api/raw-materials/export");
                if (!res.ok) throw new Error("Export failed");
                const blob = await res.blob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "raw-materials-export.csv";
                document.body.appendChild(a);
                a.click();
                a.remove();
                URL.revokeObjectURL(url);
              } catch (err) {
                console.error(err);
                setMessageType("error");
                setMessage("Failed to download export");
              }
            }}
            className="cursor-pointer flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Download CSV</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => {
              const input = document.getElementById(
                "rm-upload-input",
              ) as HTMLInputElement;
              input?.click();
            }}
            className="cursor-pointer flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            <span>Upload CSV</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => {
              const input = document.getElementById(
                "rm-price-upload-input",
              ) as HTMLInputElement;
              input?.click();
            }}
            className="cursor-pointer flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Prices</span>
          </DropdownMenuItem>

          <DropdownMenuItem asChild>
            <a
              href="/demo-rm-create.csv"
              download
              className="cursor-pointer flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>Demo CSV</span>
            </a>
          </DropdownMenuItem>

          <DropdownMenuItem asChild>
            <a
              href="/demo-price-upload.csv"
              download
              className="cursor-pointer flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>Demo Prices</span>
            </a>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={async () => {
              try {
                setMessage("Resetting RM counter...");
                setMessageType("success");

                const res = await fetch("/api/raw-materials/reset-counter", {
                  method: "POST",
                });

                let errorMsg = "";
                if (!res.ok) {
                  errorMsg = `Server error: ${res.status} ${res.statusText}`;
                  try {
                    const errorData = await res.json();
                    errorMsg = errorData.message || errorMsg;
                  } catch {
                    // Response wasn't JSON
                  }
                  throw new Error(errorMsg);
                }

                const data = await res.json();
                if (!data.success) {
                  throw new Error(data.message || "Reset failed");
                }

                setMessage(data.message);
                setMessageType("success");
              } catch (err) {
                console.error("Reset error:", err);
                setMessageType("error");
                const errorMsg =
                  err instanceof Error ? err.message : "Unknown error occurred";
                setMessage("Failed to reset RM counter: " + errorMsg);
              }
            }}
            className="cursor-pointer flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Reset Counter to RM00001</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={async () => {
              try {
                setMessage(
                  "Migrating all raw materials... This may take a moment...",
                );
                setMessageType("success");

                const res = await fetch("/api/raw-materials/migrate/codes", {
                  method: "POST",
                });

                let errorMsg = "";
                if (!res.ok) {
                  errorMsg = `Server error: ${res.status} ${res.statusText}`;
                  try {
                    const errorData = await res.json();
                    errorMsg = errorData.message || errorMsg;
                  } catch {
                    // Response wasn't JSON
                  }
                  throw new Error(errorMsg);
                }

                const data = await res.json();
                if (!data.success) {
                  throw new Error(data.message || "Migration failed");
                }

                setMessage(data.message);
                setMessageType("success");

                // Reload raw materials
                const result = await fetch("/api/raw-materials");
                if (result.ok) {
                  const rms = await result.json();
                  setRawMaterials(rms.data || []);
                }
              } catch (err) {
                console.error("Migration error:", err);
                setMessageType("error");
                const errorMsg =
                  err instanceof Error ? err.message : "Unknown error occurred";
                setMessage("Failed to migrate RM codes: " + errorMsg);
              }
            }}
            className="cursor-pointer flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Renumber All to RM00001 Format</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={async () => {
              if (
                !confirm(
                  "Are you sure you want to delete ALL prices? This cannot be undone.",
                )
              ) {
                return;
              }

              try {
                setMessage("Clearing all prices...");
                setMessageType("success");

                const response = await fetch(
                  "/api/raw-materials/prices/clear/all",
                  {
                    method: "DELETE",
                  },
                );

                if (!response.ok) {
                  throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();

                if (data.success) {
                  setMessageType("success");
                  setMessage(data.message);
                  setTimeout(() => {
                    fetchRawMaterials();
                    setMessage("");
                  }, 1500);
                } else {
                  setMessageType("error");
                  setMessage(data.message || "Failed to clear prices");
                }
              } catch (error) {
                console.error("Error clearing prices:", error);
                setMessageType("error");
                setMessage(
                  error instanceof Error
                    ? error.message
                    : "Error clearing prices",
                );
              }
            }}
            className="cursor-pointer flex items-center gap-2 text-red-600"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear All Prices</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <input
        ref={uploadInputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        id="rm-upload-input"
      />
      <input
        ref={priceUploadInputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        id="rm-price-upload-input"
      />
    </>
  );

  // Calculate statistics
  const totalRawMaterials = rawMaterials.length;
  const materialsWithPrices = rawMaterials.filter(
    (rm) => rm.lastAddedPrice,
  ).length;
  const materialsWithoutPrices = totalRawMaterials - materialsWithPrices;

  return (
    <Layout title="Raw Material Management">
      <>
        <PageHeader
          title="Raw Material Management"
          description="Manage all raw materials and track vendor prices"
          breadcrumbs={[{ label: "Raw Material Management" }]}
          icon={<Package className="w-6 h-6 text-white" />}
          actions={headerActions}
        />

        {/* Statistics Cards - Modern SaaS Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8 animate-fade-in-up">
          {/* Total Raw Materials Card */}
          <div className="stat-card group">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="stat-label mb-2">
                  Total Materials
                </p>
                <h3 className="stat-value text-3xl">
                  {totalRawMaterials}
                </h3>
              </div>
              <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          {/* With Prices Card */}
          <div className="stat-card group">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="stat-label mb-2">
                  With Prices
                </p>
                <h3 className="stat-value text-3xl">
                  {materialsWithPrices}
                </h3>
                <p className="text-xs text-gray-500 mt-2">
                  {totalRawMaterials > 0 ? Math.round((materialsWithPrices / totalRawMaterials) * 100) : 0}% complete
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          {/* Pending Prices Card */}
          <div className="stat-card group">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="stat-label mb-2">
                  Pending Prices
                </p>
                <h3 className="stat-value text-3xl">
                  {materialsWithoutPrices}
                </h3>
                <p className="text-xs text-gray-500 mt-2">
                  Awaiting vendor data
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <AlertCircle className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </div>

          {/* Total Categories Card */}
          <div className="stat-card group">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="stat-label mb-2">
                  Categories
                </p>
                <h3 className="stat-value text-3xl">
                  {categories.length}
                </h3>
                <p className="text-xs text-gray-500 mt-2">
                  Total classifications
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <LayoutGrid className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {/* Message Alert - Modern Notification */}
          {message && (
            <div
              className={`p-4 rounded-lg flex items-start gap-3 border animate-slide-in-down ${
                messageType === "success"
                  ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                  : "bg-red-50 border-red-200 text-red-900"
              }`}
              style={{
                boxShadow: messageType === "success"
                  ? "0 4px 12px rgba(16, 185, 129, 0.1)"
                  : "0 4px 12px rgba(239, 68, 68, 0.1)"
              }}
            >
              {messageType === "success" ? (
                <Check className={`w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5`} />
              ) : (
                <AlertCircle className={`w-5 h-5 text-red-600 flex-shrink-0 mt-0.5`} />
              )}
              <div className="flex-1">
                <span
                  className={
                    messageType === "success"
                      ? "text-emerald-800 dark:text-emerald-300 font-semibold text-sm"
                      : "text-red-800 dark:text-red-300 font-semibold text-sm"
                  }
                >
                  {message}
                </span>
                {uploadLoading && uploadProgress > 0 && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-blue-700 dark:text-blue-300">
                        Upload Progress
                      </span>
                      <span className="text-xs font-bold text-blue-700 dark:text-blue-300">
                        {uploadProgress}%
                      </span>
                    </div>
                    <div className="w-full bg-blue-200 dark:bg-blue-900/30 rounded-full h-3 overflow-hidden shadow-inner">
                      <div
                        className="bg-gradient-to-r from-blue-500 via-blue-600 to-cyan-500 h-3 rounded-full transition-all duration-300 ease-out shadow-elevation-1"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Filter Section */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-elevation-2 p-6 mb-4 border border-slate-200 dark:border-slate-700 animate-fade-in-up">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Search className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              Filter & Search
            </h3>

            {/* Search Box */}
            <div className="mb-5">
              <div className="relative group">
                <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400 dark:text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                <input
                  type="text"
                  placeholder="Search by code, name, category, or sub-category..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-700/50 border-2 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-300 dark:focus:border-blue-700 transition-all shadow-sm font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest mb-2 text-blue-700 dark:text-blue-400">
                  Category
                </label>
                <select
                  value={filterCategoryId}
                  onChange={(e) => {
                    setFilterCategoryId(e.target.value);
                    setFilterSubCategoryId("");
                    setCurrentPage(1);
                  }}
                  className="w-full px-4 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-700/50 border-2 border-slate-200 dark:border-slate-600 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-300 dark:focus:border-blue-700 transition-all font-medium shadow-sm hover:border-slate-300 dark:hover:border-slate-500"
                >
                  <option value="">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest mb-2 text-blue-700 dark:text-blue-400">
                  Sub Category
                </label>
                <select
                  value={filterSubCategoryId}
                  onChange={(e) => {
                    setFilterSubCategoryId(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-4 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-700/50 border-2 border-slate-200 dark:border-slate-600 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-300 dark:focus:border-blue-700 transition-all font-medium shadow-sm hover:border-slate-300 dark:hover:border-slate-500"
                >
                  <option value="">All Sub Categories</option>
                  {getFilteredSubCategories().map((subcat) => (
                    <option key={subcat._id} value={subcat._id}>
                      {subcat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest mb-2 text-blue-700 dark:text-blue-400">
                  Vendor
                </label>
                <select
                  value={filterVendorId}
                  onChange={(e) => {
                    setFilterVendorId(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-4 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-700/50 border-2 border-slate-200 dark:border-slate-600 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-300 dark:focus:border-blue-700 transition-all font-medium shadow-sm hover:border-slate-300 dark:hover:border-slate-500"
                >
                  <option value="">All Vendors</option>
                  {vendors.map((vendor) => (
                    <option key={vendor._id} value={vendor._id}>
                      {vendor.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Raw Materials List Header */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-elevation-2 p-5 mb-4 border border-slate-200 dark:border-slate-700 animate-fade-in-up">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
                  <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  Raw Materials List
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Showing{" "}
                  <span className="font-bold text-slate-900 dark:text-white">
                    {filteredRawMaterials.length}
                  </span>{" "}
                  material{filteredRawMaterials.length !== 1 ? "s" : ""}
                </p>
              </div>
              <div className="hidden sm:flex items-center gap-2 px-4 py-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800/50">
                <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-bold text-blue-700 dark:text-blue-300">
                  {materialsWithPrices} with prices
                </span>
              </div>
            </div>
          </div>

          {/* Raw Materials Table */}
          {/* Raw Materials Table - Clean Vendor Style */}
          <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
            {paginatedRawMaterials.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-6">
                <Package className="w-14 h-14 text-gray-300 mb-3" />
                <p className="font-bold text-gray-900 text-base">No raw materials yet</p>
                <p className="text-sm text-gray-500 mt-1">Create your first raw material to get started</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  {/* Table Header */}
                  <thead className="bg-gradient-to-r from-blue-600 to-blue-700 text-white sticky top-0">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">Code</th>
                      <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">Name</th>
                      <th className="hidden sm:table-cell px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">Category</th>
                      <th className="hidden lg:table-cell px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">Sub Category</th>
                      <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">Unit</th>
                      <th className="hidden md:table-cell px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">Last Price</th>
                      <th className="hidden lg:table-cell px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">Last Purchase</th>
                      <th className="px-6 py-4 text-center text-sm font-bold uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>

                  {/* Table Body */}
                  <tbody className="divide-y divide-gray-200">
                    {paginatedRawMaterials.map((rm, idx) => (
                      <tr
                        key={rm._id}
                        className={`hover:bg-blue-50 transition-colors duration-200 ${
                          idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                        } cursor-pointer group`}
                        onClick={() => navigate(`/raw-materials/${rm._id}`)}
                      >
                        {/* Code */}
                        <td className="px-6 py-4">
                          <span className="text-sm font-bold text-gray-900 whitespace-nowrap">
                            {rm.code}
                          </span>
                        </td>

                        {/* Name */}
                        <td className="px-6 py-4">
                          <div className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors truncate capitalize-each-word max-w-sm">
                            {rm.name}
                          </div>
                        </td>

                        {/* Category */}
                        <td className="hidden sm:table-cell px-6 py-4">
                          <span className="text-sm font-semibold text-gray-700 whitespace-nowrap">
                            {rm.categoryName}
                          </span>
                        </td>

                        {/* Sub Category */}
                        <td className="hidden lg:table-cell px-6 py-4">
                          <span className="text-sm font-semibold text-gray-700 whitespace-nowrap">
                            {rm.subCategoryName || "—"}
                          </span>
                        </td>

                        {/* Unit */}
                        <td className="px-6 py-4">
                          {rm.unitName ? (
                            <span className="text-sm font-semibold text-gray-700 whitespace-nowrap">
                              {rm.unitName}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-sm">—</span>
                          )}
                        </td>

                        {/* Last Price */}
                        <td className="hidden md:table-cell px-6 py-4">
                          {rm.lastAddedPrice ? (
                            <span className="text-sm font-semibold text-emerald-700 whitespace-nowrap">
                              ₹{rm.lastAddedPrice.toFixed(2)}/{formatUnit(rm.unitName)}
                            </span>
                          ) : (
                            <span className="text-sm font-semibold text-orange-600 whitespace-nowrap">
                              Pending
                            </span>
                          )}
                        </td>

                        {/* Last Purchase */}
                        <td className="hidden lg:table-cell px-6 py-4">
                          {rm.lastPriceDate ? (
                            <span className="font-semibold text-gray-700 text-xs">
                              {new Date(rm.lastPriceDate).toLocaleDateString("en-IN")}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-sm">—</span>
                          )}
                        </td>

                        {/* Action */}
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewRMPriceHistory(rm);
                              }}
                              className="inline-flex items-center justify-center p-2 rounded-lg bg-blue-100 hover:bg-blue-600 text-blue-600 hover:text-white transition-all active:scale-95"
                              title="View price history"
                            >
                              <History className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls */}
            <div className="mt-6 flex items-center justify-between flex-wrap gap-4 px-6 py-4">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-700">
                  Show:
                </span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => handleItemsPerPageChange(e.target.value)}
                  className="px-3 py-2 rounded-lg bg-white border border-gray-300 text-sm text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all hover:border-blue-400"
                >
                  <option value="10">10</option>
                  <option value="20">20</option>
                  <option value="30">30</option>
                </select>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-xs font-medium text-gray-600">
                  <span className="font-semibold text-blue-600">
                    {startIndex + 1}–{Math.min(endIndex, filteredRawMaterials.length)}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-gray-900">
                    {filteredRawMaterials.length}
                  </span>
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePreviousPage}
                    disabled={currentPage === 1}
                    className="inline-flex items-center justify-center p-2 rounded-lg border border-blue-300 text-blue-600 hover:bg-blue-100 disabled:opacity-40 disabled:cursor-not-allowed disabled:border-gray-300 disabled:text-gray-400 transition-all hover:border-blue-400"
                    title="Previous Page"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-medium text-gray-700 min-w-[70px] text-center">
                    <span className="font-bold text-blue-600">{currentPage}</span>/<span className="font-bold text-gray-900">{totalPages || 1}</span>
                  </span>
                  <button
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages || totalPages === 0}
                    className="inline-flex items-center justify-center p-2 rounded-lg border border-blue-300 text-blue-600 hover:bg-blue-100 disabled:opacity-40 disabled:cursor-not-allowed disabled:border-gray-300 disabled:text-gray-400 transition-all hover:border-blue-400"
                    title="Next Page"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Price History Modal */}
        {showPriceHistoryModal && selectedRMForHistory && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-md animate-fade-in-up">
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-elevation-24 max-w-4xl w-full max-h-[90vh] overflow-hidden border border-slate-200/50 dark:border-slate-700/50 animate-scale-in">
              <div className="sticky top-0 bg-gradient-to-r from-blue-50 via-white to-cyan-50 dark:from-slate-800 dark:via-slate-800 dark:to-slate-800 border-b border-slate-200 dark:border-slate-700 p-6 flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                    Price History - {selectedRMForHistory.name}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    Code: {selectedRMForHistory.code}
                  </p>
                </div>
                <button
                  onClick={() => setShowPriceHistoryModal(false)}
                  className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 p-2 rounded-lg transition-colors hover:scale-110 transform"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
                {rmPriceHistory.length === 0 ? (
                  <div className="p-8 text-center text-slate-600 dark:text-slate-400">
                    No price history found for this raw material
                  </div>
                ) : (
                  <div className="p-6 space-y-4">
                    {rmPriceHistory.map((history, index) => (
                      <div
                        key={history._id || index}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          history.isPriceChange
                            ? "border-orange-300 dark:border-orange-700/50 bg-orange-50 dark:bg-orange-900/20"
                            : "border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-700/30"
                        }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="font-bold text-slate-900 dark:text-white">
                                {history.vendorName}
                              </span>
                              {history.isPriceChange && (
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-200 dark:bg-orange-900/50 text-orange-800 dark:text-orange-200 rounded text-xs font-semibold">
                                  <TrendingUp size={14} />
                                  Price Change
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              Added on {formatDate(history.addedDate)} by{" "}
                              <span className="font-semibold">
                                {history.createdBy}
                              </span>
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div className="bg-white/60 dark:bg-slate-800/60 p-3 rounded">
                            <p className="text-xs text-slate-600 dark:text-slate-400 uppercase font-semibold mb-1">
                              Price
                            </p>
                            <p className="text-lg font-bold text-slate-900 dark:text-white">
                              ₹{history.price.toFixed(2)}
                            </p>
                          </div>
                          <div className="bg-white/60 dark:bg-slate-800/60 p-3 rounded">
                            <p className="text-xs text-slate-600 dark:text-slate-400 uppercase font-semibold mb-1">
                              Quantity
                            </p>
                            <p className="text-lg font-bold text-slate-900 dark:text-white">
                              {history.quantity} {history.unitName || ""}
                            </p>
                          </div>

                          {history.isPriceChange && history.previousPrice && (
                            <>
                              <div className="bg-white/60 dark:bg-slate-800/60 p-3 rounded">
                                <p className="text-xs text-slate-600 dark:text-slate-400 uppercase font-semibold mb-1">
                                  Previous Price
                                </p>
                                <p className="text-lg font-bold text-slate-900 dark:text-white">
                                  ₹{history.previousPrice.toFixed(2)}
                                </p>
                              </div>
                              <div className="bg-white/60 dark:bg-slate-800/60 p-3 rounded">
                                <p className="text-xs text-slate-600 dark:text-slate-400 uppercase font-semibold mb-1">
                                  Increase
                                </p>
                                <p className="text-lg font-bold text-orange-600 dark:text-orange-400">
                                  ₹
                                  {(
                                    history.price - history.previousPrice
                                  ).toFixed(2)}
                                </p>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Upload Errors Modal */}
        {showUploadErrorsModal && uploadErrors.length > 0 && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-md animate-fade-in-up">
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-elevation-24 max-w-4xl w-full max-h-[90vh] overflow-hidden border border-slate-200/50 dark:border-slate-700/50 animate-scale-in">
              <div className="sticky top-0 bg-gradient-to-r from-red-50 via-white to-orange-50 dark:from-slate-800 dark:via-slate-800 dark:to-slate-800 border-b border-slate-200 dark:border-slate-700 p-6 flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                    Skipped Rows ({uploadErrors.length})
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    These rows were not imported. Please check the errors below
                    and fix your data.
                  </p>
                </div>
                <button
                  onClick={() => setShowUploadErrorsModal(false)}
                  className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 p-2 rounded-lg transition-colors hover:scale-110 transform"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
                <div className="p-6 space-y-3">
                  {uploadErrors.map((error, index) => (
                    <div
                      key={index}
                      className="p-4 rounded-lg border-2 border-red-300 dark:border-red-700/50 bg-red-50 dark:bg-red-900/20"
                    >
                      <div className="flex items-start gap-3 mb-2">
                        <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="font-bold text-red-900 dark:text-red-200">
                            Row {error.row}
                          </p>
                          <p className="text-sm text-red-800 dark:text-red-300 mt-1">
                            {error.reason}
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 p-3 bg-white/60 dark:bg-slate-900/30 rounded border border-red-200/50 dark:border-red-800/30">
                        <p className="text-xs font-mono text-slate-700 dark:text-slate-300">
                          {Object.entries(error.data)
                            .map(([key, value]) => `${key}: ${value}`)
                            .join(" | ")}
                        </p>
                      </div>
                      {error.error && (
                        <p className="text-xs text-red-700 dark:text-red-400 mt-2">
                          Error: {error.error}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Clear All Confirmation Modal */}
        {showClearConfirmModal && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-md w-full border border-slate-200/50 dark:border-slate-700/50">
              <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3 mb-2">
                  <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                    Confirm Clear All
                  </h3>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                  This will delete ALL raw materials. This action cannot be
                  undone.
                </p>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Enter password to confirm
                  </label>
                  <input
                    type="password"
                    value={clearPassword}
                    onChange={(e) => setClearPassword(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        confirmClearAllRawMaterials();
                      }
                    }}
                    placeholder="Enter password"
                    className="w-full px-4 py-2.5 rounded-lg bg-white dark:bg-slate-700 border-2 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
                    autoFocus
                  />
                </div>

                <div className="flex items-center gap-3 pt-4">
                  <button
                    onClick={() => {
                      setShowClearConfirmModal(false);
                      setClearPassword("");
                    }}
                    className="flex-1 px-4 py-2.5 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white font-semibold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmClearAllRawMaterials}
                    disabled={!clearPassword}
                    className="flex-1 px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 disabled:bg-slate-400 disabled:cursor-not-allowed text-white font-semibold transition-colors"
                  >
                    Clear All
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    </Layout>
  );
}
