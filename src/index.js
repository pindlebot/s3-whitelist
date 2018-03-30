const fetch = require('node-fetch')
const AWS = require('aws-sdk')
const chalk = require('chalk')

const DEFAULT_STATEMENT_NAME = 'S3Whitelist'

const purple = chalk.hex('#E0B0FF')
const bold = chalk.bold

const log = (format, ...rest) => console.log(
  purple('[s3-whitelist]: ') + 
  format.replace(/%s/g, seq => bold(seq)),
  ...rest
)

const findIndex = (arr, predicate) => {
  let index = 0
  while (arr.length > index) {
    if (predicate(arr[index])) {
      break
    }
    index++
  }
  return index >= arr.length ? -1 : index
}

const getPublicIpAddress = () => 
  fetch('https://api.ipify.org?format=json', {
    headers: {
      'Content-type': 'application/json'
    }
  }).then(resp => resp.json())
    .then(resp => resp.ip)

class Base {
  constructor({
    accessKeyId,
    secretAccessKey,
    region,
    bucket
  }) {
    this.config = {
      bucket,
      region
    }
    AWS.config.update({
      accessKeyId,
      secretAccessKey,
      region
    })
    this.s3 = new AWS.S3()
  }

  async createStatement () {
    this.ipAddress = await getPublicIpAddress()
    return {
      Effect: 'Allow',
      Principal: '*',
      Action: 's3:*',
      Resource: `arn:aws:s3:::${this.config.bucket}/*`,
      Sid: DEFAULT_STATEMENT_NAME,
      Condition: {
        IpAddress: {
          'aws:SourceIp': this.ipAddress
        }
      }
    }
  }

  async getPolicy () {
    let json = '{}'
    try {
      const data = await this.s3.getBucketPolicy({
        Bucket: this.config.bucket
      }).promise()
      json = data.Policy
    } catch (err) {
      log(
        'Bucket %s does not currently have a policy. Creating a new one.',
        this.config.bucket
      )
    }
    return JSON.parse(json)
  }

  setPolicy (Policy) {
    return this.s3.putBucketPolicy({
      Bucket: this.config.bucket,
      Policy: JSON.stringify(Policy)
    }).promise()
  }

  async remove () {
    let Policy = await this.getPolicy()
    if (Policy && Policy.Statement) {
      let index = findIndex(
        Policy.Statement,
        statement => statement.Sid === DEFAULT_STATEMENT_NAME
      )
      if (index > -1) {
        let statement = {...Policy.Statement[index]}
        log(
          'Removing policy statement that ' +
          'whitelists IP address %s',
          statement.Condition.IpAddress['aws:SourceIp']
        )
        Policy.Statement.splice(index)
        await this.setPolicy(Policy)
      } else {
        log('Could not find policy statement generated by s3-policy to remove.')
      }
    } else {
      log(
        'Could not policy for bucket %s',
        this.config.bucket
      )
    }
  }

  async update () {
    let Policy = await this.getPolicy()
    let newStatement = await this.createStatement()

    if (Policy && Policy.Statement) {
      let index = findIndex(
        Policy.Statement,
        statement => statement.Sid === DEFAULT_STATEMENT_NAME
      ) 
      if (index > -1) {
        let statement = Policy.Statement[index]
        log('Updating policy statement %s', newStatement.Sid)
        Policy.Statement[index] = newStatement
      } else {
        log('Adding new statement %s to policy.', newStatement.Sid)
        Policy.Statement.push(newStatement)
      }
    } else {
      Policy = {
        Version: '2012-10-17',
        Statement: [
          newStatement
        ]
      }
      log(
        'Creating new policy with statement %s',
        newStatement.Sid
      )
    }
    await this.setPolicy(Policy)
    log(
      'Policy for bucket %s ' +
      'updated to allow access from IP address %s',
      this.config.bucket,
      this.ipAddress
    )
  }
}

module.exports = Base
