## s3-whitelist

s3-whitelist is a super simple cli tool for AWS S3. It does one thing: whitelists your public ip address to allow access to an s3 bucket for local development.

## Installation

```bash
npm install -g s3-whitelist
```

## Usage

```bash
s3-whitelist --bucket myBucket --region us-east-1
```

### Arguments

**bucket** (required)
Your S3 bucket name.

**region** (default: us-east-1)
AWS region.

If your credentials are not set locally in `~/.aws/credentials` You can also explicitly provide credentials as arguments:
 - **accessKeyId** (optional)
 - **secretAccessKey**

### Commands

`s3-whitelist` by default updates your bucket policy to whitelist your public ip address.

You can remove the added statement from your bucket policy with the command `s3-whitelist remove`. 


## Notes

- At the moment s3-whitelist requires node v9.x.