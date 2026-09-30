import React, { useState, useEffect } from 'react'
import { Category } from '../vite-env'

interface CategoryModalProps {
  isOpen: boolean
  onClose: () => void
  onCategoriesChanged: () => void
}

export const CategoryModal: React.FC<CategoryModalProps> = ({
  isOpen,
  onClose,
  onCategoriesChanged,
}) => {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [newCatName, setNewCatName] = useState<string>('')
  const [newCatDesc, setNewCatDesc] = useState<string>('')
  const [editingCatId, setEditingCatId] = useState<number | null>(null)
  const [editName, setEditName] = useState<string>('')
  const [editDesc, setEditDesc] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  const loadCategories = async () => {
    if (!window.electronAPI?.db?.categories) return
    try {
      setLoading(true)
      const list = await window.electronAPI.db.categories.getAll()
      setCategories(list)
    } catch (err) {
      console.error('Failed to load categories', err)
      setError('Failed to load categories from database')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      loadCategories()
      setError(null)
      setNewCatName('')
      setNewCatDesc('')
      setEditingCatId(null)
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCatName.trim()) {
      setError('Category name is required')
      return
    }

    setIsSubmitting(true)
    setError(null)
    try {
      await window.electronAPI!.db.categories.create({
        name: newCatName.trim(),
        description: newCatDesc.trim() || null,
      })
      setNewCatName('')
      setNewCatDesc('')
      await loadCategories()
      onCategoriesChanged()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Category already exists or error saving')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleStartEdit = (cat: Category) => {
    setEditingCatId(cat.id)
    setEditName(cat.name)
    setEditDesc(cat.description || '')
    setError(null)
  }

  const handleSaveEdit = async (id: number) => {
    if (!editName.trim()) {
      setError('Category name cannot be empty')
      return
    }

    try {
      await window.electronAPI!.db.categories.update(id, {
        name: editName.trim(),
        description: editDesc.trim() || null,
      })
      setEditingCatId(null)
      await loadCategories()
      onCategoriesChanged()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update category')
    }
  }

  const handleDelete = async (cat: Category) => {
    const confirmMsg =
      cat.product_count && cat.product_count > 0
        ? `"${cat.name}" has ${cat.product_count} product(s) assigned. Deleting it will unassign those products. Proceed?`
        : `Delete category "${cat.name}"?`

    if (!window.confirm(confirmMsg)) return

    try {
      await window.electronAPI!.db.categories.delete(cat.id)
      await loadCategories()
      onCategoriesChanged()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete category')
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#15181E] border border-[#262B36] rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-5 animate-scale-up select-none">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#262B36] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center text-base">
              🏷️
            </div>
            <div>
              <h3 className="text-base font-bold text-[#F3F4F6]">Manage Merchandise Categories</h3>
              <p className="text-[11px] text-[#9CA3AF]">
                Group items for billing, inventory filters, and retail valuation.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-[#1C2028] text-[#9CA3AF] hover:text-[#F3F4F6] flex items-center justify-center transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="p-2.5 bg-red-500/10 border border-red-500/25 text-red-400 text-xs font-semibold rounded-xl">
            {error}
          </div>
        )}

        {/* Add New Category Quick Form */}
        <form onSubmit={handleAddCategory} className="bg-[#0C0E12] border border-[#262B36] rounded-2xl p-3.5 space-y-2.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-500 block">
            + Add New Category
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
              type="text"
              required
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              placeholder="Category Name (e.g. Beverages)"
              className="h-9 px-3 rounded-xl bg-[#15181E] border border-[#262B36] text-xs text-[#F3F4F6] placeholder:text-[#64748B] focus:outline-none focus:border-amber-500"
            />
            <input
              type="text"
              value={newCatDesc}
              onChange={(e) => setNewCatDesc(e.target.value)}
              placeholder="Optional description"
              className="h-9 px-3 rounded-xl bg-[#15181E] border border-[#262B36] text-xs text-[#F3F4F6] placeholder:text-[#64748B] focus:outline-none focus:border-amber-500"
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="h-8 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Adding...' : 'Add Category'}
            </button>
          </div>
        </form>

        {/* Existing Categories List */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-[#9CA3AF]">
            <span className="font-semibold uppercase tracking-wider text-[10px]">
              Available Categories ({categories.length})
            </span>
          </div>

          <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
            {loading ? (
              <div className="text-center py-6 text-xs text-[#9CA3AF]">Loading categories...</div>
            ) : categories.length === 0 ? (
              <div className="text-center py-6 text-xs text-[#64748B]">No categories created yet</div>
            ) : (
              categories.map((cat) => {
                const isEditing = editingCatId === cat.id

                return (
                  <div
                    key={cat.id}
                    className="p-3 rounded-xl bg-[#1C2028] border border-[#262B36] flex items-center justify-between gap-3 text-xs"
                  >
                    {isEditing ? (
                      <div className="flex-1 flex items-center gap-2">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="h-8 px-2.5 rounded-lg bg-[#0C0E12] border border-amber-500 text-xs text-[#F3F4F6] focus:outline-none flex-1"
                        />
                        <input
                          type="text"
                          value={editDesc}
                          onChange={(e) => setEditDesc(e.target.value)}
                          placeholder="Description"
                          className="h-8 px-2.5 rounded-lg bg-[#0C0E12] border border-[#262B36] text-xs text-[#F3F4F6] focus:outline-none flex-1"
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(cat.id)}
                          className="h-8 px-2.5 rounded-lg bg-amber-500 text-black font-bold text-xs cursor-pointer"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingCatId(null)}
                          className="h-8 px-2 rounded-lg bg-[#262B36] text-[#9CA3AF] text-xs cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[#F3F4F6] truncate">{cat.name}</span>
                            <span className="px-2 py-0.5 rounded-full bg-[#0C0E12] border border-[#262B36] text-[10px] font-mono text-amber-400">
                              {cat.product_count ?? 0} items
                            </span>
                          </div>
                          {cat.description && (
                            <p className="text-[11px] text-[#9CA3AF] truncate mt-0.5">
                              {cat.description}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleStartEdit(cat)}
                            className="px-2 py-1 rounded-lg bg-[#15181E] hover:bg-[#262B36] text-[#9CA3AF] hover:text-[#F3F4F6] border border-[#262B36] text-[11px] transition-colors cursor-pointer"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(cat)}
                            className="px-2 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-[11px] transition-colors cursor-pointer"
                          >
                            Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Done Button */}
        <div className="flex justify-end pt-2 border-t border-[#262B36]">
          <button
            type="button"
            onClick={onClose}
            className="h-10 px-6 rounded-xl bg-amber-500 hover:bg-amber-400 font-bold text-xs text-black transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
