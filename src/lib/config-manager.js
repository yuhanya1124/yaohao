import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { CONFIG_DIR, CONFIG_FILE, DEFAULT_CITY } from '../constants.js';

export function getConfigDir() {
  return join(homedir(), CONFIG_DIR);
}

export function getConfigPath() {
  return join(getConfigDir(), CONFIG_FILE);
}

export function ensureConfigDir() {
  const dir = getConfigDir();
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

export function loadConfig() {
  const configPath = getConfigPath();
  if (!existsSync(configPath)) {
    return null;
  }
  const raw = readFileSync(configPath, 'utf-8');
  return JSON.parse(raw);
}

export function saveConfig(config) {
  ensureConfigDir();
  const configPath = getConfigPath();
  writeFileSync(configPath, JSON.stringify(config, null, 4), 'utf-8');
}

function defaultUser() {
  return {
    default_city: DEFAULT_CITY,
    reg_type: 'PTC',
    apply_type: 'person',
    notify_urls: [],
  };
}

export function getUser() {
  const config = loadConfig();
  if (!config || !Array.isArray(config.users) || config.users.length === 0) {
    return null;
  }
  return config.users[0];
}

export function updateUser(updates) {
  let config = loadConfig();
  if (!config) {
    config = { users: [defaultUser()] };
  }
  if (!Array.isArray(config.users) || config.users.length === 0) {
    config.users = [defaultUser()];
  }
  Object.assign(config.users[0], updates);
  saveConfig(config);
}

export function isInitialized() {
  return loadConfig() !== null;
}
