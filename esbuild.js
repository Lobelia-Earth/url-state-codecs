/**
 * @typedef {import("esbuild").Metafile} Metafile
 */

import { writeFile, rm } from 'fs/promises';
import { join } from 'path';
import * as esbuild from 'esbuild';

const metafilePath = join(import.meta.dirname, 'esbuild.metafile.json');
const analysisPath = join(import.meta.dirname, 'esbuild.metafile.txt');

const extensionlessPaths = [
  'main',
  'codecs/base64JsonCodec',
  'codecs/booleanCodec',
  'codecs/iso8601DateCodec',
  'codecs/numberCodec',
  'codecs/stringCodec',
  'codecs/wrappers/arrayOf',
  'codecs/wrappers/nullable',
  'codecs/wrappers/withDeflateRaw',
  'codecs/wrappers/withNaN',
  'codecs/wrappers/withRfc6902JsonPatch',
];

await rm('./dist', { force: true, recursive: true });

const buildPromises = extensionlessPaths.map((path) => {
  const srcPath = `./src/${path}.ts`;
  const distPath = `./dist/${path}.js`;

  console.log(`Starting build: ${srcPath} → ${distPath}`);
  const minifiedPromise = esbuild.build({
    entryPoints: [srcPath],
    bundle: true,
    format: 'esm',
    outfile: distPath,
    sourcemap: 'linked',
    minify: true,
    metafile: true,
  });

  return minifiedPromise;
});

console.log(`\n${buildPromises.length} builds started...`);

try {
  const buildResults = await Promise.all(buildPromises);
  const analysisPromises = buildResults.map((result) =>
    esbuild.analyzeMetafile(result.metafile)
  );

  const analyses = await Promise.all(analysisPromises);
  for (const analysis of analyses) {
    console.log(analysis);
  }

  /**
   * @type Metafile
   */
  const mergedMetafile = {
    inputs: {},
    outputs: {},
  };
  for (const result of buildResults) {
    Object.assign(mergedMetafile.inputs, result.metafile.inputs);
    Object.assign(mergedMetafile.outputs, result.metafile.outputs);
  }
  const mergedMetafileString = JSON.stringify(mergedMetafile, null, 2);
  await writeFile(metafilePath, mergedMetafileString);

  const mergedAnalysesString = analyses.join('\n');
  await writeFile(analysisPath, mergedAnalysesString);
} catch (error) {
  console.error(error);
}
