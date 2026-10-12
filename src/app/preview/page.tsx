import { PreviewStudio } from '@/components/preview/preview-studio';
import { RoomPreview } from '@/components/preview/room-preview';
import { parsePreviewOptions } from '@/lib/preview/scenarios';
import './preview.css';

export const metadata={title:'พรีวิวดีไซน์ · Merchant’s Bluff',robots:{index:false,follow:false}};
export default async function PreviewPage({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}) {
  const values=await searchParams;const options=parsePreviewOptions(values);
  return values.frame==='1'?<RoomPreview options={options} />:<PreviewStudio initialOptions={options} />;
}
