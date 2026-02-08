import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import Login from "./pages/Login";
import CreateCategory from "./pages/CreateCategory";
import CategoryDetail from "./pages/CategoryDetail";
import CreateSubCategory from "./pages/CreateSubCategory";
import SubCategoryDetail from "./pages/SubCategoryDetail";
import CreateUnit from "./pages/CreateUnit";
import UnitDetail from "./pages/UnitDetail";
import CreateVendor from "./pages/CreateVendor";
import VendorDetail from "./pages/VendorDetail";
import CreateRawMaterial from "./pages/CreateRawMaterial";
import CreateRecipe from "./pages/CreateRecipe";
import RMManagement from "./pages/RMManagement";
import RMDetail from "./pages/RMDetail";
import RMCManagement from "./pages/RMCManagement";
import RecipeDetail from "./pages/RecipeDetail";
import QuotationDetail from "./pages/QuotationDetail";
import NotFound from "./pages/NotFound";
import UserManagement from "./pages/UserManagement";
import UserDetail from "./pages/UserDetail";
import LabourManagement from "./pages/LabourManagement";
import CreateLabour from "./pages/CreateLabour";
import CostingAnalysis from "./pages/CostingAnalysis";
import OpCostManagement from "./pages/OpCostManagement";
import ProtectedRoute from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <AuthProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route
              path="/create-category"
              element={
                <ProtectedRoute requiredPermission="category_add">
                  <CreateCategory />
                </ProtectedRoute>
              }
            />
            <Route
              path="/category/:id"
              element={
                <ProtectedRoute requiredPermission="category_view">
                  <CategoryDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/create-subcategory"
              element={
                <ProtectedRoute requiredPermission="subcategory_add">
                  <CreateSubCategory />
                </ProtectedRoute>
              }
            />
            <Route
              path="/subcategory/:id"
              element={
                <ProtectedRoute requiredPermission="subcategory_view">
                  <SubCategoryDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/create-unit"
              element={
                <ProtectedRoute requiredPermission="unit_add">
                  <CreateUnit />
                </ProtectedRoute>
              }
            />
            <Route
              path="/unit/:id"
              element={
                <ProtectedRoute requiredPermission="unit_view">
                  <UnitDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/create-vendor"
              element={
                <ProtectedRoute requiredPermission="vendor_add">
                  <CreateVendor />
                </ProtectedRoute>
              }
            />
            <Route
              path="/vendor/:id"
              element={
                <ProtectedRoute requiredPermission="vendor_view">
                  <VendorDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/raw-materials"
              element={
                <ProtectedRoute requiredPermission="rm_view">
                  <RMManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/raw-materials/new"
              element={
                <ProtectedRoute requiredPermission="rm_add">
                  <CreateRawMaterial />
                </ProtectedRoute>
              }
            />
            <Route
              path="/raw-materials/:id"
              element={
                <ProtectedRoute requiredPermission="rm_view">
                  <RMDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/raw-materials/:id/edit"
              element={
                <ProtectedRoute requiredPermission="rm_edit">
                  <CreateRawMaterial />
                </ProtectedRoute>
              }
            />
            <Route
              path="/rmc"
              element={
                <ProtectedRoute requiredPermission="recipe_view">
                  <RMCManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/recipe/new"
              element={
                <ProtectedRoute requiredPermission="recipe_add">
                  <CreateRecipe />
                </ProtectedRoute>
              }
            />
            <Route
              path="/recipe/:id/edit"
              element={
                <ProtectedRoute requiredPermission="recipe_edit">
                  <CreateRecipe />
                </ProtectedRoute>
              }
            />
            <Route
              path="/recipe/:recipeId"
              element={
                <ProtectedRoute requiredPermission="recipe_view">
                  <RecipeDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/quotation/:quotationId"
              element={
                <ProtectedRoute requiredPermission="quotation_view">
                  <QuotationDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/users"
              element={
                <ProtectedRoute requiredPermission="user_manage">
                  <UserManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/users/:id"
              element={
                <ProtectedRoute requiredPermission="user_manage">
                  <UserDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/labour"
              element={
                <ProtectedRoute>
                  <LabourManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/labour/new"
              element={
                <ProtectedRoute>
                  <CreateLabour />
                </ProtectedRoute>
              }
            />
            <Route
              path="/labour/:id/edit"
              element={
                <ProtectedRoute>
                  <CreateLabour />
                </ProtectedRoute>
              }
            />
            <Route
              path="/costing-calculator"
              element={
                <ProtectedRoute>
                  <CostingAnalysis />
                </ProtectedRoute>
              }
            />
            <Route
              path="/op-cost"
              element={
                <ProtectedRoute>
                  <OpCostManagement />
                </ProtectedRoute>
              }
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </AuthProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
