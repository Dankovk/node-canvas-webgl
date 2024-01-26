const fs = require('fs');
const BABYLON = require('babylonjs');
const {createCanvas} = require('../lib');
const path = require('path');
const {URL} = require('url');
const {Blob} = require('buffer');

global.HTMLElement = function () {
};
global.window = {
  setTimeout,
  addEventListener() {
  },
};
global.navigator = {};
global.document = {
  createElement() {
    return createCanvas(300, 150);
  },
  addEventListener() {
  },
};

// Get the canvas DOM element
const canvas = createCanvas(1920, 1080);

// Load the 3D engine
const engine = new BABYLON.Engine(canvas, true, {preserveDrawingBuffer: true, stencil: true});

// CreateScene function that creates and return the scene
const createScene = async function () {
  // Create a basic BJS Scene object
  const scene = new BABYLON.Scene(engine);
  // GLTF LOADER
  const modelBlob = fs.readFileSync(path.resolve(__dirname, 'assets/model.glb'), 'binary');
    const File = import('file-api').then((module) => module.File);
    const file = new File(modelBlob, 'model.glb', {type: 'application/octet-stream'});

    // const blob = new Blob([modelBlob], {type: 'application/octet-stream'});
  // but for node env where Blob is not available

    const buffer = Buffer.from(modelBlob, 'binary');
    //get the blob in node env without new Blob
    const blob = new Blob([buffer], {type: 'application/octet-stream', endings: 'native', href: 'model.glb', filename: 'model.glb'});

    const str = blob.toString();


    //get the blob from buffer in node env


  // const url = URL.createObjectURL(str);
  const promise = await BABYLON.SceneLoader.LoadAssetContainerAsync(file, '', scene, null, null, null, '.glb').then((container) => {
    container.addAllToScene();
  });

    // Once the scene is loaded, just register a render loop to render it


  // Create a FreeCamera, and set its position to {x: 0, y: 5, z: -10}
  // const camera = new BABYLON.FreeCamera('camera1', new BABYLON.Vector3(0, 5, -10), scene);
  // // Target the camera to scene origin
  // camera.setTarget(BABYLON.Vector3.Zero());
  // // Attach the camera to the canvas
  // camera.attachControl(canvas, false);
  // // Create a basic light, aiming 0, 1, 0 - meaning, to the sky
  // const light = new BABYLON.HemisphericLight('light1', new BABYLON.Vector3(0, 1, 0), scene);
  // // Create a built-in "sphere" shape; its constructor takes 6 params: name, segment, diameter, scene, updatable, sideOrientation
  // const sphere = BABYLON.Mesh.CreateSphere('sphere1', 16, 2, scene, false, BABYLON.Mesh.FRONTSIDE);
  // // Move the sphere upward 1/2 of its height
  // sphere.position.y = 1;
  // Create a built-in "ground" shape; its constructor takes 6 params : name, width, height, subdivision, scene, updatable
  // const ground = BABYLON.Mesh.CreateGround('ground1', 6, 6, 2, scene, false);
  // Return the created scene
    return promise;
};

// call the createScene function
const runApp = async () => {
  const scene = await createScene();
  scene.render();

  fs.writeFileSync('./snapshot/snap-babylon.png', canvas.toBuffer());
}

runApp();




// run the render loop
// engine.runRenderLoop(() => {
//   scene.render();
// });
