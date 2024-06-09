import { intro, outro, confirm, text, select, isCancel } from "@clack/prompts";
import axios from "axios";

const locationMapping = {
  ash: { name: "USA", flag: "🇺🇸" },
  hel: { name: "Finland", flag: "🇫🇮" },
  hel1: { name: "Finland", flag: "🇫🇮" },
  nbg: { name: "Germany", flag: "🇩🇪" },
  hil: { name: "Germany", flag: "🇺🇸" },
  fsn1: { name: "Germany", flag: "🇩🇪" },
  nbg1: { name: "Germany", flag: "🇩🇪" },
};

async function fetchServers(apiKey) {
  const response = await axios.get(
    "https://api.hetzner.cloud/v1/server_types",
    {
      headers: { Authorization: `Bearer ${apiKey}` },
    }
  );
  if (response.status !== 200) {
    throw new Error("Failed to fetch servers.");
  }
  return response.data;
}

async function filterServers(servers, vCPUType) {
  const cpuType = vCPUType === "Dedicated" ? "dedicated" : "shared";
  return servers.server_types
    .filter(
      (server) =>
        server.architecture === vCPUType && server.cpu_type === cpuType
    )
    .sort(
      (a, b) => a.prices[0].price_monthly.net - b.prices[0].price_monthly.net
    );
}

function formatCurrency(value) {
  return (Math.round(parseFloat(value) * 100) / 100).toFixed(2);
}

function formatTraffic(value) {
  //value is in megabytes, convert to GB
  value = value / 1024 / 1024 / 1024 / 1024;
  return value;
}

function formatServerOptions(servers) {
  return servers.map((server) => {
    const cheapestLocation = server.prices.reduce((min, price) =>
      min.price_monthly.net < price.price_monthly.net ? min : price
    );
    const locationInfo = getLocations(server);

    // Define fixed column widths
    const nameWidth = 6;
    const vCPUWidth = 4;
    const ramWidth = 4;
    const diskWidth = 5;
    const trafficWidth = 6;
    const flags = locationInfo.split(", ");
    const locationWidth = 8 + flags.length * 3; // Adjust based on the number of flags
    const priceWidth = 7;

    // Create a padded label for a table-like structure
    const label = [
      `Server ${server.name.padEnd(nameWidth, " ")}`,
      `${server.cores.toString().padEnd(vCPUWidth, " ")} vCPUs`,
      `${`${server.memory}GB`.toString().padEnd(ramWidth, " ")} RAM`,
      `${`${server.disk}GB`.toString().padEnd(diskWidth, " ")} Disk`,
      `${`${formatTraffic(server.included_traffic)}GB`.padEnd(
        trafficWidth,
        " "
      )} Traffic`,
      locationInfo.padEnd(locationWidth, " "),
      `for ${formatCurrency(cheapestLocation.price_monthly.net).padEnd(
        priceWidth,
        " "
      )} €/month`,
    ].join(" | ");

    return {
      value: server.id,
      label: label,
    };
  });
}

function getLocations(server) {
  // Get all flags for the server
  const flags = server.prices.map(
    (price) => locationMapping[price.location].flag
  );

  // Sort flags according to the specified order
  const order = ["🇩🇪", "🇫🇮", "🇺🇸"];
  flags.sort((a, b) => order.indexOf(a) - order.indexOf(b));

  // Use a Set to ensure the uniqueness of flags and maintain order
  const uniqueOrderedFlags = Array.from(new Set(flags));

  // Join the unique, ordered flags with commas
  return uniqueOrderedFlags.join(", ");
}

async function chooseVcpuType() {
  const vCPUType = await select(
    {
      message: "Choose a vCPU type:",
      options: [
        { value: "x86", label: "Shared vCPU Intel/AMD" },
        { value: "arm", label: "Shared vCPU ARM" },
        { value: "Dedicated", label: "Dedicated vCPU" },
        { value: "keys", label: "Edit Api Key" },
        { value: "Exit", label: "Exit" },
      ],
    },
    { defaultValue: "arm" }
  );

  if (vCPUType === "keys") {
    return "keys";
  }
  if (vCPUType === "Exit") {
    outro("Exiting by user choice.");
    process.exit(0);
  }
  return vCPUType;
}

async function chooseServer(apiKey) {
  const vCPUType = await chooseVcpuType();

  if (vCPUType === "keys") {
    return "keys";
  }

  const servers = await fetchServers(apiKey);

  const filteredServers = await filterServers(servers, vCPUType);
  if (filteredServers.length === 0) {
    text("No servers found for the selected vCPU type.");
    outro("Exiting...");
    return;
  }

  const selectedServer = await select({
    message: "Choose a server:",
    options: formatServerOptions(filteredServers),
  });
  return selectedServer;
}

export {
  fetchServers,
  filterServers,
  formatCurrency,
  formatTraffic,
  formatServerOptions,
  getLocations,
  chooseVcpuType,
  chooseServer,
};
