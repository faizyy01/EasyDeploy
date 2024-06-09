import { intro, outro, confirm, text, select, isCancel } from "@clack/prompts";
import { editAPIKey, getApiKey } from "./config.js";
import { chooseServer } from "./servers.js";

async function main() {
  try {
    let apiKey = await getApiKey();
    intro("Welcome to EasyDeploy!");

    while (true) {
      const selectedServer = await chooseServer(apiKey);
      if (selectedServer === "keys") {
        apiKey = await editAPIKey();
      } else {
        outro(`Your server is ${selectedServer}. Exiting...`);
        break;
      }
    }
  } catch (error) {
    console.error("An error occurred:", error.message);
    outro("Exiting due to an error.");
  }
}

main();
