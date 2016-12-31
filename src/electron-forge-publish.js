import 'colors';
import fs from 'fs-promise';
import path from 'path';
import program from 'commander';

import './util/terminate';
import asyncOra from './util/ora-handler';
import getForgeConfig from './util/forge-config';
import readPackageJSON from './util/read-package-json';
import requireSearch from './util/require-search';
import resolveDir from './util/resolve-dir';

import make from './electron-forge-make';

const main = async () => {
  const makeResults = await make();

  let dir = process.cwd();
  program
    .version(require('../package.json').version)
    .arguments('[cwd]')
    .option('--auth-token', 'Authorization token for your publisher target (if required)')
    .option('-t, --tag', 'The tag to publish to on GitHub')
    .option('--target', 'The deployment target, defaults to "github"')
    .allowUnknownOption(true)
    .action((cwd) => {
      if (!cwd) return;
      if (path.isAbsolute(cwd) && fs.existsSync(cwd)) {
        dir = cwd;
      } else if (fs.existsSync(path.resolve(dir, cwd))) {
        dir = path.resolve(dir, cwd);
      }
    })
    .parse(process.argv);

  dir = await resolveDir(dir);
  if (!dir) {
    // eslint-disable-next-line no-throw-literal
    throw 'Failed to locate publishable Electron application';
  }

  const artifacts = makeResults.reduce((accum, arr) => {
    accum.push(...arr);
    return accum;
  }, []);

  const packageJSON = await readPackageJSON(dir);

  const forgeConfig = await getForgeConfig(dir);

  if (!program.target) program.target = 'github';

  let publisher;
  await asyncOra(`Resolving publish target: ${`${program.target}`.cyan}`, async () => {
    publisher = requireSearch(__dirname, [
      `./publishers/${program.target}.js`,
      `electron-forge-publisher-${program.target}`,
    ]);
    if (!publisher) {
      throw `Could not find a publish target with the name: ${program.target}`; // eslint-disable-line
    }
  });

  await publisher(artifacts, packageJSON, forgeConfig, program.authToken, program.tag);
};

main();