"use client";

import * as React from "react";
import { ImagePlus, UploadCloud, Sparkles, FileJson, Trash2, Search, Filter, ArrowUpDown, Users, Globe, BadgeCheck, Clock3 } from "lucide-react";

import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";

interface OodaVerseEntry {
  id: string;
  name: string;
  description?: string;
  json: Record<string, unknown>;
  imageDataUrl?: string;
  tags?: string[];
  source?: string;
  createdAt: number;
}

const STORAGE_KEY = "oodaverse-entries";

const safeParse = (value: string): unknown => {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

export default function OodaVersePage() {
  const [entries, setEntries] = React.useState<OodaVerseEntry[]>([]);
  const [jsonText, setJsonText] = React.useState("");
  const [jsonFileName, setJsonFileName] = React.useState<string | null>(null);
  const [imagePreview, setImagePreview] = React.useState<string | null>(null);
  const [status, setStatus] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState("");
  const [sortBy, setSortBy] = React.useState<"newest" | "oldest" | "name">("newest");
  const [tagFilter, setTagFilter] = React.useState<string>("all");

  const previewData = React.useMemo(() => {
    const parsed = safeParse(jsonText);
    if (parsed && typeof parsed === "object") {
      return parsed as Record<string, unknown>;
    }
    return null;
  }, [jsonText]);

  React.useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = safeParse(stored);
      if (Array.isArray(parsed)) {
        setEntries(parsed as OodaVerseEntry[]);
      }
    }
  }, []);

  const persistEntries = React.useCallback((next: OodaVerseEntry[]) => {
    setEntries(next);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const availableTags = React.useMemo(() => {
    const tags = new Set<string>();
    entries.forEach((entry) => {
      (entry.tags ?? []).forEach((tag) => {
        if (tag) tags.add(tag);
      });
    });
    return Array.from(tags).sort((a, b) => a.localeCompare(b));
  }, [entries]);

  const visibleEntries = React.useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const filtered = entries.filter((entry) => {
      const haystack = [entry.name, entry.description, entry.source, ...(entry.tags ?? [])]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const matchesText = !normalizedSearch || haystack.includes(normalizedSearch);
      const matchesTag = tagFilter === "all" || (entry.tags ?? []).includes(tagFilter);
      return matchesText && matchesTag;
    });

    return filtered.sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "oldest") return a.createdAt - b.createdAt;
      return b.createdAt - a.createdAt;
    });
  }, [entries, search, sortBy, tagFilter]);

  const handleJsonFile = (file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === "string" ? reader.result : "";
      setJsonText(text);
      setJsonFileName(file.name);
      setStatus("JSON loaded. Review and submit when ready.");
    };
    reader.readAsText(file);
  };

  const handleImageFile = (file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === "string" ? reader.result : null;
      setImagePreview(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = () => {
    const parsed = safeParse(jsonText);
    if (!parsed || typeof parsed !== "object") {
      setStatus("Invalid JSON. Please fix formatting before submitting.");
      return;
    }

    const typedParsed = parsed as Record<string, unknown>;
    const name = typeof typedParsed.name === "string" ? typedParsed.name : "Untitled Character";
    const description = typeof typedParsed.description === "string" ? typedParsed.description : undefined;
    const source = typeof typedParsed.creator === "string"
      ? typedParsed.creator
      : typeof typedParsed.source === "string"
        ? typedParsed.source
        : "community";
    const tags = Array.isArray(typedParsed.tags)
      ? typedParsed.tags.filter((tag): tag is string => typeof tag === "string").slice(0, 6)
      : [];

    const nextEntry: OodaVerseEntry = {
      id: crypto.randomUUID(),
      name,
      description,
      json: typedParsed,
      imageDataUrl: imagePreview ?? undefined,
      tags,
      source,
      createdAt: Date.now()
    };

    const nextEntries = [nextEntry, ...entries];
    persistEntries(nextEntries);
    setStatus("Submitted to OodaVerse (local-only). Ready for the next upload.");
    setJsonText("");
    setJsonFileName(null);
    setImagePreview(null);
  };

  const handleRemove = (id: string) => {
    const nextEntries = entries.filter((entry) => entry.id !== id);
    persistEntries(nextEntries);
  };

  return (
    <div className="min-h-screen px-4 py-8 md:px-6 md:py-10">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="relative overflow-hidden rounded-3xl border border-slate-700/70 bg-slate-950/65 p-6 md:p-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.2),transparent_43%),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.17),transparent_37%)]" />
          <div className="relative space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-300/25 bg-slate-900/70 px-4 py-1.5 text-xs text-slate-200">
              <Sparkles className="h-3.5 w-3.5 text-sky-300" />
              Oodaverse Public Repository
            </div>
            <h1 className="text-3xl md:text-5xl font-semibold text-slate-100">
              Discover and publish public characters
            </h1>
            <p className="text-slate-300 max-w-3xl">
              Oodaverse is now a browsing-first repository. Find community characters by tags,
              inspect payloads, and share your own character JSONs.
            </p>
            <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
              <Metric icon={<Users className="h-4 w-4" />} label="Total Entries" value={String(entries.length)} />
              <Metric icon={<Filter className="h-4 w-4" />} label="Tag Groups" value={String(availableTags.length)} />
              <Metric icon={<Globe className="h-4 w-4" />} label="Visibility" value="Public" />
              <Metric icon={<BadgeCheck className="h-4 w-4" />} label="Moderation" value="Local" />
            </div>
          </div>
        </header>

        <Tabs defaultValue="repository" className="w-full">
          <TabsList className="w-full justify-center">
            <TabsTrigger value="repository">Repository</TabsTrigger>
            <TabsTrigger value="upload">Upload</TabsTrigger>
          </TabsList>

          <TabsContent value="repository">
            <div className="space-y-5">
              <Card>
                <CardContent className="pt-6">
                  <div className="grid gap-3 md:grid-cols-[1.5fr_0.8fr_0.7fr]">
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-500" />
                      <Input
                        value={search}
                        onChange={(event: React.ChangeEvent<HTMLInputElement>) => setSearch(event.target.value)}
                        placeholder="Search by character name, source, or tag"
                        className="pl-10"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="tagFilter" className="text-xs text-slate-400">Tag</Label>
                      <select
                        id="tagFilter"
                        value={tagFilter}
                        onChange={(event: React.ChangeEvent<HTMLSelectElement>) => setTagFilter(event.target.value)}
                        className="neo-input h-11 w-full rounded-2xl px-4 py-2 text-sm"
                      >
                        <option value="all">All tags</option>
                        {availableTags.map((tag) => (
                          <option key={tag} value={tag}>{tag}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="sortBy" className="text-xs text-slate-400">Sort</Label>
                      <select
                        id="sortBy"
                        value={sortBy}
                        onChange={(event: React.ChangeEvent<HTMLSelectElement>) => setSortBy(event.target.value as "newest" | "oldest" | "name")}
                        className="neo-input h-11 w-full rounded-2xl px-4 py-2 text-sm"
                      >
                        <option value="newest">Newest first</option>
                        <option value="oldest">Oldest first</option>
                        <option value="name">Name A-Z</option>
                      </select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {visibleEntries.length === 0 && (
                  <Card className="md:col-span-2 xl:col-span-3">
                    <CardHeader>
                      <CardTitle>No matching entries</CardTitle>
                      <CardDescription>
                        Try changing your filters, or upload the first character to seed this repository.
                      </CardDescription>
                    </CardHeader>
                  </Card>
                )}
                {visibleEntries.map((entry) => (
                  <Card key={entry.id} className="overflow-hidden">
                    <CardContent className="p-0">
                      {entry.imageDataUrl ? (
                        <img
                          src={entry.imageDataUrl}
                          alt={entry.name}
                          className="h-44 w-full object-cover"
                        />
                      ) : (
                        <div className="h-44 w-full bg-linear-to-br from-slate-900 to-slate-800 flex items-center justify-center">
                          <ImagePlus className="h-7 w-7 text-slate-500" />
                        </div>
                      )}
                      <div className="space-y-3 p-5">
                        <div>
                          <h3 className="text-lg font-medium text-slate-100">{entry.name}</h3>
                          <p className="line-clamp-2 text-sm text-slate-400">{entry.description ?? "No description provided."}</p>
                        </div>
                        <div className="flex items-center justify-between text-xs text-slate-400">
                          <span className="inline-flex items-center gap-1">
                            <Users className="h-3.5 w-3.5" />
                            {entry.source ?? "community"}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Clock3 className="h-3.5 w-3.5" />
                            {new Date(entry.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {(entry.tags ?? []).slice(0, 4).map((tag) => (
                            <span key={`${entry.id}-${tag}`} className="rounded-full border border-slate-700/80 px-2 py-1 text-[10px] text-slate-300">
                              {tag}
                            </span>
                          ))}
                        </div>
                        <details className="rounded-xl border border-slate-700/60 bg-slate-950/60 p-3 text-xs text-slate-300">
                          <summary className="cursor-pointer select-none text-slate-200">View JSON payload</summary>
                          <pre className="mt-3 whitespace-pre-wrap wrap-break-word text-[11px] leading-relaxed">
                            {JSON.stringify(entry.json, null, 2)}
                          </pre>
                        </details>
                        <Button
                          onClick={() => handleRemove(entry.id)}
                          className="w-full"
                          variant="ghost"
                        >
                          <Trash2 className="h-4 w-4" />
                          Remove Entry
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="upload">
            <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
              <Card className="p-1">
                <CardHeader>
                  <CardTitle>Publish a Character</CardTitle>
                  <CardDescription>
                    Upload a JSON file or paste your payload. Tags improve repository discovery.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="jsonUpload">Character JSON File</Label>
                    <Input
                      id="jsonUpload"
                      type="file"
                      accept="application/json"
                      onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                        handleJsonFile(event.target.files?.[0] ?? null)
                      }
                    />
                    {jsonFileName && (
                      <p className="text-xs text-slate-400">Loaded: {jsonFileName}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="jsonText">Or paste JSON</Label>
                    <Textarea
                      id="jsonText"
                      placeholder='{"name":"Nova","description":"Synth oracle","tags":["scifi","oracle"],"creator":"community"}'
                      value={jsonText}
                      onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) =>
                        setJsonText(event.target.value)
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="imageUpload">Character Image</Label>
                    <Input
                      id="imageUpload"
                      type="file"
                      accept="image/*"
                      onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                        handleImageFile(event.target.files?.[0] ?? null)
                      }
                    />
                  </div>

                  <Button onClick={handleSubmit} className="w-full">
                    <UploadCloud className="h-4 w-4" />
                    Publish to Repository
                  </Button>
                  {status && <p className="text-sm text-cyan-200">{status}</p>}
                </CardContent>
              </Card>

              <Card className="p-1">
                <CardHeader>
                  <CardTitle>Preview</CardTitle>
                  <CardDescription>
                    See how your upload will appear to the community.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center">
                      <FileJson className="h-6 w-6 text-cyan-200" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-200">
                        {previewData?.name?.toString() ?? "Character Name"}
                      </p>
                      <p className="text-xs text-slate-400">
                        {previewData?.description?.toString() ?? "Description preview"}
                      </p>
                    </div>
                  </div>
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full rounded-2xl object-cover shadow-soft"
                    />
                  ) : (
                    <div className="h-40 rounded-2xl border border-dashed border-white/20 flex items-center justify-center text-slate-500">
                      <ImagePlus className="h-6 w-6" />
                    </div>
                  )}

                  <div className="rounded-2xl border border-slate-700/70 bg-slate-950/55 p-4">
                    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">Submission checklist</p>
                    <ul className="space-y-1 text-xs text-slate-300">
                      <li className="flex items-center gap-2"><ArrowUpDown className="h-3.5 w-3.5 text-slate-500" /> Add a unique name.</li>
                      <li className="flex items-center gap-2"><ArrowUpDown className="h-3.5 w-3.5 text-slate-500" /> Include 2-4 tags for discoverability.</li>
                      <li className="flex items-center gap-2"><ArrowUpDown className="h-3.5 w-3.5 text-slate-500" /> Upload a square portrait when possible.</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-700/70 bg-slate-900/70 px-4 py-3">
      <div className="mb-1 inline-flex items-center gap-2 text-xs text-slate-400">
        {icon}
        {label}
      </div>
      <p className="text-base font-semibold text-slate-100">{value}</p>
    </div>
  );
}
