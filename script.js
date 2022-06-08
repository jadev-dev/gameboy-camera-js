let textOut = document.querySelector('p');
let virtual = document.querySelector("#workingImage")
let display = document.querySelector("#renderedImage")
let ctx = virtual.getContext('2d')
let greenModeCheckbox = document.getElementById("greenMode");

virtual.width = 128
virtual.height = 112
display.width = 1280;
display.height = 1120;

const ditherMatrix = [
    [0, 8, 2, 10],
    [12, 4, 14, 6],
    [3, 11, 1, 9],
    [15, 7, 13, 5],
]

const green_dark = [15, 56, 16];
const green_darkish = [49, 98, 47];
const green_lightish = [138, 172, 14];
const green_light = [154, 188, 16];
const green_lightest = [179, 212, 18];

const grays = [[0,0,0], [85,85,85], [170,170,170],[255,255,255]];
const greens = [green_dark, green_darkish, green_lightish, green_light];
let selectedColors;
let inputArea = document.querySelector(".inputs");
if (greenModeCheckbox.checked) {
  selectedColors = greens;
  document.body.classList.add("green-mode")
  inputArea.classList.add("green-mode")
} else {
  selectedColors = grays;
  document.body.classList.remove("green-mode")
  inputArea.classList.remove("green-mode")
}
let getMapping = (x, y) => {
  return (ditherMatrix[x % 4][y % 4]/16)
}

let naivePalette = (grayscaleValue, x, y) => {
  let calculated = grayscaleValue + ((255/16)*getMapping(x, y))
  let relative = calculated / 255;
  let rounded = Math.round(relative * 4);
  return rounded;
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
      x.src = 'sood.png';

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

let dlScale = 10;
dlScaleSlider.addEventListener("input", (event)=>{
  dlScale = parseInt(event.target.value);
  dlScaleLabel.textContent = `download scale: ${dlScale}x`
  display.width = 128 * dlScale;
  display.height = 112 * dlScale;
  makeImage()
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
    document.getElementById("brightnessLabel").textContent = `brightness: ${brightness}`
    document.getElementById("sizeLabel").textContent = `size: ${Math.round(size * 100)}%`
    document.getElementById("upLabel").textContent = `y-offset: ${Math.round(up)}`
    document.getElementById("rightLabel").textContent = `x-offset: ${Math.round(right)}`
    let imageWidth;
    let imageHeight;
      imageWidth = image.width * size
      imageHeight = image.height * size
        let xpos = (virtual.width / 2) - (imageWidth / 2) + right;
        let ypos = (virtual.height / 2) - (imageHeight / 2) - up;
      ctx.clearRect(0, 0, 128, 112);
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
      if (grayScaleValue === 4)
        grayScaleValue = 3;
      setPixel(
          selectedColors[grayScaleValue][0],
          selectedColors[grayScaleValue][1],
          selectedColors[grayScaleValue][2],
          255
      );
    }
    return imgData;
  }).then((imgData) => {
    ctx.putImageData(imgData, 0, 0);
  }).then(()=>{
    let scaleCanvas = document.querySelector('#renderedImage');
  let scale = scaleCanvas.getContext('2d');
  let snip = new Image()
  snip.src = virtual.toDataURL();
  snip.onload = () => {
    scaleCanvas.style.imageRendering = "pixelated";
    let smallData = ctx.getImageData(0, 0, 128, 112)
    for (var i = 0; i < smallData.data.length; i += 4) {
      let x = (i / 4) % 128
      let y = Math.floor(i / (128 * 4));
      scale.fillStyle = `rgba(${smallData.data[i]}, ${smallData.data[i + 1]}, ${smallData.data[i + 2]}, ${smallData.data[i + 3]})`
      scale.fillRect(x * dlScale, y * dlScale, dlScale, dlScale);
    }
  }});}

img().then((image)=>{
  size = Math.max((128/image.width), (112/image.height));
  brightnessSlider.value = 0;
  sizeSlider.value = Math.max((128/image.width), (112/image.height));
  updateRanges();
  makeImage();
})
let userImage = document.querySelector("#userImage")
userImage.addEventListener("change", (event)=>{
  if (event.target.files && event.target.files[0]) {
    if (userImageURL !== undefined)
      URL.revokeObjectURL(img.src)
    userImageURL = URL.createObjectURL(event.target.files[0])
    img().then((image)=>{
      size = Math.max((128/image.width), (112/image.height));
      sizeSlider.value = Math.max((128/image.width), (112/image.height));
      brightnessSlider.value = 0;
      brightness = 0;
      up = 0;
      right = 0;
      updateRanges();
      makeImage();
    })
  }
})
let browse = document.querySelector("#browse");
browse.addEventListener("click", ()=>{
  userImage.click();
})
var video = document.querySelector("video")
let beginVideo=() => {
navigator.mediaDevices.getUserMedia({'audio':false,'video':true}).then(function (stream) {
  window.stream = stream;
    video.srcObject = stream;
  video.play().then(()=>{
    let h = document.createElement("canvas")
    h.width = video.videoWidth;
    h.height = video.videoHeight;
    console.log(video)
    console.log(video.videoWidth)
    console.log(video.videoHeight)
    let htx = h.getContext('2d');
    size = Math.max((128/video.videoWidth), (112/video.videoHeight));
    brightnessSlider.value = 0;
    sizeSlider.value = size;
    updateRanges();
    x = setInterval(()=>{
      htx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
      userImageURL = h.toDataURL();
      makeImage();
    }, 100)
  });
});
}
let captureButton = document.querySelector("#videoButton");
var isIphone= /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
if (isIphone) {
  captureButton.style.display = "none";
}
var x = undefined;
captureButton.addEventListener("click", (event)=>{
  if (x===undefined){
    event.target.textContent = "capture image";
    x = beginVideo();
  } else {
    event.target.textContent = "start camera";
    clearInterval(x);
    x = undefined;
  }
})
let mouseEventListener;
let previousTouch;
let movement = (event) =>{
  event.preventDefault();
  if (event?.touches) {
    const touch = event.touches[0];
    if (previousTouch) {
      event.movementX = touch.pageX - previousTouch.pageX;
      event.movementY = touch.pageY - previousTouch.pageY;
    }
    previousTouch = touch;
  }
  if (event?.movementX !== undefined && event?.movementY !== undefined) {
    up -= (event.movementY * 128 / parseInt(window.getComputedStyle(display).height));
    right += (event.movementX * 112 / parseInt(window.getComputedStyle(display).width));
    updateRanges();
    makeImage();
  }

}
display.addEventListener("mousedown", (event)=>{
  document.addEventListener("mousemove", movement)
})
document.addEventListener("mouseup", (event)=>{
  document.removeEventListener("mousemove", movement)
})
display.addEventListener("touchstart", (event)=>{
  document.addEventListener("touchmove", movement)
})
document.addEventListener("touchend", (event)=>{
  document.removeEventListener("touchmove", movement)
  previousTouch = false;
})
document.addEventListener("touchcancel", (event)=>{
  document.removeEventListener("touchmove", movement)
  previousTouch = false;
})
greenModeCheckbox.addEventListener("change", (event)=>{
  if (event.target.checked) {
    selectedColors = greens;
    document.body.classList.add("green-mode")
    inputArea.classList.add("green-mode")
  } else {
    selectedColors = grays;
    document.body.classList.remove("green-mode")
    inputArea.classList.remove("green-mode")
  }
  makeImage();
})
let button = document.querySelector("#dlButton")
button.addEventListener("click", (event)=>{
    let downloadLink = document.createElement("a");
    downloadLink.download = "crunched image.png";
    downloadLink.href = display.toDataURL();
    downloadLink.click();
})