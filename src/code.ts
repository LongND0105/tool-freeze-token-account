import * as readline from 'readline';
import chalk from 'chalk';

import { 
  Connection, 
  Keypair, 
  PublicKey, 
  Transaction, 
  sendAndConfirmTransaction, 
  clusterApiUrl,
  TransactionSignature,
} from '@solana/web3.js';
import { createFreezeAccountInstruction } from '@solana/spl-token';
import bs58 from 'bs58';
import { Buffer } from 'buffer';

var payer: any;
var freezeAuthority: any;
var tokenMint: any;

// const endpoint = 'https://shy-purple-friday.solana-mainnet.quiknode.pro/fc6faaf9a0febd9e3b1d1e681110da4b1b7e4e05/';

const endpoint = 'https://api.devnet.solana.com';

const connection = new Connection(endpoint, 'confirmed');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function showMenu() {
  console.log(chalk.bgGreenBright("\nA simple tool for freeze token account"));
  console.log(chalk.bgBlue("1. Add a privateKey for sign__________"));
  console.log(chalk.bgCyan("2. Add a privateKey for freeze________"));
  console.log(chalk.bgBlue("3. Add a token address for tracking___"));
  console.log(chalk.bgCyan("4. Going to freeze token account______"));
  console.log(chalk.bgBlue("5. Exit_______________________________"));
}

function showQuestion() {
  rl.question(chalk.yellow("👉 Select one [1-5]: "), handleChoice);
}

function exitTool() {
  rl.close();
}

function addKeyForSignHandler() {
  rl.question(chalk.yellow("👉 Paste a private key: "), (privateKey) => {
    try {
      var payerSecretKey = Buffer.from(bs58.decode(privateKey));
      payer = Keypair.fromSecretKey(new Uint8Array(payerSecretKey));
      freezeAuthority = Keypair.fromSecretKey(new Uint8Array(payerSecretKey));
      console.log(chalk.green('=> Success'));
    } 
    catch (err) {
      console.error(chalk.red(err));
    }

    showMenu();
    showQuestion();
  });
}

function addKeyForFreezeHandler() {
  rl.question("👉 Paste a private key: ", (privateKey) => {
    try {
      console.log(`=> ${privateKey}`);
      var freezeAuthoritySecretKey = Buffer.from(bs58.decode(privateKey));
      freezeAuthority = Keypair.fromSecretKey(new Uint8Array(freezeAuthoritySecretKey));
      console.log(chalk.green('=> Success'));
    } 
    catch (err) {
      console.error(chalk.red(err));
    }

    showMenu();
    showQuestion();
  });
}

function addTokenMintHandler() {
  rl.question("👉 Paste a token address: ", (tokenAddress) => {
    try {
      console.log(`=> ${tokenAddress}`);
      tokenMint = new PublicKey(tokenAddress);
      console.log(chalk.green('=> Success'));
    } 
    catch (err) {
      console.error(chalk.red(err));
    }

    showMenu();
    showQuestion();
  });
}

async function freezeTokenAccountHandler() {
  rl.question("👉 Paste a wallet address: ", async (walletAddress) => {
    try {
      console.log(`=> ${walletAddress}`);
      console.log('mint: ', tokenMint);

      var wallet = new PublicKey(walletAddress);

      const response = await connection.getParsedTokenAccountsByOwner(wallet, {mint: tokenMint}, 'confirmed');

      response.value.forEach(async (item, _) => {
        const accountInfo = item.account;
        const parsedInfo = accountInfo.data.parsed.info;

        var tokenAccount = new PublicKey(item.pubkey.toBase58());
        var state = parsedInfo.state;

        console.log(chalk.blue(`Token account: ${item.pubkey.toBase58()}`));
        console.log(chalk.blue(`State: ${parsedInfo.state}`));
        
        if (state != "frozen") {
          try {
            console.log(chalk.green('\nToken have not frozen yet'));
            var signature = await freezeTokenAccount(connection, payer as Keypair, tokenMint, tokenAccount, freezeAuthority);
            console.log(chalk.blue('\nSignature:', signature));
            console.log('\nThe token account has been successfully frozen');
          } 
          catch (error) {
            console.error(chalk.red('\nFailed to freeze token account with \n', error));
          }
        } else {
          console.error(chalk.red('\nToken has been frozen.'));
        }
      });
  
    } 
    catch (error) {
      console.error(chalk.red(error));
    }

    showMenu();
    showQuestion();
  });
}

async function freezeTokenAccount(
  connection: Connection,
  payer: Keypair,
  tokenMint: PublicKey,
  tokenAccountToFreeze: PublicKey,
  freezeAuthority: Keypair
): Promise<any> {
  // Tạo một giao dịch mới
  let transaction = new Transaction();

  // Thêm lệnh freezeAccount vào giao dịch
  transaction.add(
    createFreezeAccountInstruction(
      tokenAccountToFreeze,
      tokenMint,
      freezeAuthority.publicKey,
      []
    )
  );

  // Gửi và xác nhận giao dịch
  var signature = await sendAndConfirmTransaction(connection, transaction, [payer, freezeAuthority]);
  
  return signature as string;
}

function handleChoice(choice: string) {
  switch (choice) {
    case '1':
      addKeyForSignHandler();
      break;

    case '2':
      addKeyForFreezeHandler();
      break;

    case '3':
      addTokenMintHandler();
      break;

    case '4':
      freezeTokenAccountHandler();
      break;

    case '5':
      console.log("Thank you!");
      exitTool();
      break;

    default:
      console.log("Invalid");
      showMenu();
      showQuestion();
  }
}

function main() {
  showMenu();
  showQuestion();
}

main();