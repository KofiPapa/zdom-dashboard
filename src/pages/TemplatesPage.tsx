import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { HiOutlineTemplate, HiOutlinePlus, HiOutlineTrash, HiOutlinePencil } from "react-icons/hi";
import { formatDistanceToNow } from "date-fns";
import PageHeader from "../components/common/PageHeader";
import EmptyState from "../components/common/EmptyState";
import ConfirmDialog from "../components/common/ConfirmDialog";
import { useAuth } from "../contexts/AuthContext";
import { subscribeToCollection } from "../lib/api";
import { deleteDocument } from "../lib/api";
import { where } from "firebase/firestore";
import type { Template } from "@shared/types/firestore-schema";

export default function TemplatesPage() {
  const { profile } = useAuth();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (!profile?.organizationId) return;
    const unsubscribe = subscribeToCollection<Template>(
      "templates",
      [where("organizationId", "==", profile.organizationId)],
      (data) => { setTemplates(data); setLoading(false); }
    );
    return unsubscribe;
  }, [profile?.organizationId]);

  const handleDelete = async () => {
    if (!deleteId) return;
    await deleteDocument("templates", deleteId);
    setDeleteId(null);
  };

  return (
    <div>
      <PageHeader
        title="Templates"
        description="Create and manage content templates"
        action={
          <Link
            to="/templates/editor"
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark transition-colors"
          >
            <HiOutlinePlus className="w-4 h-4" />
            Create Template
          </Link>
        }
      />

      {templates.length === 0 ? (
        <div className="bg-white rounded-lg border border-slate-200">
          <EmptyState
            icon={<HiOutlineTemplate className="w-12 h-12" />}
            title="No templates yet"
            description="Create content templates with zones for media, text, and widgets."
            action={
              <Link
                to="/templates/editor"
                className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark transition-colors"
              >
                Create Template
              </Link>
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {templates.map((template) => (
            <div
              key={template.id}
              className="bg-white rounded-lg border border-slate-200 overflow-hidden hover:shadow-md transition-shadow group"
            >
              {/* Thumbnail */}
              <div className="aspect-video bg-slate-100 relative">
                {template.thumbnail ? (
                  <img src={template.thumbnail} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <HiOutlineTemplate className="w-8 h-8 text-slate-300" />
                  </div>
                )}
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Link
                    to={`/templates/editor/${template.id}`}
                    className="p-2 bg-white rounded-lg text-slate-700 hover:bg-orange-50 hover:text-primary"
                  >
                    <HiOutlinePencil className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => setDeleteId(template.id)}
                    className="p-2 bg-white rounded-lg text-slate-700 hover:bg-red-50 hover:text-red-600"
                  >
                    <HiOutlineTrash className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Info */}
              <div className="p-3">
                <h3 className="text-sm font-medium text-slate-900 truncate">{template.name}</h3>
                <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                  <span className="capitalize">{template.orientation}</span>
                  <span className="text-slate-300">|</span>
                  <span>{template.resolution.width}x{template.resolution.height}</span>
                  <span className="text-slate-300">|</span>
                  <span>{template.zones?.length || 0} zones</span>
                </div>
                {template.createdAt && (
                  <p className="text-[10px] text-slate-400 mt-1">
                    {formatDistanceToNow(template.createdAt.toDate(), { addSuffix: true })}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteId}
        title="Delete Template"
        message="Are you sure you want to delete this template? This action cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
