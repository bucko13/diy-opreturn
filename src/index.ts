#!/usr/bin/env node

import { Option, program } from "commander";
import { getKey } from "./key";
import { handleTx } from "./transaction";
import { broadcast } from "./broadcast";
import { prove } from "./prove";

program
  .name("My OP_RETURN Bot")
  .version("1.0.0")
  .description(
    `A simple CLI app for funding and preparing an OP_RETURN message tx.
- Create a key-pair and address
- author and sign tx spending funds w/ an OP_RETURN output \
(message can be optionally hashed for greater privacy), 
- broadcast the transaction
- prove the existence of a message (including hashed) in a given transaction`,
  );

const networks = ["mainnet", "testnet", "regtest", "signet"];
program
  .command("key")
  .description("Get an address to deposit funding funds along with private key")
  .option(
    "-f, --file",
    "Save results to a file. Only run this in a place you trust to save your private key too.",
  )
  .option("-o --output", "Output to stdout instead of to a file")
  .addOption(
    new Option("-n, --network <network>")
      .choices(networks)
      .makeOptionMandatory(),
  )
  .action(getKey);

program
  .command("transaction")
  .description(
    `Create and sign the transaction. \
This command supports passing in a file with arguments or as command line args. \
Any command line args will overwrite values from file. Fields marked as required in help \
are required in either the file or via command line arguments.`,
  )
  .option(
    "-f, --file [fileName]",
    "If true, you will be prompted for a path to a file name",
  )
  .option(
    "-m, --message <message>",
    "The message to encode in the transaction outputs.",
  )
  .addOption(
    new Option("-n, --network <network>")
      .choices(networks)
      .makeOptionMandatory(),
  )
  .option(
    "--utxo <utxo>",
    "The previous tx hash and output index [hash:index] (required)",
  )
  .option(
    "--wif <wif>",
    "WIF of the public key that received the utxo to spend (required)",
  )
  .option(
    "--change <changeAddress>",
    "Address to send change back to. (required)",
  )
  .option("--fee <fee>", "Fee in satoshis (required)")
  .option(
    "-h --hash",
    "Hash the message to encode in the transaction instead of plaintext",
  )
  .option("-o --output", "Whether or not to output results to screen.")
  .option("-s --save", "Whether or not to save results to a file")
  .action(handleTx);

program
  .command("broadcast")
  .description(
    "Broadcast a raw transaction through mempool.space. Transaction can be passed in a json file or from command line. CLI arg takes precedence.",
  )
  .option(
    "-f, --file [fileName]",
    "If true, you will be prompted for a path to a file name",
  )
  .option(
    "-t --transaction <transaction>",
    "Raw transaction hex to broadcast. Can be passed via json in file or cli arg",
  )
  .addOption(
    new Option("-n, --network <network>")
      .choices(networks)
      .makeOptionMandatory(),
  )
  .action(broadcast);

program
  .command("prove")
  .description("Prove the existence of a message in a transaction")
  .option("-t, --txid <txid>", "Txid to check")
  .option(
    "-p, --preimage <preimage>",
    "Hash preimage to check for the existence of in the transaction",
  )
  .option(
    "-h, --hex  <hex>",
    "Raw hex of transaction to confirm. If provided No network call will be made.",
  )
  .addOption(new Option("-n, --network <network>").choices(networks))
  .option(
    "-f, --file [fileName]",
    "Path to file with arguments instead of via cli arguments",
  )
  .action(prove);

program.parse(process.argv);
