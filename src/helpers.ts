import { Transaction, script } from "bitcoinjs-lib";
import { createHash } from "crypto";
import { prompt } from "enquirer";
import { existsSync, writeFileSync } from "fs";
import { extname } from "path";

export type BitcoinNetwork = "bitcoin" | "mainnet" | "testnet" | "regtest";

export const getNetwork = (network: BitcoinNetwork) => {
  let _network: BitcoinNetwork;
  if (network === "mainnet") {
    _network = "bitcoin";
  } else {
    _network = network;
  }
  return _network;
};

export const saveToFile = (
  fileName: string,
  contents: Record<string, unknown>,
) => {
  let outputFileName = `${fileName}.json`;
  let index = 0;
  if (existsSync(outputFileName)) {
    index = 1;
    // If the file exists, find the latest index
    while (existsSync(`${fileName}_${index}.json`)) {
      index++;
    }
  }

  outputFileName = index === 0 ? outputFileName : `${fileName}_${index}.json`;

  writeFileSync(outputFileName, JSON.stringify(contents, null, 2));

  console.log(`Results saved in: ${outputFileName}`);
};

const validatePath = (pathName: string, extension: string) => {
  if (existsSync(pathName) && extname(pathName) === `.${extension}`) {
    return true;
  }
  return false;
};

export const getFile = async (
  pathName: string | boolean,
  extension = "json",
): Promise<string> => {
  if (pathName === true) {
    const { file } = await prompt<{ file: string }>({
      type: "input",
      name: "file",
      message: "Input relative path to file with data",
      validate: (value) => validatePath(value, extension),
    });
    return file;
  } else if (
    typeof pathName !== "string" ||
    !validatePath(pathName, extension)
  ) {
    throw new Error("Invalid file path.");
  } else if (typeof pathName === "string") {
    return pathName;
  } else {
    throw new Error("Something went wrong with the file path");
  }
};

export const getHash = (preimage: string) => {
  const hash = createHash("sha256");
  hash.update(preimage);
  return hash.digest();
};

export const getOpReturnFromTx = (rawHex: string) => {
  const tx = Transaction.fromHex(rawHex);
  let message;
  for (const out of tx.outs) {
    const asm = script.toASM(out.script);
    if (asm.includes("OP_RETURN")) {
      message = Buffer.from(asm.split(" ")[1], "hex").toString("hex");
      break;
    }
  }
  return message;
};

export const getFeeRate = (rawHex: string, fee: number) => {
  const decodedTx = Transaction.fromHex(rawHex);
  // Calculate the transaction size in bytes
  const transactionSizeBytes = decodedTx.byteLength();

  // Calculate the fee rate per vbyte (in satoshis/vbyte)
  const feeRateSatoshisPerVbyte = fee / transactionSizeBytes;
  return feeRateSatoshisPerVbyte;
};
