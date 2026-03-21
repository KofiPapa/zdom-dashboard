import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import toast from "react-hot-toast";
import { db } from "../../lib/firebase";
import { createDocument, updateDocument } from "../../lib/api";
import { useAuth } from "../../contexts/AuthContext";
import { useEditor } from "./hooks/useEditor";
import EditorToolbar from "./EditorToolbar";
import EditorCanvas from "./EditorCanvas";
import LeftPanel from "./LeftPanel";
import RightPanel from "./RightPanel";
import LayerPanel from "./LayerPanel";
import TemplatePreview from "./TemplatePreview";
import type { Template } from "@shared/types/firestore-schema";
import LoadingSpinner from "../common/LoadingSpinner";

export default function TemplateEditor() {
  const { templateId } = useParams<{ templateId: string }>();
  void useNavigate();
  const { profile } = useAuth();
  const [loading, setLoading] = useState(!!templateId);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [docId, setDocId] = useState(templateId || null);

  const editor = useEditor();

  // Load existing template
  useEffect(() => {
    if (!templateId) return;
    const loadTemplate = async () => {
      try {
        const docSnap = await getDoc(doc(db, "templates", templateId));
        if (docSnap.exists()) {
          const data = docSnap.data() as Template;
          editor.setName(data.name);
          editor.setOrientation(data.orientation);
          if (data.zones && data.zones.length > 0) {
            editor.setZones(data.zones);
          }
        }
      } catch (error) {
        console.error("Failed to load template:", error);
        toast.error("Failed to load template");
      } finally {
        setLoading(false);
      }
    };
    loadTemplate();
  }, [templateId]);

  const handleSave = useCallback(async () => {
    if (!profile?.organizationId) return;
    setSaving(true);

    try {
      const templateData = {
        name: editor.name,
        organizationId: profile.organizationId,
        createdBy: profile.id,
        orientation: editor.orientation,
        resolution: editor.resolution,
        thumbnail: "",
        isPublic: false,
        category: "custom" as const,
        zones: editor.zones,
      };

      if (docId) {
        await updateDocument("templates", docId, templateData);
      } else {
        const newId = await createDocument("templates", templateData);
        setDocId(newId);
        window.history.replaceState(null, "", `/templates/editor/${newId}`);
      }

      editor.markSaved();
      toast.success("Template saved");
    } catch (error) {
      console.error("Failed to save template:", error);
      toast.error("Failed to save template");
    } finally {
      setSaving(false);
    }
  }, [profile, editor.name, editor.orientation, editor.resolution, editor.zones, docId, editor.markSaved]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Delete" || e.key === "Backspace") {
        if (editor.selectedZoneId && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement)) {
          editor.removeZone(editor.selectedZoneId);
        }
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "z") {
        e.preventDefault();
        if (e.shiftKey) editor.redo();
        else editor.undo();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
      if (e.key === "Escape") {
        editor.selectZone(null);
        setShowPreview(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [editor, handleSave]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-slate-100">
      <EditorToolbar
        name={editor.name}
        orientation={editor.orientation}
        resolution={editor.resolution}
        isDirty={editor.isDirty}
        saving={saving}
        canUndo={editor.canUndo}
        canRedo={editor.canRedo}
        onNameChange={editor.setName}
        onOrientationChange={editor.setOrientation}
        onSave={handleSave}
        onPreview={() => setShowPreview(true)}
        onUndo={editor.undo}
        onRedo={editor.redo}
      />

      <div className="flex-1 flex overflow-hidden">
        <LeftPanel
          onAddZone={editor.addZone}
          onSetZones={editor.setZones}
          hasZones={editor.zones.length > 0}
        />

        <EditorCanvas
          zones={editor.zones}
          selectedZoneId={editor.selectedZoneId}
          orientation={editor.orientation}
          resolution={editor.resolution}
          onSelectZone={editor.selectZone}
          onUpdateZone={editor.updateZone}
          onUpdateZoneWithUndo={editor.updateZoneWithUndo}
        />

        <RightPanel
          zone={editor.selectedZone}
          onUpdate={editor.updateZoneWithUndo}
          onRemove={editor.removeZone}
          onDuplicate={editor.duplicateZone}
          onReorder={editor.reorderZone}
        />
      </div>

      <LayerPanel
        zones={editor.zones}
        selectedZoneId={editor.selectedZoneId}
        onSelectZone={editor.selectZone}
        onRemoveZone={editor.removeZone}
      />

      {showPreview && (
        <TemplatePreview
          zones={editor.zones}
          resolution={editor.resolution}
          orientation={editor.orientation}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  );
}
