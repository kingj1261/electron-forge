import * as fs from 'fs-extra';
import glob from 'glob-promise';
import * as path from 'path';

// Usage: $(npm bin)/ts-node tools/update-deps.ts PACKAGE_NAME PACKAGE_RANGE

const depTypes = ['dependencies', 'devDependencies', 'optionalDependencies'];

const packageName = process.argv[2];
const packageVersion = process.argv[3];

async function writePackageJSON(jsonPath: string, data: object) {
  await fs.writeJson(jsonPath, data, { spaces: 2 });
}

async function updatePackageJSON(jsonPath: string) {
  const packageJSON = await fs.readJson(jsonPath);

  for (const depType of depTypes) {
    if (packageJSON[depType] && packageJSON[depType][packageName]) {
      packageJSON[depType][packageName] = packageVersion;
      await writePackageJSON(jsonPath, packageJSON);
      break;
    }
  }
}

(async() => {
  const basePath = path.resolve(__dirname, '..')
  await updatePackageJSON(path.join(basePath, 'package.json'));

  const filenames: string[] = await glob(path.join(basePath, 'packages', '*', '*', 'package.json'));
  for (const filename of filenames) {
    await updatePackageJSON(filename);
  }
})().catch(console.error);
