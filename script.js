import * as THREE from "./node_modules/three/build/three.module.js";

let renderer, scene, canvas, camera, sizes, particles, texture, geometry;
let toggleAnimate = false;
let imagedata;
const centerVector = new THREE.Vector3(0, 0, 0);

/* Canvas setup
---------------------------------------------------------------*/
const bg = document.querySelector(".bg");
canvas = document.querySelector("#canvas");

/* Get canvas sizes
---------------------------------------------------------------*/
sizes = {
  width: bg.getBoundingClientRect().width,
  height: bg.getBoundingClientRect().height,
};

/* Mouse tracking for interactivity
---------------------------------------------------------------*/
const mouse = { x: 0, y: 0 };

/* Particle texture size
---------------------------------------------------------------*/
const textureSize = 32.0;

/* Function to create a radial gradient texture
---------------------------------------------------------------*/
function drawRadialGradation(ctx, canvasRadius, canvasW, canvasH) {
  ctx.save();
  const gradient = ctx.createRadialGradient(canvasRadius, canvasRadius, 0, canvasRadius, canvasRadius, canvasRadius);
  gradient.addColorStop(0, "rgba(255,255,255,1.0)");
  gradient.addColorStop(0.75, "rgba(255,255,255,1)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvasW, canvasH);
  ctx.restore();
}

/* Function to generate a particle texture
---------------------------------------------------------------*/
function getParticleTexture() {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  const diameter = textureSize;
  canvas.width = diameter;
  canvas.height = diameter;
  const canvasRadius = diameter / 2;

  /* gradation circle */
  drawRadialGradation(ctx, canvasRadius, canvas.width, canvas.height);

  const texture = new THREE.Texture(canvas);
  texture.type = THREE.FloatType;
  texture.needsUpdate = true;
  return texture;
}

/* Main texture from provided image
---------------------------------------------------------------*/
let textureLink = document.querySelector(".bg-texture").getAttribute("data-image");

/* Function to get image data for pixel manipulation */
function getImageData(image, scaleFactor = 0.7) {
  // Create a canvas for processing
  const imgCanvas = document.createElement("canvas");
  imgCanvas.width = Math.round(image.width * scaleFactor);
  imgCanvas.height = Math.round(image.height * scaleFactor);

  const ctx = imgCanvas.getContext("2d");
  ctx.drawImage(image, 0, 0, imgCanvas.width, imgCanvas.height);

  // Get reduced pixel data
  return ctx.getImageData(0, 0, imgCanvas.width, imgCanvas.height);
}

function createGeometryFromImageData(imagedata) {
  const initialPositions = [];
  const vertices = [];
  const destinations = [];
  const velocities = [];

  for (let h = 0; h < imagedata.height; h++) {
    for (let w = 0; w < imagedata.width; w++) {
      const alpha = imagedata.data[(w + h * imagedata.width) * 4 + 3];
      if (alpha > 128) {
        // Only process visible pixels
        // Initial random positions
        const x = THREE.MathUtils.randFloatSpread(1000);
        const y = THREE.MathUtils.randFloatSpread(1000);
        const z = THREE.MathUtils.randFloatSpread(1000);

        vertices.push(x, y, z);
        initialPositions.push(x, y, z);

        // Destination positions based on pixel location
        const desX = w - imagedata.width / 2;
        const desY = -h + imagedata.height / 2;
        const desZ = -imagedata.width + THREE.MathUtils.randFloatSpread(20);

        destinations.push(desX, desY, desZ);

        // Random velocity for movement
        const velocity = Math.random() / 200 + 0.015;
        velocities.push(velocity);
      }
    }
  }

  return { vertices, initialPositions, destinations, velocities };
}

/* Draw objects based on image data
---------------------------------------------------------------*/
function drawObject() {
  geometry = new THREE.BufferGeometry();

  // Generate particles based on image data
  const { vertices, initialPositions, destinations, velocities } = createGeometryFromImageData(imagedata, 5);

  // Add extra random particles
  for (let i = 0; i < 200; i++) {
    const x = THREE.MathUtils.randFloatSpread(1000);
    const y = THREE.MathUtils.randFloatSpread(1000);
    const z = THREE.MathUtils.randFloatSpread(1000);

    vertices.push(x, y, z);
    initialPositions.push(x, y, z);

    // Destination
    const desX = THREE.MathUtils.randFloatSpread(500);
    const desY = THREE.MathUtils.randFloatSpread(500);
    const desZ = -THREE.MathUtils.randFloat(100, 300);

    destinations.push(desX, desY, desZ);

    // Velocity
    let v = Math.random() / 200 + 0.015;

    velocities.push(v);
  }

  geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute("initialPosition", new THREE.Float32BufferAttribute(initialPositions, 3));
  geometry.setAttribute("destination", new THREE.Float32BufferAttribute(destinations, 3));
  geometry.setAttribute("velocity", new THREE.Float32BufferAttribute(velocities, 1));

  // Material for particles
  const material = new THREE.PointsMaterial({
    size: 5,
    color: 0xffff48,
    vertexColors: false,
    map: getParticleTexture(),
    transparent: true,
    opacity: 0.7,
    fog: true,
    alphaMap: getParticleTexture(),
    alphaTest: 0.001,
    depthWrite: false,
    sizeAttenuation: true,
  });

  particles = new THREE.Points(geometry, material);

  scene.add(particles);

  animate();
}

/* Handle resizing of the viewport
---------------------------------------------------------------*/
function handleResize() {
  // Update sizes
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  // Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
}

// Handle mouse movement
function handleMouseMove(event) {
  mouse.x = event.clientX / sizes.width - 0.5;
  mouse.y = -(event.clientY / sizes.height - 0.5);
}

/* Animation loop
---------------------------------------------------------------*/
let animationTime = 60;

setInterval(function () {
  toggleAnimate = !toggleAnimate;
  console.log(toggleAnimate);
}, animationTime * 1000);

function animate() {
  const tick = function () {
    // Update objects
    const positions = geometry.attributes.position;
    const destinations = geometry.attributes.destination;
    const initialPositions = geometry.attributes.initialPosition;
    const velocities = geometry.attributes.velocity;

    let v3initalPosition = new THREE.Vector3();
    let v3Position = new THREE.Vector3();
    let v3Destination = new THREE.Vector3();

    // Loop over the vertices, re-positions them
    for (let i = 0; i < positions.count; i++) {
      v3initalPosition.fromBufferAttribute(initialPositions, i);
      v3Position.fromBufferAttribute(positions, i);
      v3Destination.fromBufferAttribute(destinations, i);

      if (!toggleAnimate) {
        v3Position.x += (v3Destination.x - v3Position.x) * velocities.array[i] + THREE.MathUtils.randFloatSpread(0.1);
        v3Position.y += (v3Destination.y - v3Position.y) * velocities.array[i] + THREE.MathUtils.randFloatSpread(0.1);
        v3Position.z += (v3Destination.z - v3Position.z) * velocities.array[i] + THREE.MathUtils.randFloatSpread(0.1);
      } else {
        v3Position.x += (v3initalPosition.x - v3Position.x) * velocities.array[i];
        v3Position.y += (v3initalPosition.y - v3Position.y) * velocities.array[i];
        v3Position.z += (v3initalPosition.z - v3Position.z) * velocities.array[i];
      }

      positions.setXYZ(i, v3Position.x, v3Position.y, v3Position.z);
    }

    geometry.attributes.position.needsUpdate = true;
    geometry.computeVertexNormals();

    // Render
    renderer.render(scene, camera);

    // Call tick again on the next frame
    window.requestAnimationFrame(tick);
  };

  tick();
}

/* Initialization
---------------------------------------------------------------*/
function init() {
  // Init renderer
  renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
  });

  renderer.setClearColor(0x000000);
  renderer.setSize(sizes.width, sizes.height);

  // Init scene
  scene = new THREE.Scene();

  // Init camera
  camera = new THREE.PerspectiveCamera(45, sizes.width / sizes.height, 0.1, 1000);
  camera.position.set(0, 0, 50);
  camera.lookAt(centerVector);
  scene.add(camera);
  camera.zoom = 4;

  // Add light
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  const pointLight = new THREE.PointLight(0xffffff);
  pointLight.position.set(0, 250, 0);
  scene.add(pointLight);

  // Init texture
  texture = new THREE.TextureLoader().load(
    textureLink,
    function () {
      imagedata = getImageData(texture.image);
      drawObject();
    },
    function (err) {
      console.error("Failed to load texture:", err);
    }
  );

  window.addEventListener("resize", handleResize, false);
  window.addEventListener("mousemove", handleMouseMove);
  window.addEventListener("touchmove", handleMouseMove);
  // Add event listener for cleanup
  window.addEventListener("beforeunload", cleanup);
}

init();

// Clean up functions
function cleanup() {
  cleanupParticles();
  cleanupScene();
  cleanupRenderer();
  cleanupEvents();
}

function cleanupParticles() {
  if (particles) {
    particles.geometry.dispose();
    particles.material.dispose();
    scene.remove(particles);
    particles = null;
  }
}

function cleanupRenderer() {
  if (renderer) {
    renderer.dispose();
    renderer.forceContextLoss();
    renderer.domElement = null;
    renderer = null;
  }
}

function cleanupEvents() {
  window.removeEventListener("resize", handleResize);
  window.removeEventListener("mousemove", handleMouseMove);
  window.removeEventListener("touchmove", handleMouseMove);
}

function cleanupScene() {
  scene.traverse((object) => {
    if (object.geometry) object.geometry.dispose();
    if (object.material) {
      if (Array.isArray(object.material)) {
        object.material.forEach((mat) => mat.dispose());
      } else {
        object.material.dispose();
      }
    }
  });
  scene.clear();
}
