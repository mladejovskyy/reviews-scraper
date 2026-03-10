import { Download, FileJson, FileSpreadsheet, FolderArchive } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DownloadBarProps {
  jobId: string;
}

export default function DownloadBar({ jobId }: DownloadBarProps) {
  const base = `/api/download/${jobId}`;

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" asChild>
        <a href={`${base}?format=json`} download={`${jobId}.json`}>
          <FileJson className="h-4 w-4" />
          JSON
        </a>
      </Button>
      <Button variant="outline" size="sm" asChild>
        <a href={`${base}?format=csv`} download={`${jobId}.csv`}>
          <FileSpreadsheet className="h-4 w-4" />
          CSV
        </a>
      </Button>
      <Button variant="outline" size="sm" asChild>
        <a href={`${base}?format=zip`} download={`${jobId}.zip`}>
          <FolderArchive className="h-4 w-4" />
          ZIP
        </a>
      </Button>
    </div>
  );
}
