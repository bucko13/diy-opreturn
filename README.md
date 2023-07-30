# DIY OP_RETURN

This is a command line tool for creating your own OP_RETURN transactions.

## Usage

The easiest way to run the program is to clone the repo
to your local machine and run the command line tool directly.

```shell
# after you've cloned it:
$ cd diy-opreturn
$ npm install
$ npm run cli -- help
```

This will give you the details for all available commands.

## Sample Process

Typically how this will work looks like this:

### 1. Generate public-private key pair and address

```shell
$ npm run cli key -- --network testnet --file
```

This will generate necessary spend and deposit information to a file. NOTE: This info includes the private
key. This will allow you to spend the funds you deposit
to the address in the OP_RETURN transaction

### 2. Deposit funds and get UTXO details

After step 1, you will have an address. Deposit funds
to this address. Note the txid. Look up the transaction
(e.g. on mempool.space) and note the index of the output
in the transaction. This is important because of the
way inputs in bitcoin transactions are serialized:
with the previous tx id (the id of the transaction
that created the utxo) and the index where the utxo
can be found.

### 3. Author and sign the transaction

The easiest way to pass relevant info to the program
is through a file. Save at least these details in a file called "data.json"

```json
{
  "wif": "[private key generated in step 1]",
  "fee": "[absolute fee to pay for the tx]",
  "utxo": "[txid:index]", // generated in previous step
  "changeAddress": "[address to send any change back to]"
}
```

Now you can create the transaction with your message. The command
will let you confirm details before finalizing.
Note the `--hash` parameter. This tells the program
to hash the message before including it in the output.

`--save` tells it to save the results in a file.

```shell
$ npm run cli transaction -- -file data.json -n testnet --message "foobarbaz" --hash --save
```

### 4. Broadcast the transaction

You can do this through any tool, through your own node, mempool.space website, etc. This lets you broadcast
from the command line using the data saved in the previous step.

```shell
$ npm run cli broadcast -- --network testnet --file transaction.json
```

You'll get a txid returned. Save this for future reference.

### 5. Verify the message

This is particularly useful if you hashed your message
and want to prove the integrity of the data you saved
in the future.

```shell
$ npm run cli prove -- -n testnet --txid="[txid]" --preimage "foobarbaz"
```

And you're done!

NOTES:

- Each command has its own help menu to learn about the different options
- Note that this is using npm scripts to run directly. So to pass command
  line args to the program you need the `--` separator after the command and
  before the arguments

## FAQ

- Q: What's an `OP_RETURN` transaction?
  - A: `OP_RETURN`s are a way to embed data directly on the blockchain in a transaction output without adding unnecessary bloat in the form of unspendable UTXOs.
- Why do I need this tool when others exist?
  - Fair question. You could use opentimestamps or the OP_RETURN bot, both perfectly fine tools. For some situations though, you might want to control and prove the providence of a particular piece of data embedded in the blockchain, i.e. by using UTXOs you control to pay for the transaction. Another reason might be to have the transaction ready to go ahead of time ready for you to broadcast at a time and place of your choosing.
