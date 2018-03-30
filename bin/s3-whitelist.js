#!/usr/bin/env node
const Base = require('../src')
const AWS_REGIONS = require('../src/aws-regions')
const yargonaut = require('yargonaut')
const chalk = yargonaut.chalk()

const argv = require('yargs')
  .option(chalk.cyan('bucket'), {
    type: 'string',
    describe: chalk.cyan('AWS bucket name')
  })
  .option(chalk.magenta('region'), {
    choices: AWS_REGIONS,
    default: 'us-east-1',
    describe: chalk.magenta('AWS bucket region')
  })
  .option(chalk.gray('accessKeyId'), {
    type: 'string',
    default: process.env.AWS_ACCESS_KEY_ID,
    describe: chalk.gray('AWS access key ID')
  })
  .option(chalk.gray('secretAccessKey'), {
    type: 'string',
    default: process.env.AWS_SECRET_ACCESS_KEY,
    describe: chalk.gray('AWS secret access key')
  })
  .command(
    'add',
    chalk.green('Add or update bucket policy statement'),
    () => {},
    async argv => {
      const base = new Base(argv)
      try {
        await base.update()
        process.exit(0)
      } catch (err) {
        process.exit(1)
      }
  })
  .command(
    'remove',
    chalk.red('Remove bucket policy statement'),
    () => {},
    async argv => {
      const base = new Base(argv)
      try {
        await base.remove()
        process.exit = 0
      } catch (err) {
        process.exit = 1
      }
  })
  //.demandOption(['bucket'])
  .argv

