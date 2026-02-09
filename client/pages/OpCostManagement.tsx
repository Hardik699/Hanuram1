import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import {
  Plus,
  Edit2,
  Trash2,
  Calculator,
  Package,
  History,
} from "lucide-react";
import { toast } from "sonner";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ProfessionalPage, EmptyState } from "@/components/ProfessionalPage";
import {
  ProfessionalForm,
  FormGroup,
  FormActions,
} from "@/components/ProfessionalForm";
import { DataTable } from "@/components/DataTable";
import { cn } from "@/lib/utils";

interface OpCostData {
  _id?: string;
  month: string;
  year: number;
  costs: {
    rent: number;
    fixedSalary: number;
    electricity: number;
    marketing: number;
    logistics: number;
    insurance: number;
    vehicleInstallments: number;
    travelCost: number;
    miscellaneous: number;
    otherCosts: number;
    equipmentMaintenance: number;
    internetCharges: number;
    telephoneBills: number;
  };
  production: {
    mithaiProduction: number;
    namkeenProduction: number;
  };
  autoOpCostPerKg: number;
  manualOpCostPerKg?: number;
  useManualOpCost: boolean;
  createdAt: string;
  updatedAt: string;
}

const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export default function OpCostManagement() {
  const [opCosts, setOpCosts] = useState<OpCostData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    month: new Date().toLocaleString("default", { month: "long" }),
    year: new Date().getFullYear(),
    costs: {
      rent: 0,
      fixedSalary: 0,
      electricity: 0,
      marketing: 0,
      logistics: 0,
      insurance: 0,
      vehicleInstallments: 0,
      travelCost: 0,
      miscellaneous: 0,
      otherCosts: 0,
      equipmentMaintenance: 0,
      internetCharges: 0,
      telephoneBills: 0,
    },
    production: {
      mithaiProduction: 0,
      namkeenProduction: 0,
    },
  });

  useEffect(() => {
    fetchOpCosts();
  }, []);

  const fetchOpCosts = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/op-costs");
      if (!response.ok) throw new Error("Failed to fetch");
      const data = await response.json();
      if (data.success) {
        setOpCosts(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching OP costs:", error);
      toast.error("Failed to load OP costs");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;

    if (name.startsWith("cost_")) {
      const costKey = name.replace("cost_", "");
      setFormData((prev) => ({
        ...prev,
        costs: {
          ...prev.costs,
          [costKey]: value === "" ? 0 : parseFloat(value),
        },
      }));
    } else if (name.startsWith("prod_")) {
      const prodKey = name.replace("prod_", "");
      setFormData((prev) => ({
        ...prev,
        production: {
          ...prev.production,
          [prodKey]: value === "" ? 0 : parseFloat(value),
        },
      }));
    } else if (name === "month") {
      setFormData((prev) => ({ ...prev, month: value }));
    } else if (name === "year") {
      setFormData((prev) => ({ ...prev, year: parseInt(value) }));
    }
  };

  const handleSave = async () => {
    try {
      const payload = {
        ...formData,
      };

      const response = await fetch(
        editingId ? `/api/op-costs/${editingId}` : "/api/op-costs",
        {
          method: editingId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      const data = await response.json();
      if (response.ok && data.success) {
        toast.success(editingId ? "OP Cost updated" : "OP Cost created");
        setShowForm(false);
        setEditingId(null);
        setFormData({
          month: new Date().toLocaleString("default", { month: "long" }),
          year: new Date().getFullYear(),
          costs: {
            rent: 0,
            fixedSalary: 0,
            electricity: 0,
            marketing: 0,
            logistics: 0,
            insurance: 0,
            vehicleInstallments: 0,
            travelCost: 0,
            miscellaneous: 0,
            otherCosts: 0,
            equipmentMaintenance: 0,
            internetCharges: 0,
            telephoneBills: 0,
          },
          production: {
            mithaiProduction: 0,
            namkeenProduction: 0,
          },
        });
        fetchOpCosts();
      } else {
        toast.error(
          data.message ||
            `Failed to ${editingId ? "update" : "create"} OP cost`,
        );
      }
    } catch (error) {
      console.error("Error saving:", error);
      toast.error("Failed to save OP cost");
    }
  };

  const handleEdit = (opCost: OpCostData) => {
    setFormData({
      month: opCost.month,
      year: opCost.year,
      costs: opCost.costs,
      production: opCost.production,
    });
    setEditingId(opCost._id || null);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this OP cost entry?")) return;

    try {
      const response = await fetch(`/api/op-costs/${id}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (response.ok && data.success) {
        toast.success("Deleted successfully");
        fetchOpCosts();
      } else {
        toast.error(data.message || "Failed to delete");
      }
    } catch (error) {
      console.error("Error deleting:", error);
      toast.error("Failed to delete");
    }
  };

  const calculateTotalCost = () => {
    return Object.values(formData.costs).reduce((sum, val) => sum + val, 0);
  };

  const calculateTotalKgs = () => {
    return (
      formData.production.mithaiProduction +
      formData.production.namkeenProduction
    );
  };

  const calculateOpCostPerKg = () => {
    const totalKgs = calculateTotalKgs();
    if (totalKgs === 0) return 0;
    return calculateTotalCost() / totalKgs;
  };

  return (
    <Layout>
      <ProfessionalPage
        title="Operational Cost (OP Cost)"
        description="Manage and track monthly operational costs and production metrics."
        headerAction={
          <button
            onClick={() => {
              if (showForm) {
                setShowForm(false);
                setEditingId(null);
              } else {
                setEditingId(null);
                setFormData({
                  month: new Date().toLocaleString("default", {
                    month: "long",
                  }),
                  year: new Date().getFullYear(),
                  costs: {
                    rent: 0,
                    fixedSalary: 0,
                    electricity: 0,
                    marketing: 0,
                    logistics: 0,
                    insurance: 0,
                    vehicleInstallments: 0,
                    travelCost: 0,
                    miscellaneous: 0,
                    otherCosts: 0,
                    equipmentMaintenance: 0,
                    internetCharges: 0,
                    telephoneBills: 0,
                  },
                  production: {
                    mithaiProduction: 0,
                    namkeenProduction: 0,
                  },
                });
                setShowForm(true);
              }
            }}
            className={showForm ? "prof-btn-secondary" : "prof-btn-primary"}
          >
            {showForm ? (
              <>
                <History size={16} />
                <span>View All Entries</span>
              </>
            ) : (
              <>
                <Plus size={16} />
                <span>Add OP Cost</span>
              </>
            )}
          </button>
        }
      >
        {showForm ? (
          <div className="max-w-4xl mx-auto">
            <ProfessionalForm
              title={editingId ? "Update OP Cost Entry" : "New OP Cost Entry"}
              onSubmit={handleSave}
              onCancel={() => {
                setShowForm(false);
                setEditingId(null);
              }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormGroup label="Month">
                  <select
                    name="month"
                    value={formData.month}
                    onChange={handleInputChange}
                    className="prof-form-select"
                  >
                    {months.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </FormGroup>
                <FormGroup label="Year">
                  <input
                    type="number"
                    name="year"
                    value={formData.year}
                    onChange={handleInputChange}
                    className="prof-form-input"
                    min="2020"
                    max={new Date().getFullYear() + 1}
                  />
                </FormGroup>
              </div>

              <div className="mt-8">
                <h3 className="text-lg font-bold text-blue-700 dark:text-blue-400 mb-4 flex items-center gap-2">
                  <Calculator size={20} />
                  Monthly Operating Costs
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormGroup label="Rent (₹)">
                    <input
                      type="number"
                      name="cost_rent"
                      value={formData.costs.rent || ""}
                      onChange={handleInputChange}
                      placeholder="0"
                      className="prof-form-input"
                    />
                  </FormGroup>
                  <FormGroup label="Fixed Salary (₹)">
                    <input
                      type="number"
                      name="cost_fixedSalary"
                      value={formData.costs.fixedSalary || ""}
                      onChange={handleInputChange}
                      placeholder="0"
                      className="prof-form-input"
                    />
                  </FormGroup>
                  <FormGroup label="Electricity (₹)">
                    <input
                      type="number"
                      name="cost_electricity"
                      value={formData.costs.electricity || ""}
                      onChange={handleInputChange}
                      placeholder="0"
                      className="prof-form-input"
                    />
                  </FormGroup>
                  <FormGroup label="Marketing (₹)">
                    <input
                      type="number"
                      name="cost_marketing"
                      value={formData.costs.marketing || ""}
                      onChange={handleInputChange}
                      placeholder="0"
                      className="prof-form-input"
                    />
                  </FormGroup>
                  <FormGroup label="Logistics (₹)">
                    <input
                      type="number"
                      name="cost_logistics"
                      value={formData.costs.logistics || ""}
                      onChange={handleInputChange}
                      placeholder="0"
                      className="prof-form-input"
                    />
                  </FormGroup>
                  <FormGroup label="Insurance (₹)">
                    <input
                      type="number"
                      name="cost_insurance"
                      value={formData.costs.insurance || ""}
                      onChange={handleInputChange}
                      placeholder="0"
                      className="prof-form-input"
                    />
                  </FormGroup>
                  <FormGroup label="Vehicle EMI (₹)">
                    <input
                      type="number"
                      name="cost_vehicleInstallments"
                      value={formData.costs.vehicleInstallments || ""}
                      onChange={handleInputChange}
                      placeholder="0"
                      className="prof-form-input"
                    />
                  </FormGroup>
                  <FormGroup label="Travel (₹)">
                    <input
                      type="number"
                      name="cost_travelCost"
                      value={formData.costs.travelCost || ""}
                      onChange={handleInputChange}
                      placeholder="0"
                      className="prof-form-input"
                    />
                  </FormGroup>
                  <FormGroup label="Maintenance (₹)">
                    <input
                      type="number"
                      name="cost_equipmentMaintenance"
                      value={formData.costs.equipmentMaintenance || ""}
                      onChange={handleInputChange}
                      placeholder="0"
                      className="prof-form-input"
                    />
                  </FormGroup>
                  <FormGroup label="Internet (₹)">
                    <input
                      type="number"
                      name="cost_internetCharges"
                      value={formData.costs.internetCharges || ""}
                      onChange={handleInputChange}
                      placeholder="0"
                      className="prof-form-input"
                    />
                  </FormGroup>
                  <FormGroup label="Telephone (₹)">
                    <input
                      type="number"
                      name="cost_telephoneBills"
                      value={formData.costs.telephoneBills || ""}
                      onChange={handleInputChange}
                      placeholder="0"
                      className="prof-form-input"
                    />
                  </FormGroup>
                  <FormGroup label="Miscellaneous (₹)">
                    <input
                      type="number"
                      name="cost_miscellaneous"
                      value={formData.costs.miscellaneous || ""}
                      onChange={handleInputChange}
                      placeholder="0"
                      className="prof-form-input"
                    />
                  </FormGroup>
                </div>
              </div>

              <div className="mt-8">
                <h3 className="text-lg font-bold text-blue-700 dark:text-blue-400 mb-4 flex items-center gap-2">
                  <Package size={20} />
                  Monthly Production
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormGroup label="Mithai Production (Kg)">
                    <input
                      type="number"
                      name="prod_mithaiProduction"
                      value={formData.production.mithaiProduction || ""}
                      onChange={handleInputChange}
                      placeholder="0"
                      className="prof-form-input"
                    />
                  </FormGroup>
                  <FormGroup label="Namkeen Production (Kg)">
                    <input
                      type="number"
                      name="prod_namkeenProduction"
                      value={formData.production.namkeenProduction || ""}
                      onChange={handleInputChange}
                      placeholder="0"
                      className="prof-form-input"
                    />
                  </FormGroup>
                </div>
              </div>

              {/* Summary Stats */}
              <div className="mt-8 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl border-2 border-blue-100 dark:border-blue-800/50">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <p className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider mb-1">
                      Total Cost
                    </p>
                    <p className="text-2xl font-black text-slate-900 dark:text-white">
                      ₹
                      {calculateTotalCost().toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                  <div className="text-center border-x-2 border-blue-100 dark:border-blue-800/50 px-6">
                    <p className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider mb-1">
                      Total Production
                    </p>
                    <p className="text-2xl font-black text-slate-900 dark:text-white">
                      {calculateTotalKgs().toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                      })}{" "}
                      Kg
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider mb-1">
                      Cost Per Kg
                    </p>
                    <p className="text-2xl font-black text-blue-600 dark:text-blue-400">
                      ₹
                      {calculateOpCostPerKg().toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                </div>
              </div>

              <FormActions>
                <button type="submit" className="prof-btn-primary">
                  {editingId ? "Update Entry" : "Save Entry"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                  }}
                  className="prof-btn-secondary"
                >
                  Cancel
                </button>
              </FormActions>
            </ProfessionalForm>
          </div>
        ) : (
          <div className="space-y-6">
            {opCosts.length === 0 ? (
              <EmptyState
                icon={<Calculator size={48} />}
                title="No OP Cost Records"
                description="Start by adding your first monthly operational cost entry."
                action={
                  <button
                    onClick={() => setShowForm(true)}
                    className="prof-btn-primary"
                  >
                    Add First Entry
                  </button>
                }
              />
            ) : (
              <div className="prof-section">
                <DataTable
                  data={opCosts}
                  columns={[
                    {
                      key: "month",
                      label: "Period",
                      render: (_, row) => (
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900 dark:text-white">
                            {row.month} {row.year}
                          </span>
                          <span className="text-xs text-slate-500">
                            {new Date(row.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      ),
                    },
                    {
                      key: "costs",
                      label: "Total Cost",
                      render: (costs) => (
                        <span className="font-bold">
                          ₹
                          {Object.values(costs as any)
                            .reduce((a: any, b: any) => a + b, 0)
                            .toLocaleString("en-IN", {
                              minimumFractionDigits: 2,
                            })}
                        </span>
                      ),
                    },
                    {
                      key: "production",
                      label: "Production",
                      render: (prod) => (
                        <span className="prof-badge-blue">
                          {(
                            (prod as any).mithaiProduction +
                            (prod as any).namkeenProduction
                          ).toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                          })}{" "}
                          Kg
                        </span>
                      ),
                    },
                    {
                      key: "autoOpCostPerKg",
                      label: "Cost / Kg",
                      render: (val, row) => (
                        <div className="flex flex-col">
                          <span className="font-black text-blue-600 dark:text-blue-400">
                            ₹
                            {val.toLocaleString("en-IN", {
                              minimumFractionDigits: 2,
                            })}
                          </span>
                          {row.useManualOpCost && (
                            <span className="text-[10px] font-bold text-orange-600 uppercase">
                              Manual Applied
                            </span>
                          )}
                        </div>
                      ),
                    },
                    {
                      key: "_id",
                      label: "Actions",
                      className: "text-right",
                      render: (_, row) => (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(row)}
                            className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-blue-600 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => row._id && handleDelete(row._id)}
                            className="p-2 hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ),
                    },
                  ]}
                />
              </div>
            )}
          </div>
        )}
      </ProfessionalPage>
    </Layout>
  );
}
