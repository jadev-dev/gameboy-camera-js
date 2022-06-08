let textOut = document.querySelector('p');
let display = document.querySelector("#renderedImage")
let ctx = display.getContext('2d')
display.width = 128
display.height = 112

const ditherMatrix = [
    [0, 8, 2, 10],
    [12, 4, 14, 6],
    [3, 11, 1, 9],
    [15, 7, 13, 5],
]

let getMapping = (x, y) => {
  return (ditherMatrix[x % 4][y % 4]/16)
}

let naivePalette = (grayscaleValue, x, y) => {
  let calculated = grayscaleValue + ((255/16)*getMapping(x, y))
  let relative = calculated / 255;
  let rounded = Math.round(relative * 4);
  return rounded * 63;
}

let getPixelEditorFunctions = (imgData, iteratorCount) => {


  return [(red, green, blue, alpha) => {
    imgData.data[iteratorCount] = red;
    imgData.data[iteratorCount + 1] = green;
    imgData.data[iteratorCount + 2] = blue;
    imgData.data[iteratorCount + 3] = alpha;
  }, (color) => {
    let mappings = {"red": 0, "green": 1, "blue": 2, "alpha": 3};
    return imgData.data[iteratorCount + mappings[color]];
  }]
}

let userImageURL;

let img = () => {
  return new Promise((resolve, reject) => {
    let x = new Image();
    if (userImageURL !== undefined)
      x.src = userImageURL;
    else
      x.src = 'tux.PNG';

    x.onload = () => {
      resolve(x)
    };
  })
}

let brightness = 0;
let size = 1;
let up = 0;
let right = 0;
let brightnessSlider = document.querySelector("#brightness")
let sizeSlider = document.querySelector("#size")
let upSlider = document.querySelector("#up")
let rightSlider = document.querySelector("#right")
brightnessSlider.addEventListener("input", (event)=>{
  brightness = parseInt(event.target.value);
  makeImage()
})
sizeSlider.addEventListener("input", (event)=>{
  size = parseFloat(event.target.value);
  makeImage()
})
upSlider.addEventListener("input", (event)=>{
  up = parseInt(event.target.value);
  makeImage()
})
rightSlider.addEventListener("input", (event)=>{
  right = parseInt(event.target.value);
  makeImage()
})
let dlScaleSlider = document.querySelector("#dlScale");
let dlScaleLabel = document.querySelector("#dlScaleLabel");

dlScale = 10;
dlScaleSlider.addEventListener("input", (event)=>{
  dlScale = parseInt(event.target.value);
  dlScaleLabel.textContent = `download scale: ${dlScale}x`
})

async function updateRanges() {
  img().then((image) => {
    rightSlider.min = (-size * image.width * 1.25);
    rightSlider.max = size * image.width * 1.25;
    rightSlider.value = right;
    upSlider.min = (-size * image.height * 1.25)
    upSlider.max = size * image.height * 1.25;
    upSlider.value = up;
  })
}

function makeImage()
{
  img().then((image) => {
        console.log(brightness);
        console.log(display.width)
    document.getElementById("brightnessLabel").textContent = `brightness: ${brightness}`
    document.getElementById("sizeLabel").textContent = `size: ${Math.round(size * 100)}%`
    document.getElementById("upLabel").textContent = `y-offset: ${Math.round(up)}`
    document.getElementById("rightLabel").textContent = `x-offset: ${Math.round(right)}`
    let imageWidth = image.width * size
    let imageHeight = image.height * size
        let xpos = (display.width / 2) - (imageWidth / 2) + right;
        let ypos = (display.height / 2) - (imageHeight / 2) - up;
      ctx.clearRect(0, 0, 128, 112);
      console.log(image, xpos, ypos, imageWidth, imageHeight)
    ctx.drawImage(image, xpos, ypos, imageWidth, imageHeight)
        return ctx.getImageData(0, 0, 128, 112);
      }).then((imgData) => {
    for (let i = 0; i < imgData.data.length; i += 4) {
      let [setPixel, getPixel] = getPixelEditorFunctions(imgData, i);
      let x = (i / 4) % 128
      let y = Math.floor(i / (128 * 4));
      let grayScaleValue = (getPixel("red") + getPixel("green") + getPixel("blue")) / 3;
      grayScaleValue += brightness;
      grayScaleValue = Math.min(Math.max(grayScaleValue, 0), 255)
      grayScaleValue = naivePalette(grayScaleValue, x, y);
      setPixel(
          grayScaleValue,
          grayScaleValue,
          grayScaleValue,
          255
      );
    }
    return imgData;
  }).then((imgData) => {
    ctx.putImageData(imgData, 0, 0);
  });
}
img().then((image)=>{
  size = Math.max((128/image.width), (112/image.height));
  brightnessSlider.value = 0;
  sizeSlider.value = Math.max((128/image.width), (112/image.height));
  updateRanges();
  makeImage();
})
let userImage = document.querySelector("#userImage")
userImage.addEventListener("change", (event)=>{
  console.log(event.target.files)
  if (event.target.files && event.target.files[0]) {
    if (userImageURL !== undefined)
      URL.revokeObjectURL(img.src)
    userImageURL = URL.createObjectURL(event.target.files[0])
    img().then((image)=>{
      size = Math.max((128/image.width), (112/image.height));
      sizeSlider.value = Math.max((128/image.width), (112/image.height));
      brightnessSlider.value = 0;
      brightness.value = 0;
      up = 0;
      right = 0;
      updateRanges();
      makeImage();
    })
  }
})
let mouseEventListener;
let movement = (event) =>{
  up -= (event.movementY * 128 / parseInt(window.getComputedStyle(display).height));
  right += (event.movementX * 112 / parseInt(window.getComputedStyle(display).width));
  updateRanges();
  makeImage();
}
display.addEventListener("mousedown", (event)=>{
  document.addEventListener("mousemove", movement)
})
document.addEventListener("mouseup", (event)=>{
  document.removeEventListener("mousemove", movement)
})
let button = document.querySelector("button")
button.addEventListener("click", (event)=>{
  let downloadLink = document.createElement("a");
  downloadLink.download = "crunched image.png";
  let scaleCanvas = document.createElement("canvas");
  scaleCanvas.width = 128*dlScale;
  scaleCanvas.height = 112*dlScale;
  let scale = scaleCanvas.getContext('2d')
  let snip = new Image()
  snip.src = display.toDataURL();
  snip.onload = ()=>{
    scaleCanvas.style.imageRendering = "pixelated";
    let smallData = ctx.getImageData(0, 0, 128, 112)
    for (var i = 0; i < smallData.data.length; i+=4) {
      let x = (i / 4) % 128
      console.log(smallData.data[i])
      let y = Math.floor(i / (128 * 4));
      scale.fillStyle = `rgba(${smallData.data[i]}, ${smallData.data[i+1]}, ${smallData.data[i+2]}, ${smallData.data[i+3]})`
      scale.fillRect(x*dlScale, y*dlScale, dlScale, dlScale);
    }
    downloadLink.href = scaleCanvas.toDataURL();
    downloadLink.click();
    downloadLink.delete();
  };
})