import { ssim } from 'ssim.js';
import { PNG } from 'pngjs';
import fs from 'fs';

function cropToMatchDimensions(img1: PNG, img2: PNG): [PNG, PNG] {
  const targetWidth = Math.min(img1.width, img2.width);
  const targetHeight = Math.min(img1.height, img2.height);

  const crop = (img: PNG) => {
    const cropped = new PNG({ width: targetWidth, height: targetHeight });
    for (let y = 0; y < targetHeight; y++) {
      for (let x = 0; x < targetWidth; x++) {
        const idxSrc = (img.width * y + x) << 2;
        const idxDst = (targetWidth * y + x) << 2;
        img.data.copy(cropped.data, idxDst, idxSrc, idxSrc + 4);
      }
    }
    return cropped;
  };

  return [crop(img1), crop(img2)];
}

export async function compareSSIM(
  img1Path: string,
  img2Path: string
): Promise<number> {
  const img1 = PNG.sync.read(fs.readFileSync(img1Path));
  const img2 = PNG.sync.read(fs.readFileSync(img2Path));

  const [cropped1, cropped2] = cropToMatchDimensions(img1, img2);

  const { mssim } = ssim(
    {
      data: cropped1.data,
      width: cropped1.width,
      height: cropped1.height,
    },
    {
      data: cropped2.data,
      width: cropped2.width,
      height: cropped2.height,
    }
  );

  return mssim;
}
