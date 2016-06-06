// import { Game } from './Game.js';

'use strict';

paper.install(window);

const SHAPE_RADIUS = 4;
let NUM_SHAPES = 120;
let NUM_RINGS = 4;
let RING_RADIUS = 0.1;

let WIDTH;
let HEIGHT;
let shapesArr = [];
let ineligibleShapes = [];
let explodingShapes = [];
let symbols = [];
let trace;
let move;
let currentBulletIndex, currentTargetIndex;

const COLORS = [
  'rgb(0, 157, 249)',
  'rgb(255, 0, 217)',
  'rgb(247, 255, 0)',
  'rgb(0, 196, 194)'
];

const createTracePath = () => {
  let path = new Path.Circle(new Point(0, 0), 1);
  path.fillColor = 'rgb(255, 255, 255)';
  path.opacity = 0.2;
  return path;
};

const createExplosionPath = radius => {
  let path = new Path.Circle(new Point(0, 0), radius);
  path.fillColor = COLORS[0];
  // path.strokeColor = 'white';
  path.opacity = 0;

  /*path.fillColor = {
    gradient: {
      stops: [['rgb(0, 117, 185)', 0], ['rgba(0, 117, 185, 0)', 1]],
      radial: true
    },
    origin: path.position,
    destination: path.bounds.rightCenter
  };*/

  return path;
};

const createCirclePath = () => {
  let path = new Path.Circle(new Point(0, 0), SHAPE_RADIUS);
  path.fillColor = COLORS[0];
  return path;
};

const createCirclePath2 = () => {
  let path = new Path.Circle(new Point(0, 0), SHAPE_RADIUS);
  path.fillColor = COLORS[1];
  return path;
};

const createSquarePath = () => {
  let path = new Path.Rectangle(new Point(0, 0), new Point(SHAPE_RADIUS * 2, SHAPE_RADIUS * 2));

  path.fillColor = COLORS[1];
  return path;
};

const createTrianglePath = () => {
  let path = new Path.RegularPolygon(new Point(0, 0), 3, SHAPE_RADIUS * 2);
  path.fillColor = COLORS[2];

  return path;
};

const createHexagonPath = () => {
  // Create a Paper.js Path to draw a line into it:
  var hexagon = new Path();

  var points = 6;
  var radius = SHAPE_RADIUS * 1.6;
  var angle = ((2 * Math.PI) / points);

  for (let i = 0; i <= points; i++) {
    hexagon.add(new Point(
      radius * Math.cos(angle * i),
      radius * Math.sin(angle * i)
    ));
  }

  hexagon.fillColor = COLORS[3];

  return hexagon;
};

const createRandomShape = pos => {
  const shapeIndex = chance.integer({ min: 0, max: 3 });
  let path;

  switch (shapeIndex) {
  case 0:
    path = circle.place(new Point(pos.x, pos.y));
    break;
  case 1:
    path = square.place(new Point(pos.x, pos.y));
    break;
  case 2:
    path = hexagon.place(new Point(pos.x, pos.y));
    break;
  case 3:
    path = triangle.place(new Point(pos.x, pos.y));
    break;
  }
  return path;
}

let tool;

window.onload = () => {
  let chance = new Chance();
  let canvas = document.getElementById('canvas');
  tool = new Tool();

  WIDTH = window.innerWidth;
  HEIGHT = window.innerHeight;

  console.log(WIDTH, HEIGHT);

  paper.setup(canvas);
  paper.view.onResize = onResize;
  paper.view.onFrame = onFrame;

  tool.onMouseDown = onMouseDown;
  tool.onMouseDrag = onMouseDrag;

  setupShapes();
  fireNewShape();

  setTimeout(() => {
    document.body.className += 'app--loaded';
  }, 2000);

};

let ringGroup, innerRingGroup;

let ringGroups;

const setupShapes = () => {

  const degreesPerSeg = 360 / NUM_SHAPES;
  const centerPos = paper.view.center;

  trace = new Symbol(createTracePath());
  ringGroups = [];

  for (let i = 0; i < NUM_RINGS; i++) {
    ringGroups.push(new Group());

    // create shape symbol
    let symbolPath = new Path.Circle(new Point(0, 0), SHAPE_RADIUS);
    symbolPath.fillColor = COLORS[i];

    symbols.push(new Symbol(symbolPath));


    for (let j = 0; j < NUM_SHAPES; j++) {

      let theta = j * degreesPerSeg;

      let pos = {
        x: centerPos.x + Math.cos(d2r(theta)) * HEIGHT * 0.1 * (i + 1),
        y: centerPos.y + Math.sin(d2r(theta)) * HEIGHT * 0.1 * (i + 1)
      };

      let placed = symbols[i].place(new Point(pos.x, pos.y));
      let size = chance.floating({ min: 0.2, max: 0.2 * (i + 1) });
      placed.scale(size);

      placed.data.eligible = true;
      placed.data.colorIndex = i;
      placed.data.size = size;

      shapesArr.push(placed);
      ringGroups[i].addChild(placed);
    }

  }


};

const repositionShapes = () => {
  for (let i = 0; i < shapesArr.length; i++) {

    let pos = {
      x: chance.integer({ min: 0, max: WIDTH }),
      y: chance.integer({ min: 0, max: HEIGHT })
    };

    shapesArr[i].position = pos;
  }
};

const onResize = view => {
  WIDTH = view.size.width;
  HEIGHT = view.size.height;

  // repositionShapes();
};

const d2r = deg => {
  return deg * Math.PI / 180;
};

const onCollide = (bullet, target, angle) => {
  // console.log('onCollide', bullet);
  // shape has been collided with
  // create a few more shapes at its position
  // then remove it
  bullet.remove();

  for (let i = 0; i < traces.length; i++) {
    traces[i].remove();
  }

  const explosionRadius = chance.integer({ min: 10, max: 30 });
  const numParts = 12;
  let explosionShape = createExplosionPath(explosionRadius);
  explosionShape.position = target.position;

  for (let i = 0; i < numParts; i++) {

    // const theta = angle + (i * (180 / numParts)) - 90;
    const theta = angle + i * (360 / numParts);

    let pos = {
      x: target.position.x + (explosionRadius * Math.cos(d2r(theta))),
      y: target.position.y + (explosionRadius * Math.sin(d2r(theta)))
    };

    let placed = symbols[target.data.colorIndex].place(new Point(pos.x, pos.y));
    // placed.rotate(chance.integer({ min: 0, max: 180 }));
    let size = chance.floating({ min: 0.2, max: 0.2 * (i + 1) });
    placed.scale(size);

    placed.data.eligible = false;
    placed.data.size = size;
    placed.data.colorIndex = target.data.colorIndex;
    placed.data.origin = target.position;
    placed.data.theta = theta;
    placed.data.parentPosition = target.position;

    explodingShapes.push(placed);
    ineligibleShapes.push(placed);

    shapesArr.push(placed); // ringGroup.addChild
  }

  NUM_SHAPES += numParts - 1;
  explosionInProgress = true;

  fireNewShape();

};

const fireNewShape = () => {
  currentBulletIndex = chance.integer({ min: 0, max: shapesArr.length - 1 });

  // ensure no newly created particles are the new target
  currentTargetIndex = chance.integer({ min: 0, max: shapesArr.length - 1 });

  if (shapesArr[currentBulletIndex].data.eligible
    && currentBulletIndex !== currentTargetIndex
    && typeof shapesArr[currentBulletIndex]._index !== 'undefined') {
    move = true;
  } else {
    // console.warn('not eligible');
    fireNewShape();
  }

};

let lastShiftedAt = 0;
let shiftEvery = 200;
let explosionInProgress = false;
let traces = [];

const onMouseDown = event => {

  let pos = event.point;
  let placed = circle.place(new Point(pos.x, pos.y));
  placed.data.colorIndex = 0;
  placed.rotate(chance.integer({ min: 0, max: 180 }));
  let size = chance.floating({ min: 0.2, max: 0.2 * (i + 1) });
  placed.scale(size);

  placed.data.eligible = true;
  placed.data.size = size;
  shapesArr.push(placed);
  NUM_SHAPES++;
};

let numDragEvents = 0;

const onMouseDrag = event => {

  if (numDragEvents % 4 === 0) {
    onMouseDown(event);

  }

  numDragEvents++;
};

const onFrame = event => {
  // console.log(event);

  // ringGroup.rotate(.1);
  // innerRingGroup.rotate(-0.1);
  for (let i = NUM_RINGS - 1; i >= 0; i--) {
    let speed = 0.05 * i;
    ringGroups[i].rotate(speed);
  }

  // moving bullet
  if (move) {
    let vector = shapesArr[currentTargetIndex].position.subtract(shapesArr[currentBulletIndex].position);
    const originalLength = vector.length;

    // if (event.count % 2 === 0) {
      traces.push(trace.place(new Point(shapesArr[currentBulletIndex].position)));

    // }

    vector.length = WIDTH / 2;
    shapesArr[currentBulletIndex].position = shapesArr[currentBulletIndex].position.add(vector.divide(240));
    shapesArr[currentBulletIndex].rotate(1);

    if (originalLength < 5) {

      move = false;
      onCollide(shapesArr[currentBulletIndex], shapesArr[currentTargetIndex], vector.angle);
    }
  }

  if (explosionInProgress) {
    // move parts out from their origin
    for (let i = 0; i < explodingShapes.length; i++) {
      let vector = explodingShapes[i].data.parentPosition.subtract(explodingShapes[i].position);
      if (vector.length > 50) {
        explodingShapes = [];
      } else {
        explodingShapes[i].position = explodingShapes[i].position.subtract(vector.divide(300));
        // explodingShapes[i].rotate(10);
      }
    }
  }

  // enable new shapes as bullets and targets
  if ((event.count - lastShiftedAt > shiftEvery) && ineligibleShapes.length) {
    shiftEvery = ineligibleShapes.length > 200 ? 1 : 200;
    ineligibleShapes[0].data.eligible = true;
    ineligibleShapes.shift();
    lastShiftedAt = event.count;
  }

  // triangle.definition.rotate(0.5);
  // square.definition.rotate(0.4);
  // hexagon.definition.rotate(0.2);

};
