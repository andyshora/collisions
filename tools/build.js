/**
 * Babel Starter Kit | https://github.com/kriasoft/babel-starter-kit
 * Copyright (c) Konstantin Tarkus <hello@tarkus.me> | The MIT License
 */

import del from 'del';
import fs from './lib/fs';
import compile from './lib/compile';
import { rootDir } from './config';

// Clean output directories
const cleanup = async () => {
  await del(['build/*', 'lib/*', '!build/.git'], { dot: true });
  await fs.makeDir('build');
  await fs.makeDir('lib');
};

// Compile the source code into a distributable format
const src = async () => {
  const babel = require('babel');
  const files = await fs.getFiles('src');

  for (const file of files) {
    const source = await fs.readFile('src/' + file);
    const result = babel.transform(source);
    await fs.writeFile('lib/' + file, result.code);
    await fs.writeFile('lib/' + file.substr(0, file.length - 3) + '.babel.js', source);
  }
};

// Copy static files into the build folder
const assets = async () => {
  const files = await fs.getFiles('app');
  for (const file of files) {
    if (file.endsWith('.svg') || file.endsWith('.ico')) {
      await fs.copyFile('app/' + file, 'build/' + file);
    }
  }
};

// Compile and optimize CSS for the documentation site
const css = async () => {
  const source = await fs.readFile('./app/css/main.css');
  const output = await compile.css(source);
  await fs.makeDir('build/css');
  await fs.writeFile('build/css/main.min.css', output);
};

// Compile HTML pages for the documentation site
const html = async () => {
  let source;
  let output;
  const toUrl = filename => filename === 'index.md' ? '/' :
    filename.substr(0, filename.length - (filename.endsWith('index.md') ? 8 : 3));
  const files = await fs.getFiles('app');
  for (const file of files) {
    if (file.endsWith('.md')) {
      source = await fs.readFile('app/' + file);
      output = await compile.md(source, {
        root: rootDir,
        url: toUrl(file),
        fileName: '/app/' + file,
      });
      await fs.writeFile('build/' + file.substr(0, file.length - 3) + '.html', output);
    }
  }
};

// Bundle and optmize JavaScript code for the documentation site
const javascript = async (debug) => {
  const fileName = debug ? 'main.js' : 'main.min.js';
  const output = await compile.js({ debug: debug });
  await fs.makeDir('app/js');
  await fs.writeFile(`app/js/${ fileName }`, output);
};

// Run all build steps in sequence
export default async () => {
  try {
    console.log('clean');
    await cleanup();
    console.log('compile src');
    await src();
    console.log('compile css');
    await css();
    console.log('compile html');
    await html();
    console.log('compile javascript');
    await javascript(true);
    await javascript(false);
    console.log('copy static files');
    await assets();
  } catch (err) {
    console.error(err.stack);
  }
};
