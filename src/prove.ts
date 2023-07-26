import mempoolJS from "@mempool/mempool.js";
import { BitcoinNetwork, getHash, getOpReturnFromTx } from "./helpers";
import assert from "assert";

export const prove = async ({
  txid,
  preimage,
  hex,
  network,
}: {
  txid?: string;
  preimage: string;
  hex?: string;
  network: BitcoinNetwork;
}) => {
  let _hex = hex;
  if (!txid && !hex) {
    throw new Error(
      "Requires either a transaction hex or a txid to look up the hex with",
    );
  } else if (txid && !hex) {
    const {
      bitcoin: { transactions },
    } = mempoolJS({
      hostname: "mempool.space",
      network: network,
    });
    try {
      _hex = await transactions.getTxHex({ txid });
    } catch (e: any) {
      throw new Error(
        `Problem requesting tx from mempool.space: ${e?.response?.data}`,
      );
    }
  }

  assert(_hex, "Unable to get transaction hex");
  const message = getOpReturnFromTx(_hex);

  if (!message) {
    console.error("Could not find OP_RETURN in provided transaction");
    return;
  }

  if (message === preimage) {
    console.log(`Found message "${message}" in transaction`);
    return;
  }

  const hash = getHash(preimage).toString("hex");
  console.log("hash", hash);
  console.log("message:", message);
  if (hash === message) {
    console.log(
      `🎉 Success! 🎉
🕵️ Hash of "${preimage}" (${message}) found in transaction.`,
    );
    return;
  }

  console.error(
    `No OP_RETURN found with matching message "${preimage}". Only found ${message} in transaction`,
  );
};
