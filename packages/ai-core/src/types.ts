export interface SlideContent {
  title: string;
  subtitle?: string;
  bulletPoints?: string[];
  hook?: string;
  calloutType?: string;
  emphasisWords?: string[];
}

export interface CarouselDraft {
  mode: "carousel";
  slides: SlideContent[];
}

export interface ThumbnailVariant {
  text: string;
  focalConcept: string;
  calloutShape: string;
}

export interface ThumbnailDraft {
  mode: "thumbnail";
  variants: ThumbnailVariant[];
}

export type Draft = CarouselDraft | ThumbnailDraft;
