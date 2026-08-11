import * as Sharing from "expo-sharing";

export async function shareFile(
  uri: string,
  mimeType: string,
  dialogTitle: string,
): Promise<void> {
  const available = await Sharing.isAvailableAsync();
  if (!available) {
    throw new Error("Sharing is not available on this device.");
  }
  await Sharing.shareAsync(uri, { mimeType, dialogTitle });
}
