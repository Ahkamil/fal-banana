import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Nano Banana Playground',
  description: 'A playground for Google\'s new model, built by FAL.ai.',
  openGraph: {
    title: 'Nano Banana Playground',
    description: 'A playground for Google\'s new model, built by FAL.ai.',
    url: 'https://fal.ai/playground',
  },
  twitter: {
    title: 'Nano Banana Playground ',
    description: 'A playground for Google\'s new model, built by FAL.ai.',
  },
};

export default function PlaygroundLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
