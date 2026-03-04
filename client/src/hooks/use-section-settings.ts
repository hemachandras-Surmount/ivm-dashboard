import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Team } from "@shared/schema";

interface DashboardSetting {
  id: string;
  team: string;
  settingKey: string;
  settingValue: string;
}

interface SectionSettings {
  visibility: Record<string, boolean>;
  titles: Record<string, string>;
  isLoading: boolean;
  getTitle: (sectionKey: string, defaultTitle: string) => string;
  isVisible: (sectionKey: string) => boolean;
  toggleVisibility: (sectionKey: string, visible: boolean) => void;
  updateTitle: (sectionKey: string, title: string) => void;
}

export function useSectionSettings(team: Team): SectionSettings {
  const { data: settings = [], isLoading } = useQuery<DashboardSetting[]>({
    queryKey: ["/api/dashboard-settings", team],
    queryFn: async () => {
      const res = await fetch(`/api/dashboard-settings?team=${team}`);
      if (!res.ok) throw new Error("Failed to fetch settings");
      return res.json();
    },
  });

  const mutation = useMutation({
    mutationFn: async ({ settingKey, settingValue }: { settingKey: string; settingValue: string }) => {
      await apiRequest("PUT", "/api/dashboard-settings", { team, settingKey, settingValue });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard-settings", team] });
    },
  });

  const visibility: Record<string, boolean> = {};
  const titles: Record<string, string> = {};

  settings.forEach((s) => {
    if (s.settingKey.startsWith("section_") && s.settingKey.endsWith("_visible")) {
      const key = s.settingKey.replace("section_", "").replace("_visible", "");
      visibility[key] = s.settingValue === "true";
    }
    if (s.settingKey.startsWith("section_") && s.settingKey.endsWith("_title")) {
      const key = s.settingKey.replace("section_", "").replace("_title", "");
      titles[key] = s.settingValue;
    }
  });

  const isVisible = (sectionKey: string): boolean => {
    return visibility[sectionKey] !== false;
  };

  const getTitle = (sectionKey: string, defaultTitle: string): string => {
    return titles[sectionKey] || defaultTitle;
  };

  const toggleVisibility = (sectionKey: string, visible: boolean) => {
    mutation.mutate({ settingKey: `section_${sectionKey}_visible`, settingValue: String(visible) });
  };

  const updateTitle = (sectionKey: string, title: string) => {
    mutation.mutate({ settingKey: `section_${sectionKey}_title`, settingValue: title });
  };

  return { visibility, titles, isLoading, getTitle, isVisible, toggleVisibility, updateTitle };
}
