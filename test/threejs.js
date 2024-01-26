// const fs = require('fs');
// const {JSDOM} = require('jsdom');
// const gl = require('gl');
// const THREE = require('three');
// const GIFEncoder = require('gifencoder');
//
// const { GLTFLoader } = require('three/examples/jsm/loaders/GLTFLoader');
// rewrited to imports

import fs from 'fs';
// import {JSDOM} from 'jsdom';
// import gl from 'gl';
import * as THREE from 'three';
import GIFEncoder from 'gifencoder';
import puppeteer from 'puppeteer';
// import {GLTFLoader} from "three/addons";
// import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
const modelBuffer = fs.readFileSync('./assets/model.glb');
const modelBase64 = modelBuffer.toString('base64');
import gltfPipeline from 'gltf-pipeline';
const glbToGltf = gltfPipeline.glbToGltf;




(async () => {
  const glbToGltfResult = await glbToGltf(modelBuffer);
  const modelJson = JSON.stringify(glbToGltfResult.gltf);
    const browser = await puppeteer.launch({headless: 'new'});
//html with canvas to render in browser
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    
    <meta charset="UTF-8">
    <title>Title</title>
   
</head>
<body>
<div id="container">
    <canvas id="canvas"></canvas>
    <script async src="https://esm.sh/three" type="module"></script>
    <script async src="https://esm.sh/three@0.160.1/examples/jsm/loaders/GLTFLoader" type="module"></script>
<!--    gif maker-->
    <script defer type="module">
        import * as THREE from 'https://esm.sh/three';
        import {GLTFLoader} from 'https://esm.sh/three/examples/jsm/loaders/GLTFLoader';
        window.THREE = THREE;
        window.GLTFLoader = GLTFLoader;
        const canvas = document.getElementById('canvas');
        canvas.width = 1920;
        canvas.height = 1080;
       
        const gl = canvas.getContext('webgl2');
        const renderer = new THREE.WebGLRenderer({canvas: canvas, context: gl});
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, 1920 / 1080, 0.1, 1000);
        camera.position.z = 5;
        const loader = new GLTFLoader();
        const gltfString = '${modelJson}';
        window.gltfString = gltfString;
        
        const gltf = JSON.parse(gltfString);
        (async () => { 
            const gltf = await loader.parseAsync(gltfString, '');
           
            const model = gltf.scene;
            scene.add(model);
            let frame = 0;
            
            const animate = () => {
                if (frame < 300) {
                model.rotation.x += 0.01;
                renderer.render(scene, camera);
                frame++;
               } else {
                window.rendered = true;
               }
                requestAnimationFrame(animate);
            
            };
           
              animate();
            
        })();
       
      
       
        
       
    </script>
</div>
</body>
</html>
`;
//create page
    const page = await browser.newPage();
//set viewport
    await page.setViewport({width: 1920, height: 1080});
//set content
    await page.setContent(html);

//log all console messages from page
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('error', err => console.log('PAGE LOG:', err));
    page.on('pageerror', err => console.log('PAGE LOG:', err));
    page.on('requestfailed', err => console.log('PAGE LOG:', err));
    page.on('domcontentloaded', () => console.log('PAGE LOG:', 'domcontentloaded'));
    page.on('load', () => console.log('PAGE LOG:', 'load'));
    page.on('response', () => console.log('PAGE LOG:', 'response'));
    page.on('request', () => console.log('PAGE LOG:', 'request'));
    console.log('PAGE LOG:', 'start');
//wait for page to load

    console.log('PAGE LOG:', 'loaded');
    const threejs = await page.evaluateHandle(() => window.THREE).then((res) => res.jsonValue());
    const loader = await page.evaluateHandle(() => {
        return {
            rendered: window.rendered
        }
    }).then((res) => res.jsonValue());
    console.log('PAGE LOG:', loader);


//wait for model to load
//     await page.waitForFunction('window.rendered === true');

//get canvas element
    const canvas = await page.$('#canvas');
//get canvas content as base64
    const base64 = await canvas.screenshot({encoding: 'base64'});
//create buffer from base64
    const buffer = Buffer.from(base64, 'base64');
//save buffer to file
    fs.writeFileSync('./assets/screenshot.png', buffer);
//close browser
    await browser.close();


})();
