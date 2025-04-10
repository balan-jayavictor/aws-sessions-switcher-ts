import { getVersion } from '../src/config/version';

describe('Version', () => {
  it('should return a valid version string', () => {
    const version = getVersion();
    expect(version).toBeDefined();
    expect(typeof version).toBe('string');
    expect(version).toMatch(/^\d+\.\d+\.\d+$/);
  });
});
