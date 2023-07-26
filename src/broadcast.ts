import { readFileSync } from "fs";
import { BitcoinNetwork, getFile } from "./helpers";
import confirm from "@inquirer/confirm";
import axios from "axios";

export const broadcast = async ({
  file,
  transaction,
  network,
}: {
  file?: boolean | string;
  network: BitcoinNetwork;
  transaction?: string;
}) => {
  let tx;
  if (file) {
    const filePath = await getFile(file);
    const data = JSON.parse(readFileSync(filePath, "utf8"));
    tx = data.tx;
  }

  if (transaction) {
    tx = transaction;
  }

  const host =
    network === "mainnet"
      ? "https://blockstream.info/api"
      : `https://blockstream.info/${network}/api`;

  if (
    await confirm({
      message: `Are you sure you want to broadcast this transaction to the ${network} bitcoin network?`,
    })
  ) {
    try {
      const { data } = await axios.post(`${host}/tx`, tx);
      console.log(`Broadcast successful: ${data}`);
    } catch (e: any) {
      console.error(e.response.data);
    }
  } else {
    console.log("Broadcast cancelled");
  }
};
