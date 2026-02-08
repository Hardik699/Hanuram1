import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Edit2,
  Trash2,
  Users,
  TrendingUp,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  Search,
} from "lucide-react";
import { Layout } from "@/components/Layout";
import { PageHeader } from "@/components/PageHeader";
import { toast } from "sonner";
import { LoadingSpinner } from "@/components/LoadingSpinner";

interface Labour {
  _id?: string;
  id?: string;
  code: string;
  name: string;
  department: string;
  salaryPerDay: number;
  createdAt?: string;
  updatedAt?: string;
}

export default function LabourManagement() {
  const navigate = useNavigate();
  const [labour, setLabour] = useState<Labour[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Fetch labour list with retry logic
  const fetchLabour = async (retryCount = 0) => {
    setLoading(true);
    try {
      const response = await fetch("/api/labour", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (result.success && Array.isArray(result.data)) {
        setLabour(result.data);
      } else {
        throw new Error(result.message || "Failed to fetch labour");
      }
    } catch (error) {
      console.error("Error fetching labour:", error);

      // Retry logic: retry up to 3 times on failure
      if (retryCount < 3) {
        console.warn(`Retrying labour fetch (attempt ${retryCount + 1}/3)...`);
        setTimeout(() => fetchLabour(retryCount + 1), 1000 * (retryCount + 1));
      } else {
        toast.error(
          "Failed to fetch labour: " +
            (error instanceof Error ? error.message : "Unknown error"),
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      navigate("/");
      return;
    }
    fetchLabour();
  }, [navigate]);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this labour?")) {
      return;
    }

    try {
      const response = await fetch(`/api/labour/${id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Labour deleted successfully");
        fetchLabour();
      } else {
        toast.error(result.message || "Failed to delete labour");
      }
    } catch (error) {
      console.error("Error deleting labour:", error);
      toast.error("Failed to delete labour");
    }
  };

  // Filter labour
  const filteredLabour = labour.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.code && item.code.toLowerCase().includes(searchTerm.toLowerCase())) ||
      item.department.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Pagination
  const totalPages = Math.ceil(filteredLabour.length / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const paginatedLabour = filteredLabour.slice(
    startIdx,
    startIdx + itemsPerPage,
  );

  // Calculate statistics
  const totalLabour = labour.length;
  const totalDailyCost = labour.reduce((sum, l) => sum + l.salaryPerDay, 0);
  const avgSalaryPerDay =
    labour.length > 0 ? totalDailyCost / labour.length : 0;

  return (
    <Layout title="Labour Management">
      <PageHeader
        title="Labour Management"
        description="Manage factory labour and track salary costs"
        breadcrumbs={[{ label: "Labour Management" }]}
        icon={<Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />}
        actions={
          <button
            onClick={() => navigate("/labour/new")}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-2.5 px-5 rounded-xl transition-all shadow-elevation-3 hover:shadow-elevation-5 transform hover:scale-105 hover:-translate-y-0.5 whitespace-nowrap text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Labour</span>
          </button>
        }
      />

      <div className="space-y-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in-up">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-elevation-2 border border-slate-200 dark:border-slate-700 hover:shadow-elevation-4 transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-slate-600 dark:text-slate-400 text-xs font-bold uppercase tracking-widest">
                  Total Labour
                </p>
                <h3 className="text-4xl font-bold mt-3 text-slate-900 dark:text-white bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                  {totalLabour}
                </h3>
              </div>
              <div className="bg-blue-100 dark:bg-blue-900/30 p-4 rounded-xl">
                <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div className="h-1 w-full bg-blue-200 dark:bg-blue-900/30 rounded-full overflow-hidden mt-4">
              <div className="h-full w-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"></div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-elevation-2 border border-slate-200 dark:border-slate-700 hover:shadow-elevation-4 transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-slate-600 dark:text-slate-400 text-xs font-bold uppercase tracking-widest">
                  Total Daily Cost
                </p>
                <h3 className="text-4xl font-bold mt-3 text-slate-900 dark:text-white bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent">
                  ₹
                  {totalDailyCost.toLocaleString("en-IN", {
                    maximumFractionDigits: 0,
                  })}
                </h3>
              </div>
              <div className="bg-green-100 dark:bg-green-900/30 p-4 rounded-xl">
                <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div className="h-1 w-full bg-green-200 dark:bg-green-900/30 rounded-full overflow-hidden mt-4">
              <div className="h-full w-full bg-gradient-to-r from-green-500 to-green-600 rounded-full"></div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-elevation-2 border border-slate-200 dark:border-slate-700 hover:shadow-elevation-4 transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-slate-600 dark:text-slate-400 text-xs font-bold uppercase tracking-widest">
                  Avg Salary/Day
                </p>
                <h3 className="text-4xl font-bold mt-3 text-slate-900 dark:text-white bg-gradient-to-r from-amber-600 to-amber-700 bg-clip-text text-transparent">
                  ₹
                  {avgSalaryPerDay.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </h3>
              </div>
              <div className="bg-amber-100 dark:bg-amber-900/30 p-4 rounded-xl">
                <TrendingUp className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
            <div className="h-1 w-full bg-amber-200 dark:bg-amber-900/30 rounded-full overflow-hidden mt-4">
              <div className="h-full w-full bg-gradient-to-r from-amber-500 to-amber-600 rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Search Section */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-elevation-2 p-6 mb-4 border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Search className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Search Labour
          </h3>
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest mb-2 text-blue-700 dark:text-blue-400">
              Search by Name, Code, or Department
            </label>
            <div className="relative">
              <Search className="absolute left-4 top-3.5 w-5 h-5 text-blue-500 dark:text-blue-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search labour..."
                className="w-full pl-12 pr-4 py-3 rounded-lg bg-slate-50 dark:bg-slate-700/50 border-2 border-blue-200 dark:border-blue-900/50 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-300 dark:focus:border-blue-700 transition-all shadow-sm font-medium"
              />
            </div>
          </div>
        </div>

        {/* Labour Table Header */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-elevation-2 p-5 mb-4 border border-slate-200 dark:border-slate-700 animate-fade-in-up">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                Labour List
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Showing{" "}
                <span className="font-bold text-slate-900 dark:text-white">
                  {filteredLabour.length}
                </span>{" "}
                labour record{filteredLabour.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        </div>

        {/* Labour Table */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-elevation-3 border border-slate-200 dark:border-slate-700 overflow-hidden animate-fade-in-up">
          {loading ? (
            <div className="p-12 text-center">
              <LoadingSpinner message="Loading labour data..." />
            </div>
          ) : labour.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                No Labour Found
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                Add your first labour record to start tracking daily costs.
              </p>
              <button
                onClick={() => navigate("/labour/new")}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-2.5 px-5 rounded-xl transition-all shadow-elevation-3 hover:shadow-elevation-5 transform hover:scale-105 hover:-translate-y-0.5"
              >
                <Plus className="w-4 h-4" />
                Add First Labour
              </button>
            </div>
          ) : (
            <>
              <div className="prof-table-responsive">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 dark:from-blue-900 dark:via-blue-900 dark:to-blue-950 border-b-2 border-blue-700 dark:border-blue-800 sticky top-0">
                    <tr>
                      <th className="prof-table-head-cell">Labour ID</th>
                      <th className="prof-table-head-cell">Name</th>
                      <th className="hidden md:table-cell prof-table-head-cell">Department</th>
                      <th className="prof-table-head-cell text-right">Salary/Day</th>
                      <th className="prof-table-head-cell text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {paginatedLabour.map((item, idx) => (
                      <tr
                        key={item._id}
                        className={`prof-table-row prof-table-row-hover transition-all ${
                          idx % 2 === 0 ? "prof-table-row-even" : ""
                        }`}
                      >
                        <td className="prof-table-cell-bold text-blue-600 dark:text-blue-400">
                          <span className="px-2.5 py-1.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-lg text-xs font-bold border border-blue-200/50 dark:border-blue-800/50">
                            {item.code}
                          </span>
                        </td>
                        <td className="prof-table-cell text-slate-900 dark:text-white font-semibold">
                          <div className="flex flex-col gap-1">
                            <span>{item.name}</span>
                            <span className="md:hidden text-xs text-slate-500 dark:text-slate-400 font-normal">
                              Dept: {item.department}
                            </span>
                          </div>
                        </td>
                        <td className="hidden md:table-cell prof-table-cell">
                          <span className="px-2.5 py-1.5 bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 rounded-lg text-xs font-bold border border-purple-200/50 dark:border-purple-800/50">
                            {item.department}
                          </span>
                        </td>
                        <td className="prof-table-cell text-green-700 dark:text-green-400 font-bold text-right">
                          ₹
                          {item.salaryPerDay.toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                        <td className="prof-table-cell text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => navigate(`/labour/${item._id}/edit`)}
                              className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors transform hover:scale-110"
                              title="Edit labour"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(item._id || "")}
                              className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors transform hover:scale-110"
                              title="Delete labour"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              <div className="px-6 py-5 border-t-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-6">
                  <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                    <span className="font-bold text-blue-600 dark:text-blue-400">
                      {startIdx + 1}-{Math.min(startIdx + itemsPerPage, filteredLabour.length)}
                    </span>{" "}
                    of{" "}
                    <span className="font-bold text-slate-900 dark:text-slate-200">
                      {filteredLabour.length}
                    </span>
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="inline-flex items-center justify-center p-2.5 rounded-lg border-2 border-blue-300 dark:border-blue-900/50 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 disabled:opacity-40 disabled:cursor-not-allowed disabled:border-slate-300 disabled:text-slate-400 transition-all hover:border-blue-500 dark:hover:border-blue-800"
                    title="Previous Page"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-sm font-semibold text-slate-600 dark:text-slate-400 min-w-[100px] text-center">
                    Page{" "}
                    <span className="font-bold text-blue-600 dark:text-blue-400">
                      {currentPage}
                    </span>{" "}
                    of{" "}
                    <span className="font-bold text-slate-900 dark:text-slate-200">
                      {totalPages || 1}
                    </span>
                  </span>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages || totalPages === 0}
                    className="inline-flex items-center justify-center p-2.5 rounded-lg border-2 border-blue-300 dark:border-blue-900/50 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 disabled:opacity-40 disabled:cursor-not-allowed disabled:border-slate-300 disabled:text-slate-400 transition-all hover:border-blue-500 dark:hover:border-blue-800"
                    title="Next Page"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}
