import {
  ECPair,
  Network,
  Payment,
  Psbt,
  networks,
  payments,
} from "bitcoinjs-lib";
import {
  getFeeRate,
  getFile,
  getHash,
  getNetwork,
  getOpReturnFromTx,
  saveToFile,
} from "./helpers";
import mempoolJS from "@mempool/mempool.js";
import confirm from "@inquirer/confirm";
import assert from "assert";
import { readFileSync } from "fs";
import _ from "lodash";

type BitcoinNetwork = "bitcoin" | "mainnet" | "testnet" | "regtest";

interface TxData {
  network: BitcoinNetwork;
  utxo: string;
  wif: string;
  changeAddress: string;
  fee: number;
  utxoScript?: string;
  utxoValue?: number;
}

export const handleTx = async ({
  file,
  network,
  utxo,
  wif,
  changeAddress,
  fee,
  message,
  hash,
  output,
  save,
}: {
  file: boolean | string;
  network: BitcoinNetwork;
  utxo: string;
  wif: string;
  changeAddress: string;
  fee: number;
  message: string;
  hash: boolean;
  output: boolean;
  save: boolean;
}) => {
  let data: TxData = { utxo, network, wif, changeAddress, fee };
  if (file) {
    const filePath = await getFile(file);
    const fileData: TxData = JSON.parse(readFileSync(filePath, "utf8"));
    data = _.merge(fileData, data);
  }

  const n: Network = networks[getNetwork(data.network)];

  const alice = ECPair.fromWIF(data.wif, n);

  let prevTx: string, prevTxIndex: number;

  const utxoParts = data.utxo.split(":");

  prevTx = utxoParts[0];
  prevTxIndex = +utxoParts[1];

  if (!prevTx || prevTxIndex === undefined) {
    console.error("Require utxo in format [prevTxHash:prevTxIndex]");
    console.error(`Instead got "${data.utxo}"`);
    return;
  }

  const {
    bitcoin: { transactions },
  } = mempoolJS({
    hostname: "mempool.space",
    network: network,
  });

  if (!data.utxoScript && !data.utxoValue) {
    console.warn("Missing utxoScript and utxoValue for input.");
    console.warn("Checking mempool.space");
    const tx = await transactions.getTx({ txid: prevTx });
    data.utxoScript = tx.vout[prevTxIndex].scriptpubkey;
    data.utxoValue = +tx.vout[prevTxIndex].value;
    console.log("Got utxo data ✅");
  }

  assert(
    data.utxoScript && data.utxoValue,
    "Unable to get input script and value",
  );

  const outputValue = data.utxoValue - data.fee;

  let embed: Payment;

  if (!hash) {
    const raw = Buffer.from(message, "utf8");
    console.log(`message length is ${Buffer.byteLength(raw)}`);
    console.log("raw: ", raw);
    if (Buffer.byteLength(raw) > 40)
      return console.error("Message is too long. Must be <= 40 bytes");
    embed = payments.embed({ data: [raw] });
  } else {
    const secret = getHash(message);
    embed = payments.embed({ data: [secret] });
  }

  assert(embed && embed.output, "No data to embed");

  const input = {
    hash: prevTx,
    index: prevTxIndex,
    witnessUtxo: {
      script: Buffer.from(data.utxoScript, "hex"),
      value: data.utxoValue,
    },
  };

  if (!Buffer.isBuffer(input.hash) && typeof input.hash !== "string")
    return console.error("problem with input hash");

  const psbt = new Psbt({ network: n })
    .addInput(input)
    .addOutput({
      address: data.changeAddress,
      value: outputValue,
    })
    .addOutput({
      script: embed.output,
      value: 0,
    })
    .signInput(0, alice);

  assert(psbt.validateSignaturesOfAllInputs(), "Signed PSBT failed validation");
  psbt.finalizeAllInputs();

  const rawTx = psbt.extractTransaction().toHex();
  const verifyMessage = getOpReturnFromTx(rawTx);
  const feeRate = getFeeRate(rawTx, data.fee);
  const confirmDetails = await confirm({
    message: `Verify transaction details:
    
- Sending ${outputValue} satoshis back to change address ${data.changeAddress}
- Fee rate: ${feeRate.toFixed(2)} sats/vbyte (total fees: ${data.fee})
- OP_RETURN message ${verifyMessage}
- preimage of "${message}". 

Confirm?`,
  });

  if (!confirmDetails) {
    return;
  }
  if (!output && !save) {
    console.error(
      "Neither output to console or to a file are enabled. Your results have been absorbed into the ether.",
    );
  }

  if (output) {
    console.log(rawTx);
    console.log(`Preimage: ${message}`);
  }

  if (save) {
    saveToFile("transaction", { tx: rawTx, preimage: message });
  }
};
