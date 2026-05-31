"use client";
import React from 'react';
import { useParams } from 'next/navigation';
import SingleCharacterShell from '../../../components/SingleCharacterShell';

export default function SingleCharacterPage() {
  // useParams is available in app router client components
  const params = useParams() as { id?: string };
  const id = params?.id || '';

  if (!id) {
    return <div className="p-8">No DrxmShell or character id provided.</div>;
  }

  return (
    <main className="min-h-screen">
      <SingleCharacterShell characterId={id} />
    </main>
  );
}
