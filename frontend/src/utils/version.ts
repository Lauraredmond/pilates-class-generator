// Auto-read version from VERSION file (updated by pre-commit hook)
import versionRaw from '../../../VERSION?raw';

export const APP_VERSION = versionRaw.trim();
