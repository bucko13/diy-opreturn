import mempoolJS from "@mempool/mempool.js";
import { BitcoinNetwork, getFile, getHash, getOpReturnFromTx } from "./helpers";
import assert from "assert";
import { readFileSync } from "fs";
import _ from "lodash";

interface TxData {
  txid?: string;
  preimage: string;
  hex?: string;
  network: BitcoinNetwork;
}
export const prove = async ({
  txid,
  preimage,
  hex,
  network,
  file,
}: TxData & {
  file: boolean | string;
}) => {
  let data: TxData = { txid, preimage, hex, network };
  if (file) {
    const filePath = await getFile(file);
    const fileData: TxData = JSON.parse(readFileSync(filePath, "utf8"));
    data = _.merge(fileData, data);
  }

  if (!data.txid && !data.hex) {
    throw new Error(
      "Requires either a transaction hex or a txid to look up the hex with",
    );
  } else if (data.txid && !data.hex) {
    const {
      bitcoin: { transactions },
    } = mempoolJS({
      hostname: "mempool.space",
      network: network,
    });
    try {
      data.hex = await transactions.getTxHex({ txid: data.txid });
    } catch (e: any) {
      throw new Error(
        `Problem requesting tx from mempool.space: ${e?.response?.data}`,
      );
    }
  }

  assert(data.hex, "Unable to get transaction hex");
  const message = getOpReturnFromTx(data.hex);

  if (!message) {
    console.error("Could not find OP_RETURN in provided transaction");
    return;
  }

  if (message === data.preimage) {
    console.log(`Found message "${message}" in transaction`);
    return;
  }

  const hash = getHash(data.preimage).toString("hex");
  console.log("hash", hash);
  console.log("message:", message);
  if (hash === message) {
    console.log(
      `🎉 Success! 🎉
🕵️ Hash of "${data.preimage}" (${message}) found in transaction.`,
    );
    return;
  }

  console.error(
    `No OP_RETURN found with matching message "${data.preimage}". Only found ${message} in transaction`,
  );
};
