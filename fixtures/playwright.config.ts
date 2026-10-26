import {configureBrowser} from '../scripts/browser.mjs';
import { defineConfig } from '@playwright/test';
const browserConfig=configureBrowser();
export default defineConfig({ testDir:'tests', workers:1, retries:0, timeout:10000, reporter:'list', outputDir:'../artifacts/fixture-current', use:{launchOptions:{executablePath:browserConfig.executablePath},headless:true,screenshot:'on',video:'on',trace:'on'} });
