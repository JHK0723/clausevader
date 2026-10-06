"use client";

import { useState, useRef } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UploadCloud, CloudCheck } from "lucide-react";
import { toast } from "sonner";
import clsx from "clsx";

export function UploadForm({ userId }) {
  const [file, setFile] = useState(null);
  const [role, setRole] = useState();
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [done, setDone] = useState(false);

  const inputRef = useRef(null);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile && /\.(pdf|docx)$/i.test(droppedFile.name)) {
      setFile(droppedFile);
    } else {
      toast.error("Only PDF or DOCX files are allowed.");
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) setFile(selectedFile);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !role) {
      toast.error("Please select a file and your role.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("role", role);
    formData.append("user_id", userId.toString());

    setLoading(true);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
      const res = await fetch(`${backendUrl}/api/upload`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");

      const data = await res.json();
      toast.success("Document uploaded!");
      if (data.error) {
        setErrorMsg(data.message)
      }
      // TODO: Redirect or update UI
    } catch (err) {
      console.error(err);
      toast.error("Failed to upload");
    } finally {
      setLoading(false);
      setDone(true);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col items-center justify-center min-h-screen space-y-8 p-6"
    >
      <h2 className="text-3xl font-bold">Upload Contract</h2>

      {/* Drag and drop area */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={clsx(
          "w-full max-w-xl h-64 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition",
          isDragging ? "border-primary/50 bg-muted" : "hover:border-primary/40"
        )}
      > 
      {
        file ? (
            <CloudCheck className="w-16 h-16 text-muted-foreground mb-4" />
        ) : 
        (
            <UploadCloud className="w-16 h-16 text-muted-foreground mb-4" />
        )
      }
        {file ? (
          <p className="text-sm font-medium">{file.name}</p>
        ) : (
          <>
            <p className="text-sm font-medium">
              Drag and drop a PDF or DOCX here
            </p>
            <p className="text-xs text-muted-foreground">
              or click to select a file
            </p>
          </>
        )}
        <Input
          type="file"
          accept=".pdf,.docx"
          ref={inputRef}
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {/* Role selector */}
      <div className="flex flex-col items-center w-full max-w-xl space-y-2">
        <Label>Which side of the contract are you on?</Label>
        <Select onValueChange={setRole}>
          <SelectTrigger>
            <SelectValue placeholder="Select your role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recipient">
              👤 I’m the recipient (employee, tenant...)
            </SelectItem>
            <SelectItem value="issuer">
              🏢 I’m the issuer (employer, landlord...)
            </SelectItem>
            <SelectItem value="unsure">❓ I’m not sure</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" disabled={loading}>
        {loading ? "Uploading..." : "Upload and Analyze"}
      </Button>
      {errorMsg && (
        <p className=" text-red-500 text-sm">Error: {errorMsg}</p>
      )}
      {loading && (
        <p className="text-red-500 text-sm">Yes it takes a while please wait!</p>
      )}
      { done && (
        <Button asChild>
          <Link href="/dashboard">
          View Analysis
          </Link>
        </Button>
      )

      }
    </form>
  );
}
