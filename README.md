<img src="https://github.com/remotion-dev/template-next/assets/1629785/9092db5f-7c0c-4d38-97c4-5f5a61f5cc098" />
<br/>
<br/>

This is a Next.js template for building programmatic video apps, with [`@remotion/player`](https://remotion.dev/player) and [`@remotion/lambda`](https://remotion.dev/lambda) built in.

This template uses the Next.js Pages directory. There is a [App directory version](https://github.com/remotion-dev/template-next-app-dir) of this template available.

<img src="https://github.com/remotion-dev/template-next/assets/1629785/c9c2e5ca-2637-4ec8-8e40-a8feb5740d88" />

## Getting Started

[Use this template](https://github.com/new?template_name=template-next-pages-dir&template_owner=remotion-dev) to clone it into your GitHub account. Run

```
yarn
```

afterwards. Alternatively, use this command to scaffold a project:

```
npx create-video@latest --next-pages-dir
```

## Commands

Start the Next.js dev server:

```
yarn run dev
```

Open the Remotion Studio:

```
npx remotion studio
```

Render a video locally:

```
yarn remotion render
```

Upgrade Remotion:

```
yarn remotion upgrade
```

The following script will set up your Remotion Bundle and Lambda function on AWS:

```
node deploy.mjs
```

You should run this script after:

- changing the video template
- changing `config.mjs`
- upgrading Remotion to a newer version

## Set up rendering on AWS Lambda

This template supports rendering the videos via [Remotion Lambda](https://remotion.dev/lambda).

1. Copy the `.env.example` file to `.env` and fill in the values.
   Complete the [Lambda setup guide](https://www.remotion.dev/docs/lambda/setup) to get your AWS credentials.

1. Edit the `config.mjs` file to your desired Lambda settings.

1. Run `node deploy.mjs` to deploy your Lambda function and Remotion Bundle.

## Docs

Get started with Remotion by reading the [fundamentals page](https://www.remotion.dev/docs/the-fundamentals).

## Help

We provide help on our [Discord server](https://remotion.dev/discord).

## Issues

Found an issue with Remotion? [File an issue here](https://remotion.dev/issue).

## License

Note that for some entities a company license is needed. [Read the terms here](https://github.com/remotion-dev/remotion/blob/main/LICENSE.md).
