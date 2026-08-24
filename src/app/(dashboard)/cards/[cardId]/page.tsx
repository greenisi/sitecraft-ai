import { CardStudio } from '@/components/business-cards/card-studio';

export default async function EditBusinessCardPage({ params }: { params: Promise<{ cardId: string }> }) {
  const { cardId } = await params;
  return <CardStudio cardId={cardId} />;
}

