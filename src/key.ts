import * as bitcoin from "bitcoinjs-lib";
import { BitcoinNetwork, getNetwork, saveToFile } from "./helpers";

export const getKey = ({
  network,
  file,
  output,
}: {
  network: BitcoinNetwork;
  file: string;
  output: boolean;
}) => {
  const _network = getNetwork(network);
  const n: bitcoin.Network = bitcoin.networks[_network];

  const keypair = bitcoin.ECPair.makeRandom({ network: n });

  const payments = bitcoin.payments.p2wpkh({
    pubkey: keypair.publicKey,
    network: n,
  });

  const results: Record<string, string | void> = {
    wif: keypair.toWIF(),
    pubkey: keypair.publicKey.toString("hex"),
    address: payments.address,
  };

  if (!output && !file) {
    console.error("Neither <file> or <output> option passed.");
    return;
  }

  if (output) {
    for (const key in results) {
      console.log(`${key}: ${results[key]}`);
    }
  } else {
    console.log(`Deposit funds to this address: ${results.address}`);
  }

  if (file) {
    saveToFile("results", results);
  }
};
