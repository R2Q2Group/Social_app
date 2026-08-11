import * as ImagePicker from "expo-image-picker";

// RDD.md Section 3.2: "user uploads a photo, app auto-crops/outlines it as
// a layered vector asset." The crop/outline itself happens at render time
// (ThumbnailCard's circular <ClipPath> + stroked ring) so this just needs a
// raw photo URI -- no ML background removal, which is explicitly out of
// scope (no AI image generation for standard slides/thumbnails, per RDD.md
// Section 3.2).
export async function pickFaceCutoutPhoto(): Promise<string | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    throw new Error("Photo library access is required for a face cutout.");
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.9,
  });

  if (result.canceled || result.assets.length === 0) {
    return null;
  }
  return result.assets[0].uri;
}
