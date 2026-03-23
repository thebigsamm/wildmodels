"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type PhotoRow = {
  id: string;
  url: string;
  sort_order: number;
};

type ProfileRow = {
  id: string;
  photo_url: string | null;
};

type DisplayPhoto = {
  id: string;
  url: string;
  sort_order: number;
  synthetic?: boolean;
};

export default function ManagePhotosPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [mainUrl, setMainUrl] = useState<string | null>(null);
  const [photos, setPhotos] = useState<PhotoRow[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);

  const displayPhotos = useMemo<DisplayPhoto[]>(() => {
    const base = [...photos].sort((a, b) => a.sort_order - b.sort_order);

    if (mainUrl && !base.some((p) => p.url === mainUrl)) {
      return [
        {
          id: "main-photo-only",
          url: mainUrl,
          sort_order: -1,
          synthetic: true,
        },
        ...base,
      ];
    }

    return base;
  }, [photos, mainUrl]);

  useEffect(() => {
    async function loadData() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, photo_url")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profileError || !profile) {
        router.replace("/dashboard");
        return;
      }

      const p = profile as ProfileRow;
      setProfileId(p.id);
      setMainUrl(p.photo_url);

      const { data: photoRows } = await supabase
        .from("profile_photos")
        .select("id, url, sort_order")
        .eq("profile_id", p.id)
        .order("sort_order", { ascending: true });

      setPhotos((photoRows as PhotoRow[]) || []);
      setLoading(false);
    }

    loadData();
  }, [router, supabase]);

  async function reloadPhotos(currentProfileId: string) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("photo_url")
      .eq("id", currentProfileId)
      .single();

    const { data: photoRows } = await supabase
      .from("profile_photos")
      .select("id, url, sort_order")
      .eq("profile_id", currentProfileId)
      .order("sort_order", { ascending: true });

    setMainUrl(profile?.photo_url ?? null);
    setPhotos((photoRows as PhotoRow[]) || []);
  }

  async function uploadPhotos() {
    if (!profileId) return;

    if (newFiles.length === 0) {
      setMsg("Please choose at least 1 photo.");
      return;
    }

    setUploading(true);
    setMsg(null);

    const fd = new FormData();
    for (const file of newFiles) {
      fd.append("photos", file);
    }

    const res = await fetch("/api/account/photos/upload", {
      method: "POST",
      body: fd,
    });

    const data = await res.json();

    setUploading(false);

    if (!res.ok) {
      setMsg(`Error: ${data.error || "Upload failed."}`);
      return;
    }

    setNewFiles([]);
    await reloadPhotos(profileId);
    setMsg("Photos uploaded.");
    router.refresh();
  }

  async function setMain(url: string) {
    if (!profileId) return;

    setWorking(true);
    setMsg(null);

    const { error } = await supabase
      .from("profiles")
      .update({ photo_url: url })
      .eq("id", profileId);

    setWorking(false);

    if (error) {
      setMsg(`Error: ${error.message}`);
      return;
    }

    setMainUrl(url);
    setMsg("Main photo updated.");
    router.refresh();
  }

  async function deletePhoto(photoId: string, url: string, synthetic?: boolean) {
    if (!profileId) return;

    if (displayPhotos.length <= 1) {
      setMsg("You must keep at least 1 photo.");
      return;
    }

    setWorking(true);
    setMsg(null);

    if (!synthetic) {
      const { error } = await supabase
        .from("profile_photos")
        .delete()
        .eq("id", photoId);

      if (error) {
        setWorking(false);
        setMsg(`Error: ${error.message}`);
        return;
      }
    }

    if (mainUrl === url) {
      const remaining = displayPhotos.filter((p) => p.id !== photoId);
      const nextMain = remaining[0]?.url ?? null;

      const { error: profileError } = await supabase
        .from("profiles")
        .update({ photo_url: nextMain })
        .eq("id", profileId);

      if (profileError) {
        setWorking(false);
        setMsg(`Error: ${profileError.message}`);
        return;
      }
    }

    await reloadPhotos(profileId);
    setWorking(false);
    setMsg("Photo deleted.");
    router.refresh();
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-10">
        <p>Loading...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-2xl font-semibold">Manage Photos</h1>

      <div className="mt-6 rounded-xl border p-4">
        <p className="mb-3 text-sm font-medium">Upload new photos</p>

        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => setNewFiles(Array.from(e.target.files ?? []))}
          className="block w-full rounded-lg border p-2 text-sm"
        />

        <button
          onClick={uploadPhotos}
          disabled={uploading || newFiles.length === 0}
          className="mt-3 rounded-lg border px-4 py-2 text-sm disabled:opacity-50"
        >
          {uploading ? "Uploading..." : "Upload photos"}
        </button>

        <p className="mt-2 text-xs text-gray-500">
          Max 5 photos total. 2MB each. 10MB total per upload.
        </p>
      </div>

      {mainUrl ? (
        <div className="mt-6 rounded-xl border p-4">
          <p className="mb-3 text-sm font-medium">Current main photo</p>
          <img
            src={mainUrl}
            alt="Main profile photo"
            className="h-auto w-full max-w-xs rounded-lg border object-cover"
          />
        </div>
      ) : (
        <div className="mt-6 rounded-xl border p-4">
          <p className="text-sm text-gray-600">No main photo found.</p>
        </div>
      )}

      <div className="mt-6 rounded-xl border p-4">
        <p className="mb-4 text-sm font-medium">All photos</p>

        {displayPhotos.length === 0 ? (
          <p className="text-sm text-gray-600">No photos found.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {displayPhotos.map((photo, index) => {
              const isMain = photo.url === mainUrl;

              return (
                <div key={photo.id} className="rounded-xl border p-3">
                  <img
                    src={photo.url}
                    alt="Profile photo"
                    className="h-auto w-full rounded-lg border object-cover"
                  />

                  <div className="mt-3 space-y-1">
                    <p className="text-sm font-medium">
                      {isMain ? "Main photo" : `Photo ${index + 1}`}
                    </p>

                    {photo.synthetic ? (
                      <p className="text-xs text-gray-500">
                        This photo is your current main photo but is not in the photo list table.
                      </p>
                    ) : null}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {!isMain ? (
                      <button
                        onClick={() => setMain(photo.url)}
                        disabled={working}
                        className="rounded-lg border px-3 py-2 text-sm disabled:opacity-50"
                      >
                        Set as main
                      </button>
                    ) : null}

                    <button
                      onClick={() => deletePhoto(photo.id, photo.url, photo.synthetic)}
                      disabled={working || displayPhotos.length <= 1}
                      className="rounded-lg border px-3 py-2 text-sm disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {msg ? <p className="mt-4 text-sm">{msg}</p> : null}
    </main>
  );
}