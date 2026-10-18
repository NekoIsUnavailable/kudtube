const path = require('path');
const fs = require('fs');

exports.default = async function(context) {
  const appOutDir = context.appOutDir;
  console.log('[afterPack] Pruning unneeded files from:', appOutDir);

  // 1. Prune unused language files in locales/
  const localesDir = path.join(appOutDir, 'locales');
  if (fs.existsSync(localesDir)) {
    const files = fs.readdirSync(localesDir);
    let removedLocales = 0;
    for (const file of files) {
      if (file !== 'en-US.pak') {
        try {
          fs.unlinkSync(path.join(localesDir, file));
          removedLocales++;
        } catch {}
      }
    }
    console.log(`[afterPack] Pruned ${removedLocales} foreign locales (retained en-US.pak)`);
  }

  // 2. Remove giant license html and D3D12 shader compilers (not used by D3D11 MPV)
  const filesToRemove = [
    'LICENSES.chromium.html',
    'dxcompiler.dll',
    'dxil.dll',
    'vk_swiftshader.dll',
    'vk_swiftshader_icd.json',
  ];
  for (const f of filesToRemove) {
    const full = path.join(appOutDir, f);
    if (fs.existsSync(full)) {
      try {
        fs.unlinkSync(full);
        console.log(`[afterPack] Removed unused Chromium file: ${f}`);
      } catch {}
    }
  }

  // 3. Remove legacy DX9 dll and bats in resources/mpv
  const mpvDir = path.join(appOutDir, 'resources', 'mpv');
  if (fs.existsSync(mpvDir)) {
    const mpvExtras = [
      'd3dcompiler_43.dll',
      'mpv.com',
      'updater.bat',
      'mpv-register.bat',
      'mpv-unregister.bat',
      'LICENSE.txt',
    ];
    for (const f of mpvExtras) {
      const full = path.join(mpvDir, f);
      if (fs.existsSync(full)) {
        try {
          fs.unlinkSync(full);
          console.log(`[afterPack] Removed unused MPV file: ${f}`);
        } catch {}
      }
    }
  }

  console.log('[afterPack] Optimization pass completed.');
};
