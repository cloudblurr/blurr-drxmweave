import React, { useState, useEffect } from 'react';
import { Upload, Image as ImageIcon, Video, Trash2, Tag } from 'lucide-react';
import { GalleryItem } from '../types';
import { saveGalleryItem, getAllGalleryItems, deleteGalleryItem, updateGalleryItem } from '../services/galleryDB';
import { getCharacters } from '../services/storage';
import { Button } from './ui/button';
import { Card } from './ui/card';

export const Gallery: React.FC = () => {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [filterType, setFilterType] = useState<'all' | 'image' | 'video' | 'embed'>('all');
  const [filterCharacter, setFilterCharacter] = useState<string>('all');
  const [isUploading, setIsUploading] = useState(false);
  const characters = getCharacters();

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    const allItems = await getAllGalleryItems();
    setItems(allItems);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      for (const file of Array.from(files)) {
        const type = file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : null;
        if (!type) continue;

        await saveGalleryItem({
          type,
          name: file.name,
          blob: file,
          characterId: undefined,
          tags: []
        });
      }
      await loadItems();
    } catch (error) {
      console.error('Failed to upload files:', error);
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this media file?')) {
      await deleteGalleryItem(id);
      await loadItems();
    }
  };

  const handleAssignCharacter = async (item: GalleryItem, characterId: string | undefined) => {
    await updateGalleryItem(item.id, { characterId: characterId || undefined });
    await loadItems();
  };

  const filteredItems = items.filter(item => {
    if (filterType !== 'all' && item.type !== filterType) return false;
    if (filterCharacter !== 'all' && item.characterId !== filterCharacter) return false;
    return true;
  });

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="glass-haze border-b border-sky-200/15 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <ImageIcon className="w-6 h-6 text-purple-400" />
              Gallery
            </h2>
            <p className="text-sm text-gray-400 mt-1">{filteredItems.length} items</p>
          </div>
          <label className="cursor-pointer">
            <input
              type="file"
              multiple
              accept="image/*,video/*"
              onChange={handleFileUpload}
              disabled={isUploading}
              className="hidden"
            />
            <div className="holo-btn holo-btn-primary px-4 py-2 text-white rounded-lg transition-all flex items-center gap-2">
              <Upload className="w-4 h-4" />
              {isUploading ? 'Uploading...' : 'Upload Media'}
            </div>
          </label>
        </div>

        {/* Filters */}
        <div className="flex gap-3 mt-4">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="holo-select px-3 py-2 text-white text-sm"
          >
            <option value="all">All Types</option>
            <option value="image">Images</option>
            <option value="video">Videos</option>
            <option value="embed">Embeds</option>
          </select>
          <select
            value={filterCharacter}
            onChange={(e) => setFilterCharacter(e.target.value)}
            className="holo-select px-3 py-2 text-white text-sm"
          >
            <option value="all">All Characters</option>
            <option value="unassigned">Unassigned</option>
            {characters.map(char => (
              <option key={char.id} value={char.id}>{char.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Gallery Grid */}
      <div className="flex-1 overflow-y-auto p-6">
        {filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <ImageIcon className="w-16 h-16 mb-4 opacity-50" />
            <p className="text-lg">No media files yet</p>
            <p className="text-sm mt-1">Upload images or videos to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredItems.map(item => (
              <GalleryCard
                key={item.id}
                item={item}
                onDelete={handleDelete}
                onAssignCharacter={handleAssignCharacter}
                characters={characters}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

interface GalleryCardProps {
  item: GalleryItem;
  onDelete: (id: string) => void;
  onAssignCharacter: (item: GalleryItem, characterId: string | undefined) => void;
  characters: any[];
}

const GalleryCard: React.FC<GalleryCardProps> = ({ item, onDelete, onAssignCharacter, characters }) => {
  const [thumbnailUrl, setThumbnailUrl] = useState<string>('');
  const [previewUrl, setPreviewUrl] = useState<string>('');

  useEffect(() => {
    let cleanups: Array<() => void> = [];
    if (item.thumbnail) {
      setThumbnailUrl(item.thumbnail);
    } else if (item.type === 'image') {
      const isBlob = item.blob instanceof Blob;
      const url = isBlob ? URL.createObjectURL(item.blob) : (item.blob as unknown as string);
      setThumbnailUrl(url);
      if (isBlob) cleanups.push(() => URL.revokeObjectURL(url));
    }

    if (item.type === 'video') {
      const isBlob = item.blob instanceof Blob;
      const url = isBlob ? URL.createObjectURL(item.blob) : (item.blob as unknown as string);
      setPreviewUrl(url);
      if (isBlob) cleanups.push(() => URL.revokeObjectURL(url));
    }

    if (item.type === 'embed' && item.embedUrl) {
      setPreviewUrl(item.embedUrl);
    }

    return () => {
      cleanups.forEach(fn => fn());
    };
  }, [item.thumbnail, item.blob, item.type]);

  return (
    <Card className="holo-card border border-sky-200/15 rounded-lg overflow-hidden group hover:border-sky-300/40 transition-all p-0">
      {/* Thumbnail */}
      <div className="aspect-square bg-gray-900 relative overflow-hidden">
        {item.type === 'video' ? (
          previewUrl ? (
            <video
              src={previewUrl}
              poster={thumbnailUrl || undefined}
              className="w-full h-full object-cover"
              muted
              loop
              playsInline
              preload="metadata"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Video className="w-12 h-12 text-gray-600" />
            </div>
          )
        ) : item.type === 'embed' ? (
          <div className="w-full h-full bg-gray-800 text-purple-200 text-xs flex items-center justify-center p-3 text-center">
            Embed
          </div>
        ) : thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={item.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {item.type === 'image' ? (
              <ImageIcon className="w-12 h-12 text-gray-600" />
            ) : (
              <Video className="w-12 h-12 text-gray-600" />
            )}
          </div>
        )}
        <div className="absolute top-2 right-2">
          <Button
            onClick={() => onDelete(item.id)}
            size="sm"
            className="h-8 w-8 p-0 bg-red-600/80 hover:bg-red-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
        <div className="absolute bottom-2 left-2">
          <span className="px-2 py-1 bg-black/70 text-white text-xs rounded flex items-center gap-1">
            {item.type === 'image' ? <ImageIcon className="w-3 h-3" /> : <Video className="w-3 h-3" />}
            {item.type}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="text-sm text-white truncate" title={item.name}>
          {item.name}
        </p>
        <select
          value={item.characterId || 'unassigned'}
          onChange={(e) => onAssignCharacter(item, e.target.value === 'unassigned' ? undefined : e.target.value)}
          className="mt-2 w-full holo-select px-2 py-1 text-white text-xs"
        >
          <option value="unassigned">Unassigned</option>
          {characters.map(char => (
            <option key={char.id} value={char.id}>{char.name}</option>
          ))}
        </select>
      </div>
    </Card>
  );
};
