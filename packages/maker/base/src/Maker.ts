/* eslint-disable no-unused-vars */

import { ForgeArch, ForgeConfig, ForgePlatform, IForgeMaker } from '@electron-forge/shared-types';
import fs from 'fs-extra';
import path from 'path';

export interface MakerOptions {
  /**
   * The directory containing the packaged Electron application
   */
  dir: string;
  /**
   * The directory you should put all your artifacts in (potentially in sub folders)
   * NOTE: this directory is not guarunteed to already exist
   */
  makeDir: string;
  /**
   * The resolved human friendly name of the project
   */
  appName: string;
  /**
   * The target platform you should make for
   */
  targetPlatform: ForgePlatform;
  /**
   * The target architecture you should make for
   */
  targetArch: ForgeArch;
  /**
   * Fully resolved forge configuration, you shouldn't really need this
   */
  forgeConfig: ForgeConfig;
  /**
   * The applications package.json file
   */
  packageJSON: any;
}

export default abstract class Maker<C> {
  public config!: C;
  public abstract name: string;
  public abstract defaultPlatforms: ForgePlatform[];
  /* tslint:disable variable-name */
  __isElectronForgeMaker!: true;
  /* tslint:enable variable-name */

  constructor(private configFetcher: (C | ((arch: ForgeArch) => C)) = {} as C, protected providedPlatforms?: ForgePlatform[]) {
    Object.defineProperty(this, '__isElectronForgeMaker', {
      value: true,
      enumerable: false,
      configurable: false,
    });
  }

  get platforms() {
    if (this.providedPlatforms) return this.providedPlatforms;
    return this.defaultPlatforms;
  }

  // TODO: Remove this, it is an eye-sore and is a nasty hack to provide forge
  //       v5 style functionality in the new API
  prepareConfig(targetArch: ForgeArch) {
    this.config = typeof this.configFetcher === 'function' ? this.configFetcher(targetArch) : this.configFetcher;
  }

  /**
   * Makers must implement this method and return true or false indicating whether
   * this maker can be run on the current platform.  Normally this is just a process.platform
   * check but it can be a deeper check for dependencies like fake-root or other
   * required external build tools.
   *
   * If the issue is a missing dependency you should log out a HELPFUL error message
   * telling the developer exactly what is missing and if possible how to get it.
   */
  isSupportedOnCurrentPlatform(): boolean {
    if (this.isSupportedOnCurrentPlatform === Maker.prototype.isSupportedOnCurrentPlatform) {
      throw new Error(`Maker ${this.name} did not implement the isSupportedOnCurrentPlatform method`);
    }
    return true;
  }

  /**
   * Makers must implement this method and return an array of absolute paths
   * to the artifacts generated by your maker
   */
  async make(opts: MakerOptions): Promise<string[]> {
    if (this.make === Maker.prototype.make) {
      throw new Error(`Maker ${this.name} did not implement the make method`);
    }
    return [];
  }


  /**
   * Helpers
   */

  /**
   * Ensures the directory exists and is forced to be empty.
   *
   * I.e. If the directory already exists it is deleted and recreated, this
   * is a destructive operation
   */
  async ensureDirectory(dir: string): Promise<void> {
    if (await fs.pathExists(dir)) {
      await fs.remove(dir);
    }
    return fs.mkdirs(dir);
  }

  /**
   * Ensures the path to the file exists and the file does not exist
   *
   * I.e. If the file already exists it is deleted and the path created
   */
  async ensureFile(file: string): Promise<void> {
    if (await fs.pathExists(file)) {
      await fs.remove(file);
    }
    await fs.mkdirs(path.dirname(file));
  }

  /**
   * Checks if the given module is installed, used for testing if optional dependencies
   * are installed or not
   */
  isInstalled(module: string): boolean {
    try {
      require(module);
      return true;
    } catch (e) {
      // Package doesn't exist -- must not be installable on this platform
      return false;
    }
  }
}
