import { defineConfig } from '@playwright/test';
export default defineConfig({ testDir:'tests', workers:1, retries:0, timeout:10000, reporter:'list', outputDir:'../artifacts/fixture-current', use:{launchOptions:{executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH},headless:true,screenshot:'on',video:'on',trace:'on'} });
