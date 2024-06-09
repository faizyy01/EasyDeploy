import { intro, outro, text } from "@clack/prompts";
import fs from "fs";
import path from "path";
import os from "os";

const CONFIG_PATH = path.join(os.homedir(), ".easydeploy_config.json");

function loadConfig() {
  if (fs.existsSync(CONFIG_PATH)) {
    const configData = fs.readFileSync(CONFIG_PATH);
    return JSON.parse(configData);
  }
  return {};
}

function saveConfig(config) {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
}

async function getApiKey() {
  let config = loadConfig();
  if (!config.apiKey) {
    config.apiKey = await text({
      message: "Please enter your Hetzner API key:",
    });
    saveConfig(config);
    outro("API key saved.");
  }
  return config.apiKey;
}

async function editAPIKey() {
  let config = loadConfig();
  config.apiKey = await text({
    message: "Please enter your Hetnzer API key:",
    defaultValue: config.apiKey,
  });
  saveConfig(config);
  outro("API key saved.");
  return config.apiKey;
}

export { getApiKey, editAPIKey };
