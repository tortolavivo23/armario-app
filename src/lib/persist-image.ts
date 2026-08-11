import { Directory, File, Paths } from 'expo-file-system';

const GARMENTS_DIR = 'garments';

function getGarmentsDirectory() {
  const directory = new Directory(Paths.document, GARMENTS_DIR);
  if (!directory.exists) {
    directory.create();
  }
  return directory;
}

/**
 * Copies a picked image into the app's persistent storage and returns its stable
 * local uri. The file name is unique per call, since one garment can hold
 * several photos.
 */
export async function persistImage(sourceUri: string): Promise<string> {
  const extensionMatch = sourceUri.match(/\.[a-zA-Z0-9]+$/);
  const extension = extensionMatch ? extensionMatch[0] : '.jpg';
  const fileName = `${Date.now()}-${Math.floor(Math.random() * 1e6)}${extension}`;

  const sourceFile = new File(sourceUri);
  const destinationFile = new File(getGarmentsDirectory(), fileName);

  await sourceFile.copy(destinationFile);
  return destinationFile.uri;
}

export function deletePersistedImage(uri: string) {
  try {
    new File(uri).delete();
  } catch {
    // Image file already missing; nothing to clean up.
  }
}
