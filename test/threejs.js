
import fs from 'fs';


import GIFEncoder from 'gifencoder';
import puppeteer from 'puppeteer';

const modelBuffer = fs.readFileSync('./assets/model.glb');

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
        const renderer = new THREE.WebGLRenderer({canvas: canvas, context: gl, dpi: 2});
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, 1920 / 1080, 0.1, 1000);
        const light = new THREE.AmbientLight(0xffffff, 1);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(0, 0, 2);
        scene.add(directionalLight);
        scene.add(light);
        const envMap = new THREE.CubeTextureLoader().load([
            'https://threejsfundamentals.org/threejs/resources/images/cubemaps/computer-history-museum/pos-x.jpg',
            'https://threejsfundamentals.org/threejs/resources/images/cubemaps/computer-history-museum/neg-x.jpg',
            'https://threejsfundamentals.org/threejs/resources/images/cubemaps/computer-history-museum/pos-y.jpg',
            'https://threejsfundamentals.org/threejs/resources/images/cubemaps/computer-history-museum/neg-y.jpg',
            'https://threejsfundamentals.org/threejs/resources/images/cubemaps/computer-history-museum/pos-z.jpg',
            'https://threejsfundamentals.org/threejs/resources/images/cubemaps/computer-history-museum/neg-z.jpg',
        ]);
        scene.background = envMap;
        
        
        camera.position.z = 2;
        camera.position.y = 0;
        camera.position.x = 0;
        camera.lookAt(0, 0, 0);
        
        const loader = new GLTFLoader();
        const gltfString = '${modelJson}';
        window.gltfString = gltfString;
        
        const gltf = JSON.parse(gltfString);
        (async () => { 
            
            const gltf = await loader.parseAsync(gltfString, '');
           
            const model = gltf.scene;
            scene.add(model);
            //rotate model
            const render = () => {
                requestAnimationFrame(render);
                model.rotation.y += 0.01;
                renderer.render(scene, camera);
            };
            render();
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
            rendered: window.rendered,
            base64Video: window.base64Video,
        }
    }).then((res) => res.jsonValue());
    console.log(loader);
    const base64Video = loader.base64Video;



    const canvas = await page.$('#canvas');



    const encoder = new GIFEncoder(1920, 1080);
    encoder.setRepeat(0);

    const gifStream = encoder.createReadStream();
    gifStream.pipe(fs.createWriteStream('./assets/model-new.gif'));


    let frame = 0
    const maxFrames = 100;
    encoder.start();

    const render = async () => {

        return new Promise(async (resolve, reject) => {


                if (frame < maxFrames) {
                    frame++;
                    const base64 = await canvas.screenshot({encoding: 'base64', type: 'webp', quality: 100});
                    fs.writeFileSync(`./assets/${frame}.webp`, base64, 'base64');


                    setTimeout(render, 1000 / 60);
                } if (frame === maxFrames) {
                    encoder.finish();
                    resolve();
                }
            }
        );

        } ;
        await render();
        await browser.close();
    } )();



