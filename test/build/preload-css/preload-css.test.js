const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const {setupBuildTest, readFiles} = require('../../test-utils');

const cwd = path.join(__dirname, 'build');
let files = {};

describe('@snowpack/plugin-optimize', () => {
  beforeAll(() => {
    setupBuildTest(__dirname);

    files = readFiles(['index.html', '_dist_/vanilla.js'], {cwd});
  });

  describe('CSS', () => {
    it('generates imported-styles', () => {
      const importedStyles = path.join(cwd, 'imported-styles.css');
      expect(fs.existsSync(importedStyles)).toBe(true);
      expect(fs.readFileSync(importedStyles, 'utf-8').length).toBeGreaterThan(0);
    });
  });

  describe('HTML', () => {
    it('injects imported styles', () => {
      const $ = cheerio.load(files['/index.html']);
      expect($(`link[href$="imported-styles.css"]`)).toBeTruthy();
    });
  });

  describe('JS', () => {
    it('removes static CSS', () => {
      const ORIGINAL_IMPORTS = [
        `import 'water.css/out/water.min.css';`,
        `import './global.css';`,
        `import styleURL from './global-2.css';`,
      ];
      ORIGINAL_IMPORTS.forEach((i) => {
        expect(files['/_dist_/vanilla.js']).not.toEqual(expect.stringContaining(i));
      });
    });

    it('doesn’t remove dynamic CSS', () => {
      expect(files['/_dist_/vanilla.js']).toEqual(
        expect.stringContaining(`import("./dynamic-css.css.proxy.js");`),
      );
    });
  });

  describe('meta', () => {
    it('generates optimize-manifest', () => {
      const manifestLoc = path.join(cwd, '__snowpack__', 'optimize-manifest.json');
      expect(fs.existsSync(manifestLoc)).toBe(true);

      const manifest = JSON.parse(fs.readFileSync(manifestLoc, 'utf-8'));
      expect(manifest.generated.preloadedCSS).toBeTruthy();
    });
  });
});
