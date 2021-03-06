// import { Game } from './Game.js';

'use strict';

paper.install(window);

var SHAPE_RADIUS = 4;
var NUM_SHAPES = 50;

var WIDTH = undefined;
var HEIGHT = undefined;
var shapesArr = [];
var ineligibleShapes = [];
var explodingShapes = [];
var circle = undefined,
    square = undefined,
    hexagon = undefined,
    triangle = undefined,
    trace = undefined;
var move = undefined;
var currentBulletIndex = undefined,
    currentTargetIndex = undefined;

var COLORS = ['rgb(0, 157, 249)', 'rgb(255, 0, 217)', 'rgb(0, 117, 185)', 'rgb(0, 196, 194)'];

var createTracePath = function createTracePath() {
  var path = new Path.Circle(new Point(0, 0), 1);
  path.fillColor = 'rgb(255, 255, 255)';
  return path;
};

var createExplosionPath = function createExplosionPath(radius) {
  var path = new Path.Circle(new Point(0, 0), radius);
  path.fillColor = 'rgb(255, 255, 255)';
  path.opacity = 0.05;

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

var createCirclePath = function createCirclePath() {
  var path = new Path.Circle(new Point(0, 0), SHAPE_RADIUS);
  path.fillColor = COLORS[0];
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

  setTimeout(function () {
    document.body.className += 'app--loaded';
  }, 2000);
};

var setupShapes = function setupShapes() {
  var circlePath = createCirclePath();
  var squarePath = createSquarePath();
  var trianglePath = createTrianglePath();
  var hexagonPath = createHexagonPath();
  var tracePath = createTracePath();

  circle = new Symbol(circlePath);
  square = new Symbol(squarePath);
  hexagon = new Symbol(hexagonPath);
  triangle = new Symbol(trianglePath);
  trace = new Symbol(tracePath);

  for (var i = 0; i < NUM_SHAPES; i++) {

    var pos = {
      x: chance.integer({ min: 0, max: WIDTH }),
      y: chance.integer({ min: 0, max: HEIGHT })
    };

    var placed = createRandomShape(pos);
    placed.rotate(chance.integer({ min: 0, max: 180 }));
    placed.scale(chance.floating({ min: 0.5, max: 1 }));

    placed.data.eligible = true;

    shapesArr.push(placed);
  }
};

var repositionShapes = function repositionShapes() {
  for (var i = 0; i < shapesArr.length; i++) {

    var pos = {
      x: chance.integer({ min: 0, max: WIDTH }),
      y: chance.integer({ min: 0, max: HEIGHT })
    };

    shapesArr[i].position = pos;
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

var onCollide = function onCollide(bullet, target, angle) {
  // console.log('onCollide', bullet);
  // shape has been collided with
  // create a few more shapes at its position
  // then remove it
  bullet.remove();

  for (var i = 0; i < traces.length; i++) {
    traces[i].remove();
  }

  var explosionRadius = chance.integer({ min: 20, max: 60 });
  var numParts = 5;
  var explosionShape = createExplosionPath(explosionRadius);
  explosionShape.position = target.position;

  for (var i = 0; i < numParts; i++) {

    var theta = angle + i * (180 / numParts) - 90;

    var pos = {
      x: target.position.x + explosionRadius * Math.cos(d2r(theta)),
      y: target.position.y + explosionRadius * Math.sin(d2r(theta))
    };

    var placed = createRandomShape(pos);
    placed.rotate(chance.integer({ min: 0, max: 180 }));
    placed.scale(chance.floating({ min: 0.5, max: 1 }));

    placed.data.eligible = false;
    placed.data.origin = target.position;
    placed.data.theta = theta;
    placed.data.parentPosition = target.position;

    explodingShapes.push(placed);
    ineligibleShapes.push(placed);

    shapesArr.push(placed);
  }

  NUM_SHAPES += numParts - 1;
  explosionInProgress = true;

  fireNewShape();
};

var fireNewShape = function fireNewShape() {
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
var shiftEvery = 60;
var explosionInProgress = false;
var traces = [];

var onMouseDown = function onMouseDown(event) {
  console.log(event.point);

  var placed = createRandomShape(event.point);
  placed.rotate(chance.integer({ min: 0, max: 180 }));
  placed.scale(chance.floating({ min: 0.5, max: 1 }));

  placed.data.eligible = true;
  shapesArr.push(placed);
  NUM_SHAPES++;
};

var numDragEvents = 0;

var onMouseDrag = function onMouseDrag(event) {

  if (numDragEvents % 4 === 0) {
    onMouseDown(event);
  }

  numDragEvents++;
};

var onFrame = function onFrame(event) {
  // console.log(event);
  if (move) {
    var vector = shapesArr[currentTargetIndex].position.subtract(shapesArr[currentBulletIndex].position);
    var originalLength = vector.length;

    if (event.count % 2 === 0) {
      traces.push(trace.place(new Point(shapesArr[currentBulletIndex].position)));
    }

    vector.length = WIDTH / 2;
    shapesArr[currentBulletIndex].position = shapesArr[currentBulletIndex].position.add(vector.divide(120));
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
      if (vector.length > 100) {
        explodingShapes = [];
      } else {
        explodingShapes[i].position = explodingShapes[i].position.subtract(vector.divide(300));
        explodingShapes[i].rotate(10);
      }
    }
  }

  // enable new shapes as bullets and targets
  if (event.count - lastShiftedAt > shiftEvery && ineligibleShapes.length) {
    shiftEvery = ineligibleShapes.length > 50 ? 1 : 60;
    ineligibleShapes[0].data.eligible = true;
    ineligibleShapes.shift();
    lastShiftedAt = event.count;
  }

  // triangle.definition.rotate(0.5);
  // square.definition.rotate(0.4);
  // hexagon.definition.rotate(0.2);
};