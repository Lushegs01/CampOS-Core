"use client";

import { useFiles } from "@/hooks/use-files";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Upload, Download, Image as ImageIcon, File, Trash2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const mockFiles = [
  { id: "1", filename: "profile_photo.jpg", originalName: "Profile Photo", category: "profile_photo", size: 2048000, mimeType: "image/jpeg", createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString() },
  { id: "2", filename: "id_card.pdf", originalName: "Student ID Card", category: "verification", size: 512000, mimeType: "application/pdf", createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString() },
  { id: "3", filename: "transcript.pdf", originalName: "Academic Transcript", category: "document", size: 1048576, mimeType: "application/pdf", createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString() },
  { id: "4", filename: "hostel_receipt.pdf", originalName: "Hostel Payment Receipt", category: "housing", size: 256000, mimeType: "application/pdf", createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString() },
];

const categoryLabels: Record<string, string> = {
  profile_photo: "Profile Photo",
  document: "Document",
  verification: "Verification",
  housing: "Housing",
};

export default function FilesPage() {
  const { data: filesData, isLoading } = useFiles();
  const [files, setFiles] = useState(filesData || mockFiles);

  const deleteFile = (id: string) => {
    setFiles(files.filter((f) => f.id !== id));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const displayFiles = filesData || files;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Files</h1>
          <p className="text-muted-foreground mt-1">Manage your uploaded documents and photos</p>
        </div>
        <Button variant="gradient" className="gap-2">
          <Upload className="h-4 w-4" /> Upload File
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Files", value: displayFiles.length, icon: File, color: "bg-blue-500" },
          { label: "Documents", value: displayFiles.filter((f) => f.category === "document").length, icon: FileText, color: "bg-emerald-500" },
          { label: "Photos", value: displayFiles.filter((f) => f.category === "profile_photo").length, icon: ImageIcon, color: "bg-violet-500" },
          { label: "Total Size", value: formatFileSize(displayFiles.reduce((sum, f) => sum + f.size, 0)), icon: File, color: "bg-amber-500" },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold mt-1">{stat.value}</p>
                  </div>
                  <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center", stat.color)}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Files</CardTitle>
          <CardDescription>Your uploaded documents and media</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-3">
              {displayFiles.map((file) => (
                <div key={file.id} className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "h-10 w-10 rounded-lg flex items-center justify-center",
                      file.mimeType.startsWith("image/") ? "bg-violet-500/10" : "bg-blue-500/10"
                    )}>
                      {file.mimeType.startsWith("image/") ? (
                        <ImageIcon className="h-5 w-5 text-violet-600" />
                      ) : (
                        <FileText className="h-5 w-5 text-blue-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{file.originalName}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="outline" className="text-xs">{categoryLabels[file.category]}</Badge>
                        <span>{formatFileSize(file.size)}</span>
                        <span>•</span>
                        <span>{new Date(file.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon">
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteFile(file.id)}>
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
