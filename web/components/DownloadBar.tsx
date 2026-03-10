interface DownloadBarProps {
  jobId: string;
}

export default function DownloadBar({ jobId }: DownloadBarProps) {
  const base = `/api/download/${jobId}`;

  return (
    <div className="flex gap-3">
      <a
        href={`${base}?format=json`}
        download={`${jobId}.json`}
        className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
      >
        Download JSON
      </a>
      <a
        href={`${base}?format=csv`}
        download={`${jobId}.csv`}
        className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
      >
        Download CSV
      </a>
      <a
        href={`${base}?format=zip`}
        download={`${jobId}.zip`}
        className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
      >
        Download ZIP (with images)
      </a>
    </div>
  );
}
