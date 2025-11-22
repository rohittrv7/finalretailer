"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { InventoryItem } from "@/frontend/types/inventry";

interface CatalogModalProps {
  open: boolean;
  onClose: () => void;
  onAddToCart: (product: InventoryItem, qty: number) => void;
}

export default function CatalogModal({
  open,
}: // onClose,
// onAddToCart,
CatalogModalProps) {
  // const [searchQuery, setSearchQuery] = useState("");
  // const [category, setCategory] = useState("All");
  // const [stockFilter, setStockFilter] = useState("In stock");
  const [products, setProducts] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  // const [page, setPage] = useState(1);
  // const perPage = 9;

  useEffect(() => {
    if (open) {
      setLoading(true);
      axios
        .get("https://dummyjson.com/products")
        .then((res) => {
          const fetched = res.data.products.map((p: any) => ({
            id: p.id,
            title: p.title,
            price: p.price,
            thumbnail: p.thumbnail,
            sku: p.sku || `SKU-${p.id}`,
            stock: p.stock || Math.floor(Math.random() * 100),
            category: p.category,
          }));
          setProducts(fetched);
          setLoading(false);
        })
        .catch((err) => {
          console.error(err);
          setLoading(false);
        });
    }
  }, [open]);

  // Filters
  // const filteredProducts = products.filter((p) => {
  //   const matchesSearch =
  //     p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
  //     p.sku.toLowerCase().includes(searchQuery.toLowerCase());
  //   const matchesCategory = category === "All" || p.category === category;
  //   const matchesStock =
  //     stockFilter === "In stock"
  //       ? p.stock > 10
  //       : stockFilter === "Low stock"
  //       ? p.stock > 0 && p.stock <= 10
  //       : stockFilter === "Out of stock"
  //       ? p.stock === 0
  //       : true;
  //   return matchesSearch && matchesCategory && matchesStock;
  // });

  // const totalPages = Math.ceil(filteredProducts.length / perPage);
  // const paginated = filteredProducts.slice(
  //   (page - 1) * perPage,
  //   page * perPage
  // );

  if (!open) return null;

  return (
    <>
      {/* <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
        onClick={onClose}
      /> */}
      <div>hlo</div>
      <div>hlo</div>
      {/* <div className="fixed inset-4 md:inset-8 lg:inset-12 z-50 flex items-center justify-center">
        <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-7xl max-h-full overflow-hidden flex flex-col">
          <div className="p-6 border-b border-gray-200 dark:border-slate-700">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Package className="w-6 h-6 text-blue-600" />
                Add Items to Sale
              </h2>
              <div className="flex items-center gap-2">
                <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-xl text-sm font-medium hover:bg-gray-100 dark:hover:bg-slate-700 transition-all">
                  <Upload className="w-4 h-4" /> Import
                </button>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
              </div>
            </div>
          </div>

          <div className="p-6 border-b border-gray-200 dark:border-slate-700">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products, SKU or barcode"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-gray-400"
                />
              </div>

              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none"
                >
                  <option value="All">Category: All</option>
                  <option value="smartphones">Smartphones</option>
                  <option value="laptops">Laptops</option>
                  <option value="fragrances">Fragrances</option>
                  <option value="skincare">Skincare</option>
                </select>
              </div>

              <div className="relative">
                <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <select
                  value={stockFilter}
                  onChange={(e) => setStockFilter(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none"
                >
                  <option value="In stock">Stock: In stock</option>
                  <option value="Low stock">Low stock</option>
                  <option value="Out of stock">Out of stock</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="bg-gray-100 dark:bg-slate-700 rounded-xl h-64 animate-pulse"
                  />
                ))}
              </div>
            ) : paginated.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-16 h-16 mx-auto text-gray-300 dark:text-slate-600 mb-4" />
                <p className="text-gray-500 dark:text-gray-400">
                  No products found
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {paginated.map((product) => (
                  <div
                    key={product.id}
                    className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200 dark:border-slate-700 overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                  >
                    <img
                      src={product.thumbnail}
                      alt={product.title}
                      className="w-full h-40 object-cover bg-gray-100"
                    />
                    <div className="p-4">
                      <h3 className="font-bold text-lg text-gray-900 dark:text-white line-clamp-1">
                        {product.title}
                      </h3>
                      <p className="text-sm text-blue-600 dark:text-blue-400 font-medium mt-1">
                        SKU {product.sku}
                      </p>
                      <div className="flex justify-between items-center mt-3">
                        <span className="text-2xl font-bold text-gray-900 dark:text-white">
                          ${product.price}
                        </span>
                        <span
                          className={`text-sm font-medium ${
                            product.stock > 10
                              ? "text-green-600"
                              : product.stock > 0
                              ? "text-amber-600"
                              : "text-red-600"
                          }`}
                        >
                          Stock: {product.stock}
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          onAddToCart(product, 1);
                          // Optional: toast
                        }}
                        className="mt-4 w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all duration-200 hover:scale-105 hover:shadow-lg"
                      >
                        <Plus className="w-5 h-5" /> Add
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {totalPages > 1 && (
            <div className="p-4 border-t border-gray-200 dark:border-slate-700">
              <div className="flex justify-center items-center gap-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-slate-700 transition-all"
                >
                  Prev
                </button>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-slate-700 transition-all"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div> */}
    </>
  );
}
