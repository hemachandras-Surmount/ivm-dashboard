import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, Pencil, Check, X, Trash2, RotateCcw } from "lucide-react";

interface AdminSectionWrapperProps {
  sectionKey: string;
  defaultTitle: string;
  customTitle?: string;
  visible: boolean;
  isAdmin: boolean;
  onToggleVisibility: (sectionKey: string, visible: boolean) => void;
  onUpdateTitle: (sectionKey: string, title: string) => void;
  children: React.ReactNode;
  showTitle?: boolean;
}

export function AdminSectionWrapper({
  sectionKey,
  defaultTitle,
  customTitle,
  visible,
  isAdmin,
  onToggleVisibility,
  onUpdateTitle,
  children,
  showTitle = false,
}: AdminSectionWrapperProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState(customTitle || defaultTitle);

  const displayTitle = customTitle || defaultTitle;

  if (!isAdmin && !visible) {
    return null;
  }

  const handleSaveTitle = () => {
    onUpdateTitle(sectionKey, editTitle);
    setIsEditingTitle(false);
  };

  const handleCancelEdit = () => {
    setEditTitle(customTitle || defaultTitle);
    setIsEditingTitle(false);
  };

  const handleStartEdit = () => {
    setEditTitle(customTitle || defaultTitle);
    setIsEditingTitle(true);
  };

  if (!visible && isAdmin) {
    return (
      <div
        className="relative border-2 border-dashed border-destructive/30 rounded-lg p-4 bg-destructive/5"
        data-testid={`section-${sectionKey}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <EyeOff className="h-4 w-4 text-destructive" />
            <span className="text-sm font-medium text-destructive">
              {displayTitle}
            </span>
            <span className="text-xs text-muted-foreground italic">
              — Hidden from dashboard
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 border-chart-2 text-chart-2 hover:bg-chart-2/10"
            onClick={() => onToggleVisibility(sectionKey, true)}
            data-testid={`button-restore-${sectionKey}`}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Restore Section
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative" data-testid={`section-${sectionKey}`}>
      {isAdmin && (
        <div className="flex items-center gap-2 mb-2 px-2 py-1.5 bg-muted/50 rounded-t-lg border border-b-0 border-border">
          {showTitle && (
            <>
              {isEditingTitle ? (
                <div className="flex items-center gap-1 flex-1">
                  <Input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="h-7 text-sm flex-1"
                    data-testid={`input-title-${sectionKey}`}
                  />
                  <Button size="sm" variant="ghost" className="h-7 px-2 gap-1" onClick={handleSaveTitle} data-testid={`button-save-title-${sectionKey}`}>
                    <Check className="h-3.5 w-3.5 text-chart-2" />
                    <span className="text-xs">Save</span>
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 px-2 gap-1" onClick={handleCancelEdit} data-testid={`button-cancel-title-${sectionKey}`}>
                    <X className="h-3.5 w-3.5 text-destructive" />
                    <span className="text-xs">Cancel</span>
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2 flex-1">
                  <span className="text-sm font-medium text-foreground">{displayTitle}</span>
                  <Button size="sm" variant="ghost" className="h-7 px-2 gap-1" onClick={handleStartEdit} data-testid={`button-edit-title-${sectionKey}`}>
                    <Pencil className="h-3 w-3" />
                    <span className="text-xs">Rename</span>
                  </Button>
                </div>
              )}
            </>
          )}

          {!showTitle && <div className="flex-1" />}

          <Button
            variant="outline"
            size="sm"
            className="gap-2 border-destructive/50 text-destructive hover:bg-destructive/10"
            onClick={() => onToggleVisibility(sectionKey, false)}
            data-testid={`button-hide-${sectionKey}`}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Hide Section
          </Button>
        </div>
      )}
      {children}
    </div>
  );
}
