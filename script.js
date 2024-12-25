let renderer, scene, canvas, camera, sizes, particles, texture, geometry;
let toogleAnimate = false;
let imagedata;
const centerVector = new THREE.Vector3(0, 0, 0);

/* Canvas
---------------------------------------------------------------*/
const bg = document.querySelector(".bg");
canvas = document.querySelector("#canvas");

/* Sizes
---------------------------------------------------------------*/
sizes = {
  width: bg.getBoundingClientRect().width,
  height: bg.getBoundingClientRect().height,
};

/* Cursor
---------------------------------------------------------------*/
const mouse = { x: 0, y: 0 };

/* Particle Texture
---------------------------------------------------------------*/
const textureSize = 32.0;

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

/* Main Texture
---------------------------------------------------------------*/
let textureLink = document.querySelector(".bg-texture").getAttribute("data-image");

/* GET IMAGE DATA */
function getImageData(image) {
  const imgCanvas = document.createElement("canvas");
  imgCanvas.width = image.width;
  imgCanvas.height = image.height;

  const ctx = imgCanvas.getContext("2d");
  ctx.drawImage(image, 0, 0);

  return ctx.getImageData(0, 0, image.width, image.height);
}

/* DRAW OBJECTS
---------------------------------------------------------------*/
function drawObject() {
  // Geometry
  geometry = new THREE.BufferGeometry();

  const initialPositions = [];
  const vertices = [];
  const destinations = [];
  const velocities = [];

  for (let h = 0; h < imagedata.height; h++) {
    for (let w = 0; w < imagedata.width; w++) {
      if (imagedata.data[w * 4 + h * 4 * imagedata.width + 3] > 128) {
        // Position / Initialposition
        const x = THREE.MathUtils.randFloatSpread(1000);
        const y = THREE.MathUtils.randFloatSpread(1000);
        const z = THREE.MathUtils.randFloatSpread(1000);

        vertices.push(x, y, z);
        initialPositions.push(x, y, z);

        // Destination
        const desX = w - imagedata.width / 2;
        const desY = -h + imagedata.height / 2;
        const desZ = -imagedata.width + THREE.MathUtils.randFloatSpread(20);

        destinations.push(desX, desY, desZ);

        // Velocity
        let v = Math.random() / 200 + 0.015;

        velocities.push(v);
      }
    }
  }

  for (let i = 0; i < 200; i++) {
    // Position / Initialposition
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

  console.log(geometry);

  // Material
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

  console.log(material);

  particles = new THREE.Points(geometry, material);

  scene.add(particles);

  animate();
}

/* EVENT HANDLER
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

function handleMouseMove(event) {
  mouse.x = event.clientX / sizes.width - 0.5;
  mouse.y = -(event.clientY / sizes.height - 0.5);
}

/* ANIMATE
---------------------------------------------------------------*/
let animationTime = 60;

setInterval(function () {
  toogleAnimate = !toogleAnimate;
  console.log(toogleAnimate);
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

      if (!toogleAnimate) {
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

/* INIT
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
  texture = new THREE.TextureLoader().load(textureLink, function () {
    imagedata = getImageData(texture.image);
    drawObject();
  });

  // Init event handlers
  window.addEventListener("resize", handleResize, false);
  window.addEventListener("mousemove", handleMouseMove);
  window.addEventListener("touchmove", handleMouseMove);
}

init();
