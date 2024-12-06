const img = new Image();

img.crossOrigin = "*";
img.src = "./public/mach1.jpg";

const drawImage = () => {
  const canvas: any = document.getElementById("canvas1");
  const canvas2: any = document.getElementById("canvas2");
  const canvas3: any = document.getElementById("canvas3");

  const context = canvas.getContext("2d");
  const context2 = canvas2.getContext("2d");
  const context3 = canvas3.getContext("2d");

  context.setTransform(1, 0, 0, 1, 0, 0);
  context.clearRect(0, 0, canvas.width, canvas.height);

  const width = canvas.width;
  const height = canvas.height;

  context.drawImage(img, 0, 0);
  context2.drawImage(img, 0, 0);

  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

  const xam = convertToGrayscale(imageData);
  const kernel = createGaussianKernel(3);
  const mo = applyGaussianBlur(xam, kernel);

  const grayData3 = grayImage(mo.data, width, height);
  const data = applyFrangiFilterany({ data: grayData3, width, height }, 5);
  const data3 = applyFrangiFilter({ data: grayData3, width, height }, 5);

  context.putImageData(data, 0, 0);
  context3.putImageData(data3, 0, 0);
  context2.putImageData(imageData, 0, 0);
};

img.onload = drawImage;

function convertToGrayscale(imageData: any) {
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const red = data[i];
    const green = data[i + 1];
    const blue = data[i + 2];

    const gray = 0.299 * red + 0.587 * green + 0.114 * blue;

    data[i] = data[i + 1] = data[i + 2] = gray;
  }
  return imageData;
}

function createGaussianKernel(size: number): any {
  const sigma = size / 3;
  const kernel = [];
  const mean = Math.floor(size / 2);
  let sum = 0;

  for (let y = 0; y < size; y++) {
    kernel[y] = [];
    for (let x = 0; x < size; x++) {
      const dx = x - mean;
      const dy = y - mean;
      const exponent = -(dx * dx + dy * dy) / (2 * sigma * sigma);
      const value = (1 / (2 * Math.PI * sigma * sigma)) * Math.exp(exponent);
      kernel[y][x] = value;
      sum += value;
    }
  }

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      kernel[y][x] /= sum;
    }
  }

  return kernel;
}

function applyGaussianBlur(imageData: any, kernel: any) {
  const width = imageData.width;
  const height = imageData.height;
  const output = new Uint8ClampedArray(imageData.data.length);
  const kernelSize = kernel.length;
  const halfKernelSize = Math.floor(kernelSize / 2);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let r = 0,
        g = 0,
        b = 0;

      for (let ky = -halfKernelSize; ky <= halfKernelSize; ky++) {
        for (let kx = -halfKernelSize; kx <= halfKernelSize; kx++) {
          const srcX = Math.min(Math.max(x + kx, 0), width - 1);
          const srcY = Math.min(Math.max(y + ky, 0), height - 1);

          const k = kernel[ky + halfKernelSize][kx + halfKernelSize];
          const idx = (srcY * width + srcX) * 4;
          r += imageData.data[idx] * k;
          g += imageData.data[idx + 1] * k;
          b += imageData.data[idx + 2] * k;
        }
      }
      const dstIdx = (y * width + x) * 4;
      output[dstIdx] = r;
      output[dstIdx + 1] = g;
      output[dstIdx + 2] = b;
      output[dstIdx + 3] = 255;
    }
  }

  return new ImageData(output, width, height);
}

function grayImage(data: any, width: number, height: number) {
  const newData = new Uint8Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      newData[y * width + x] =
        (data[(y * width + x) * 4] +
          data[(y * width + x) * 4 + 1] +
          data[(y * width + x) * 4 + 2]) /
        3;
    }
  }
  return newData;
}

function createHessianKernels(sigma: number) {
  const nKernX = 2 * Math.round(3 * sigma) + 1;
  const nKernY = nKernX;
  const kernXX = Array.from({ length: nKernY }, () => Array(nKernX).fill(0));
  const kernXY = Array.from({ length: nKernY }, () => Array(nKernX).fill(0));
  const kernYY = Array.from({ length: nKernY }, () => Array(nKernX).fill(0));
  const round = Math.round(3 * sigma);
  for (let x = -round; x <= round; x++) {
    for (let y = -round; y <= round; y++) {
      const commonFactor = Math.exp(-(x * x + y * y) / (2 * sigma * sigma));
      const indexX = x + round;
      const indexY = y + round;
      kernXX[indexY][indexX] =
        (1 / (2 * Math.PI * sigma ** 4)) *
        ((x * x) / sigma ** 2 - 1) *
        commonFactor;

      kernXY[indexY][indexX] =
        (1 / (2 * Math.PI * sigma ** 6)) * (x * y) * commonFactor;

      kernYY[indexY][indexX] =
        (1 / (2 * Math.PI * sigma ** 4)) *
        ((y * y) / sigma ** 2 - 1) *
        commonFactor;
    }
  }

  return { kernXX, kernXY, kernYY };
}

function applyKernel(imageData: any, kernel: any) {
  const width = imageData.width;
  const height = imageData.height;
  const output = new Float32Array(width * height);

  const kernelSize = kernel.length;
  const offset = Math.floor(kernelSize / 2);

  for (let x = offset; x < width - offset; x++) {
    for (let y = offset; y < height - offset; y++) {
      let sum = 0;
      for (let kx = -offset; kx <= offset; kx++) {
        for (let ky = -offset; ky <= offset; ky++) {
          const pixel = imageData.data[(y + ky) * width + (x + kx)];
          sum += pixel * kernel[ky + offset][kx + offset];
        }
      }
      output[y * width + x] = sum;
    }
  }

  return { data: output, width, height };
}

function applyFrangiFilterany(
  imageData: any,
  strength: number,
  options = {
    FrangiScaleRange: [1, 10],
    FrangiScaleRatio: 1.5,
    FrangiBetaOne: 0.5,
    FrangiBetaTwo: 15,
  }
) {
  const width = imageData.width;
  const height = imageData.height;
  const sigmas = [];
  for (
    let sigma = options.FrangiScaleRange[0];
    sigma <= options.FrangiScaleRange[1];
    sigma *= options.FrangiScaleRatio
  ) {
    sigmas.push(sigma);
  }

  const beta = 2 * options.FrangiBetaOne ** 2;
  const c = 2 * options.FrangiBetaTwo ** 2;

  const ALLfiltered = new Array(sigmas.length);
  const ALLangles = new Array(sigmas.length);

  // Lặp qua tất cả các giá trị sigma
  for (let i = 0; i < sigmas.length; i++) {
    const sigma = sigmas[i];
    const { kernXX, kernXY, kernYY } = createHessianKernels(sigma);

    const imgXX = applyKernel(imageData, kernXX);
    const imgXY = applyKernel(imageData, kernXY);
    const imgYY = applyKernel(imageData, kernYY);

    const filtered = new Float32Array(width * height);
    const angles = new Float32Array(width * height);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const index = y * width + x;
        const Dxx = imgXX.data[index] * sigma * sigma;
        const Dxy = imgXY.data[index] * sigma * sigma;
        const Dyy = imgYY.data[index] * sigma * sigma;

        const trace = Dxx + Dyy;
        const tmp = Math.sqrt((Dxx - Dyy) ** 2 + 4 * Dxy ** 2);

        const lambda1 = (trace + tmp) / 2;
        const lambda2 = (trace - tmp) / 2;

        const absLambda1 = Math.abs(lambda1);
        const absLambda2 = Math.abs(lambda2);

        const rb = (absLambda2 / absLambda1) ** 2;
        const s2 = strength * (lambda1 ** 2 + lambda2 ** 2);

        let Ix = 2 * Dxy;
        let Iy = Dyy - Dxx + tmp;
        const mag = Math.sqrt(Ix ** 2 + Iy ** 2);
        if (mag) {
          Ix /= mag;
          Iy /= mag;
        }
        const luu = Ix;
        Ix = -Iy;
        Iy = luu;

        const angle = Math.atan2(Ix, Iy);
        const direction = Math.exp(
          (0 - (Math.abs(angle) / Math.PI) ** 2) / (2 * 1.0)
        );
        const vesselness = Math.exp(-rb / beta) * (1 - Math.exp(-s2 / c));

        filtered[index] = vesselness;
        angles[index] = angle;
      }
    }
    ALLfiltered[i] = filtered;
    ALLangles[i] = angles;
  }

  const outIm = new Float32Array(width * height);
  const whatScale = new Float32Array(width * height);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let maxVal = -Infinity;
      let bestSigmaIdx = -1;

      for (let i = 0; i < sigmas.length; i++) {
        const value = ALLfiltered[i][y * width + x];
        if (value > maxVal) {
          maxVal = value;
          bestSigmaIdx = i;
        }
      }

      outIm[y * width + x] = maxVal;
      whatScale[y * width + x] = sigmas[bestSigmaIdx];
    }
  }

  const Direction = new Float32Array(width * height);
  for (let i = 0; i < sigmas.length; i++) {
    const scaleAngles = ALLangles[i];
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (whatScale[y * width + x] === sigmas[i]) {
          Direction[y * width + x] = scaleAngles[y * width + x];
        }
      }
    }
  }

  const output = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let i = y * width + x;
      const intensity = Math.max(0, Math.min(255, outIm[i] * 255));

      output[i * 4] = intensity;
      output[i * 4 + 1] = intensity;
      output[i * 4 + 2] = intensity;
      output[i * 4 + 3] = 255;
    }
  }

  return new ImageData(output, width, height);
}

function applyFrangiFilter(
  imageData: any,
  strength: number,
  sigmas = [1, 1.1, 1.25, 1.5, 1.75, 2, 2.5, 3],
  beta = 0.5,
  c = 15
) {
  const width = imageData.width;
  const height = imageData.height;
  const output = new Uint8ClampedArray(width * height * 4);

  for (let sigma of sigmas) {
    const { kernXX, kernXY, kernYY } = createHessianKernels(sigma);

    const imgXX = applyKernel(imageData, kernXX);
    const imgXY = applyKernel(imageData, kernXY);
    const imgYY = applyKernel(imageData, kernYY);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const index = y * width + x;
        const Dxx = imgXX.data[index] * sigma * sigma;
        const Dxy = imgXY.data[index] * sigma * sigma;
        const Dyy = imgYY.data[index] * sigma * sigma;

        const trace = Dxx + Dyy;
        const tmp = Math.sqrt((Dxx - Dyy) ** 2 + 4 * Dxy ** 2);
        const lambda1 = (trace + tmp) / 2;
        const lambda2 = (trace - tmp) / 2;

        const absLambda1 = Math.abs(lambda1);
        const absLambda2 = Math.abs(lambda2);

        const rb = absLambda2 / absLambda1;
        const s2 = (lambda1 ** 2 + lambda2 ** 2) * strength;

        const Ix = -Dxy;
        const Iy = Dxx - Dyy + tmp;
        const angle = Math.atan2(Ix, Iy);

        const vesselness =
          Math.exp(0 - rb ** 2 / (2 * beta ** 2)) *
          (1 - Math.exp(-s2 / (2 * c ** 2))) *
          Math.exp((0 - (Math.abs(angle) / Math.PI) ** 2) / (2 * 1.0));

        const colorIndex = index * 4;
        const intensity = vesselness * 255;

        output[colorIndex] = Math.max(intensity, output[colorIndex]);
        output[colorIndex + 1] = Math.max(intensity, output[colorIndex + 1]);
        output[colorIndex + 2] = Math.max(intensity, output[colorIndex + 2]);
        output[colorIndex + 3] = 255;
      }
    }
  }

  return new ImageData(output, width, height);
}
