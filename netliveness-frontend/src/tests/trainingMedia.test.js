import { describe, it, expect } from 'vitest';
import { isAllowedTrainingMedia } from '../utils/trainingMedia';

describe('isAllowedTrainingMedia', () => {
  it('accepts a powerpoint upload even when the browser reports a non-video mime type', () => {
    const file = {
      name: 'siber-guvenlik.pptx',
      type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    };
    expect(isAllowedTrainingMedia(file)).toBe(true);
  });

  it('accepts ppt and pdf by extension when the mime type is empty', () => {
    expect(isAllowedTrainingMedia({ name: 'egitim.ppt', type: '' })).toBe(true);
    expect(isAllowedTrainingMedia({ name: 'egitim.PDF', type: '' })).toBe(true);
  });

  it('still accepts video files', () => {
    expect(isAllowedTrainingMedia({ name: 'egitim.mp4', type: 'video/mp4' })).toBe(true);
    expect(isAllowedTrainingMedia({ name: 'egitim.webm', type: 'video/webm' })).toBe(true);
  });

  it('rejects other files', () => {
    expect(isAllowedTrainingMedia({ name: 'notlar.docx', type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })).toBe(false);
    expect(isAllowedTrainingMedia(null)).toBe(false);
  });
});
