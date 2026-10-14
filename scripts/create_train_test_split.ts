import fs from 'fs';
import path from 'path';

interface DatasetItem {
  id: string;
  index: number;
  type: string;
  fileName?: string;
  imagePathDataset?: string;
  [key: string]: any;
}

const datasetIndexPub = path.resolve('public/dataset/dataset_index.json');
const datasetIndexData = path.resolve('dataset/dataset_index.json');

const items: DatasetItem[] = JSON.parse(fs.readFileSync(datasetIndexData, 'utf-8'));

// Modalities: thyroid (40), pcos (40), thyroid_us (20), ovarian_us (20)
const modalities = ['thyroid', 'pcos', 'thyroid_us', 'ovarian_us'];

const trainDir = path.resolve('dataset/train');
const testDir = path.resolve('dataset/test');
const pubTrainDir = path.resolve('public/dataset/train');
const pubTestDir = path.resolve('public/dataset/test');

[trainDir, testDir, pubTrainDir, pubTestDir].forEach(d => {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
});

modalities.forEach(mod => {
  [
    path.join(trainDir, mod),
    path.join(testDir, mod),
    path.join(pubTrainDir, mod),
    path.join(pubTestDir, mod)
  ].forEach(d => {
    if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
  });
});

const trainItems: any[] = [];
const testItems: any[] = [];

modalities.forEach(mod => {
  const modItems = items.filter(i => i.type === mod);
  // 80% train, 20% test
  const splitIdx = Math.floor(modItems.length * 0.8);

  const trainSet = modItems.slice(0, splitIdx);
  const testSet = modItems.slice(splitIdx);

  trainSet.forEach(item => {
    const file = path.basename(item.imagePathDataset || item.imagePathPublic);
    const srcPath = path.resolve(`dataset/${mod}/${file}`);
    const destTrain = path.resolve(`dataset/train/${mod}/${file}`);
    const pubDestTrain = path.resolve(`public/dataset/train/${mod}/${file}`);

    if (fs.existsSync(srcPath)) {
      fs.copyFileSync(srcPath, destTrain);
      fs.copyFileSync(srcPath, pubDestTrain);
    }

    trainItems.push({
      ...item,
      split: 'train',
      trainPath: `dataset/train/${mod}/${file}`,
      publicTrainPath: `/dataset/train/${mod}/${file}`
    });
  });

  testSet.forEach(item => {
    const file = path.basename(item.imagePathDataset || item.imagePathPublic);
    const srcPath = path.resolve(`dataset/${mod}/${file}`);
    const destTest = path.resolve(`dataset/test/${mod}/${file}`);
    const pubDestTest = path.resolve(`public/dataset/test/${mod}/${file}`);

    if (fs.existsSync(srcPath)) {
      fs.copyFileSync(srcPath, destTest);
      fs.copyFileSync(srcPath, pubDestTest);
    }

    testItems.push({
      ...item,
      split: 'test',
      testPath: `dataset/test/${mod}/${file}`,
      publicTestPath: `/dataset/test/${mod}/${file}`
    });
  });

  console.log(`Modality: ${mod} -> Train: ${trainSet.length}, Test: ${testSet.length}`);
});

fs.writeFileSync(path.resolve('dataset/train_index.json'), JSON.stringify(trainItems, null, 2));
fs.writeFileSync(path.resolve('dataset/test_index.json'), JSON.stringify(testItems, null, 2));
fs.writeFileSync(path.resolve('public/dataset/train_index.json'), JSON.stringify(trainItems, null, 2));
fs.writeFileSync(path.resolve('public/dataset/test_index.json'), JSON.stringify(testItems, null, 2));

console.log(`Successfully partitioned dataset into:`);
console.log(`- Total Training Samples: ${trainItems.length}`);
console.log(`- Total Testing Samples: ${testItems.length}`);
