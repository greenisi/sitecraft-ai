'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

export function useGeneratedFiles(projectId: string) {
  return useQuery({
    queryKey: ['generated-files', projectId],
    queryFn: async () => {
      const supabase = createClient();
      // Get the latest completed version
      const { data: version } = await supabase
        .from('generation_versions')
        .select('id')
        .eq('project_id', projectId)
        .eq('status', 'complete')
        .order('version_number', { ascending: false })
        .limit(1)
        .single();

      if (!version) return null;

      // Get all files for this version
      const { data: files, error } = await supabase
        .from('generated_files')
        .select('file_path, content, file_type, section_type')
        .eq('version_id', version.id)
        .order('file_path');

      if (error) throw error;

      // Convert to a flat record for Sandpack
      const fileMap: Record<string, string> = {};
      for (const file of files || []) {
        fileMap[file.file_path] = file.content;
      }

      return {
        versionId: version.id,
        files: fileMap,
        fileList: files || [],
      };
    },
    enabled: !!projectId,
  });
}
