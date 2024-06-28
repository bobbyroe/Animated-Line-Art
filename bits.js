import { MeshLine, MeshLineGeometry, MeshLineMaterial } from "./MeshLine/index.js";

const points = [];
const numPoints = 300;
for (let j = 0; j < numPoints; j += 1) {
    points.push(-7.5 + j * 0.05, Math.sin(index + j * 0.075), 0);
}
const geometry = new MeshLineGeometry();
geometry.setPoints(points);

const material = new MeshLineMaterial({
    color,
    map: texLoader.load("./assets/strokes/stroke-02.png"),
    useMap: true,
    alphaTest: 0.5,
    transparent: true,
    resolution: new THREE.Vector2(w, h),
    lineWidth: 1.5,
    blending: THREE.AdditiveBlending,
  });

const meshLine = new MeshLine(geometry, material);
meshLine.userData.update = updatePoints;
return meshLine;

function updatePoints(t) {
  for (let i = 0, len = points.length; i < len; i += 1) {
    if(i % 3 === 1) { // y only
      let ns = noise.noise(0, points[i] * 0.5, offset);
      points[i] = Math.sin((i - t + offset) * waveLength) * amp + ns;
    }
  }
  geometry.setPoints(points, (p) => 1);
}