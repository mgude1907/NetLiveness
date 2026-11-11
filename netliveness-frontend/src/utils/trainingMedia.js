const SLIDE_OR_DOCUMENT = ['.pptx', '.ppt', '.pdf'];

export function isAllowedTrainingMedia(file) {
  if (!file) return false;
  const name = String(file.name || '').toLowerCase();
  const type = String(file.type || '').toLowerCase();
  if (type.startsWith('video/')) return true;
  return SLIDE_OR_DOCUMENT.some((ext) => name.endsWith(ext));
}
