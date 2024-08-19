import { register } from 'ts-node';
import { register as registerLoader } from 'node:module';
import { pathToFileURL } from 'node:url';

// Register ts-node with your desired options

register({
  project: './tsconfig.json',
  transpileOnly: true
});

// Register ts-node/esm loader
registerLoader('ts-node/esm', pathToFileURL('./'));