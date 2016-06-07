// import { Game } from './Game.js';

'use strict';

paper.install(window);

var SHAPE_RADIUS = 4;
var NUM_SHAPES = 60;
var NUM_RINGS = 4;
var RING_RADIUS = 0.08;
var PART_SIZE = 0.1;
var SHAPE_SIZE = 0.2;

var WIDTH = undefined;
var HEIGHT = undefined;
var shapesArr = [];
var ineligibleShapes = [];
var explodingShapes = [];
var symbols = [];
var trace = undefined;
var move = undefined;
var latestExplosionGroup = undefined,
    ringGroups = undefined,
    backgroundGroup = undefined;
var latestExplosionWeight = undefined;
var currentBulletIndex = undefined,
    currentTargetIndex = undefined,
    bulletSpeed = undefined,
    orbitSpeed = undefined;

var COLORS = ['rgba(0, 196, 194, 1)', 'rgba(0, 157, 249, 1)', 'rgba(255, 0, 217, 1)', 'rgba(247, 255, 0, 1)'];

var createTracePath = function createTracePath() {
  var path = new Path.Circle(new Point(0, 0), 1);
  path.fillColor = 'rgb(255, 255, 255)';
  path.opacity = 0.2;
  return path;
};

var getScaledColor = function getScaledColor(str, scale) {
  return str.replace(', 1)', ', ' + scale + ')');
};

var createExplosionPath = function createExplosionPath(radius, colorIndex) {
  var path = new Path.Circle(new Point(0, 0), radius);
  path.opacity = 0.3;

  path.fillColor = {
    gradient: {
      stops: [[getScaledColor(COLORS[colorIndex], 0.8), 0], [getScaledColor(COLORS[colorIndex], 0.2), 0.2], [getScaledColor(COLORS[colorIndex], 0), 1]],
      radial: true
    },
    origin: path.position,
    destination: path.bounds.rightCenter
  };

  return path;
};

var createCirclePath = function createCirclePath() {
  var path = new Path.Circle(new Point(0, 0), SHAPE_RADIUS);
  path.fillColor = COLORS[0];
  return path;
};

var createCirclePath2 = function createCirclePath2() {
  var path = new Path.Circle(new Point(0, 0), SHAPE_RADIUS);
  path.fillColor = COLORS[1];
  return path;
};

var createSquarePath = function createSquarePath() {
  var path = new Path.Rectangle(new Point(0, 0), new Point(SHAPE_RADIUS * 2, SHAPE_RADIUS * 2));

  path.fillColor = COLORS[1];
  return path;
};

var createTrianglePath = function createTrianglePath() {
  var path = new Path.RegularPolygon(new Point(0, 0), 3, SHAPE_RADIUS * 2);
  path.fillColor = COLORS[2];

  return path;
};

var createHexagonPath = function createHexagonPath() {
  // Create a Paper.js Path to draw a line into it:
  var hexagon = new Path();

  var points = 6;
  var radius = SHAPE_RADIUS * 1.6;
  var angle = 2 * Math.PI / points;

  for (var i = 0; i <= points; i++) {
    hexagon.add(new Point(radius * Math.cos(angle * i), radius * Math.sin(angle * i)));
  }

  hexagon.fillColor = COLORS[3];

  return hexagon;
};

var changeBulletSpeed = function changeBulletSpeed(speed) {
  bulletSpeed = speed;
};

var changeOrbitSpeed = function changeOrbitSpeed(speed) {
  orbitSpeed = speed;
};

var createRandomShape = function createRandomShape(pos) {
  var shapeIndex = chance.integer({ min: 0, max: 3 });
  var path = undefined;

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
};

var tool = undefined;

window.onload = function () {
  var chance = new Chance();
  var canvas = document.getElementById('canvas');
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

  document.getElementById('bulletSpeed').addEventListener('change', function (e) {
    changeBulletSpeed(e.target.valueAsNumber);
  });

  document.getElementById('orbitSpeed').addEventListener('change', function (e) {
    changeOrbitSpeed(e.target.valueAsNumber);
  });

  setTimeout(function () {
    document.body.className += 'app--loaded';
  }, 2000);
};

var setupShapes = function setupShapes() {

  bulletSpeed = 3;
  orbitSpeed = 2;

  var degreesPerSeg = 360 / NUM_SHAPES;
  var centerPos = paper.view.center;

  backgroundGroup = new Group();

  trace = new Symbol(createTracePath());
  ringGroups = [];

  for (var i = 0; i < NUM_RINGS; i++) {
    ringGroups.push(new Group());

    // create shape symbol
    var symbolPath = new Path.Circle(new Point(0, 0), SHAPE_RADIUS);
    symbolPath.fillColor = COLORS[i];

    symbols.push(new Symbol(symbolPath));

    for (var j = 0; j < NUM_SHAPES; j++) {

      var theta = j * degreesPerSeg;

      var pos = {
        x: centerPos.x + Math.cos(d2r(theta)) * HEIGHT * RING_RADIUS * (i + 2),
        y: centerPos.y + Math.sin(d2r(theta)) * HEIGHT * RING_RADIUS * (i + 2)
      };

      var placed = symbols[i].place(new Point(pos.x, pos.y));
      var size = chance.floating({ min: SHAPE_SIZE, max: SHAPE_SIZE * (i + 1) });
      placed.scale(size);

      placed.data.eligible = true;
      placed.data.colorIndex = i;
      placed.data.size = size;

      shapesArr.push(placed);
      ringGroups[i].addChild(placed);
    }
  }
};

var repositionShapes = function repositionShapes() {

  var degreesPerSeg = 360 / NUM_SHAPES;
  var centerPos = paper.view.center;

  for (var i = 0; i < NUM_RINGS; i++) {

    for (var j = 0; j < NUM_SHAPES; j++) {

      var theta = j * degreesPerSeg;

      var pos = {
        x: centerPos.x + Math.cos(d2r(theta)) * HEIGHT * RING_RADIUS * (i + 2),
        y: centerPos.y + Math.sin(d2r(theta)) * HEIGHT * RING_RADIUS * (i + 2)
      };

      var indx = i * NUM_SHAPES + j;

      if (indx < shapesArr.length) {
        shapesArr[indx].position = pos;
      }
    }
  }
};

var onResize = function onResize(view) {
  WIDTH = view.size.width;
  HEIGHT = view.size.height;

  repositionShapes();
};

var d2r = function d2r(deg) {
  return deg * Math.PI / 180;
};

var playSound = function playSound(sound) {
  // todo - find sounds and implement this
};

var onCollide = function onCollide(bullet, target, angle) {
  // console.log('onCollide', bullet);
  // shape has been collided with
  // create a few more shapes at its position
  // then remove it
  bullet.remove();

  playSound('hit');

  for (var i = 0; i < traces.length; i++) {
    traces[i].remove();
  }

  // remove target
  target.data.eligible = false;
  target.opacity = 0;

  var explosionRadius = chance.integer({ min: 10, max: 30 });
  var numParts = 12;
  var explosionShape = createExplosionPath(explosionRadius, target.data.colorIndex);
  explosionShape.position = target.position;

  var ellipsisMultiplier = chance.floating({ min: 0.2, max: 1.8 });
  explosionShape.scale({ x: 1, y: ellipsisMultiplier });
  latestExplosionGroup = new Group([explosionShape]);
  latestExplosionWeight = explosionRadius / 50;

  for (var i = 0; i < numParts; i++) {

    // const theta = angle + (i * (180 / numParts)) - 90;
    var theta = angle + i * (360 / numParts);

    var pos = {
      x: target.position.x + explosionRadius * Math.cos(d2r(theta)),
      y: target.position.y + explosionRadius * Math.sin(d2r(theta)) * ellipsisMultiplier
    };

    var placed = symbols[target.data.colorIndex].place(new Point(pos.x, pos.y));
    // placed.rotate(chance.integer({ min: 0, max: 180 }));
    var size = chance.floating({ min: PART_SIZE, max: PART_SIZE * (target.data.colorIndex + 1) });
    placed.scale(size);

    placed.data.eligible = false;
    placed.data.size = size;
    placed.data.colorIndex = target.data.colorIndex;
    placed.data.origin = target.position;
    placed.data.theta = theta;
    placed.data.parentPosition = target.position;

    explodingShapes.push(placed);
    ineligibleShapes.push(placed);

    shapesArr.push(placed);
    latestExplosionGroup.addChild(placed);
  }

  backgroundGroup.addChild(latestExplosionGroup);

  NUM_SHAPES += numParts - 1;
  explosionInProgress = true;

  fireNewShape();
};

var fireNewShape = function fireNewShape() {

  playSound('fire');

  currentBulletIndex = chance.integer({ min: 0, max: shapesArr.length - 1 });

  // ensure no newly created particles are the new target
  currentTargetIndex = chance.integer({ min: 0, max: shapesArr.length - 1 });

  if (shapesArr[currentBulletIndex].data.eligible && currentBulletIndex !== currentTargetIndex && typeof shapesArr[currentBulletIndex]._index !== 'undefined') {
    move = true;
  } else {
    // console.warn('not eligible');
    fireNewShape();
  }
};

var lastShiftedAt = 0;
var shiftEvery = 200;
var explosionInProgress = false;
var traces = [];

var onMouseDown = function onMouseDown(event) {

  if (!backgroundGroup) {
    backgroundGroup = new Group();
  }

  var indx = chance.integer({ min: 0, max: symbols.length - 1 });

  var pos = event.point;
  var placed = symbols[indx].place(new Point(pos.x, pos.y));
  placed.data.colorIndex = indx;
  // placed.rotate(chance.integer({ min: 0, max: 180 }));
  var size = chance.floating({ min: SHAPE_SIZE, max: SHAPE_SIZE * (indx + 1) });
  placed.scale(size);

  placed.data.eligible = true;
  placed.data.size = size;
  shapesArr.push(placed);
  backgroundGroup.addChild(placed);
  NUM_SHAPES++;
};

var numDragEvents = 0;

var onMouseDrag = function onMouseDrag(event) {

  if (numDragEvents % 2 === 0) {
    onMouseDown(event);
  }

  numDragEvents++;
};

var onFrame = function onFrame(event) {
  // console.log(event);

  // ringGroup.rotate(.1);
  // innerRingGroup.rotate(-0.1);
  for (var i = 0; i < NUM_RINGS; i++) {
    var speed = (NUM_RINGS - i) * 0.01 * orbitSpeed;
    ringGroups[i].rotate(speed, paper.view.center);
  }

  if (latestExplosionGroup && latestExplosionGroup.children.length) {
    latestExplosionGroup.rotate(latestExplosionWeight);
  }

  if (backgroundGroup && backgroundGroup.children.length) {
    backgroundGroup.rotate(0.01 * orbitSpeed, paper.view.center);
  }

  // moving bullet
  if (move) {
    var vector = shapesArr[currentTargetIndex].position.subtract(shapesArr[currentBulletIndex].position);
    var originalLength = vector.length;

    // if (event.count % 2 === 0) {
    traces.push(trace.place(new Point(shapesArr[currentBulletIndex].position)));

    // }

    vector.length = WIDTH / 2;
    shapesArr[currentBulletIndex].position = shapesArr[currentBulletIndex].position.add(vector.divide(360 / bulletSpeed));
    shapesArr[currentBulletIndex].rotate(1);

    if (originalLength < 5) {

      move = false;
      onCollide(shapesArr[currentBulletIndex], shapesArr[currentTargetIndex], vector.angle);
    }
  }

  if (explosionInProgress) {
    // move parts out from their origin
    for (var i = 0; i < explodingShapes.length; i++) {
      var vector = explodingShapes[i].data.parentPosition.subtract(explodingShapes[i].position);
      if (vector.length > 50) {
        explodingShapes = [];
      } else {
        explodingShapes[i].position = explodingShapes[i].position.subtract(vector.divide(300));
        // explodingShapes[i].rotate(10);
      }
    }
  }

  // enable new shapes as bullets and targets
  if (event.count - lastShiftedAt > shiftEvery && ineligibleShapes.length) {
    shiftEvery = ineligibleShapes.length > 200 ? 1 : 200;
    ineligibleShapes[0].data.eligible = true;
    ineligibleShapes.shift();
    lastShiftedAt = event.count;
  }

  // triangle.definition.rotate(0.5);
  // square.definition.rotate(0.4);
  // hexagon.definition.rotate(0.2);
};