(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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
  path.fillColor = 'rgb(0, 117, 185)';
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

  var explosionRadius = chance.integer({ min: 40, max: 100 });
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

    traces.push(trace.place(new Point(shapesArr[currentBulletIndex].position)));

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

},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvYW5keXNob3JhL0Rldi9jb2xsaXNpb25zL3NyYy9pbmRleC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O0FDRUEsWUFBWSxDQUFDOztBQUViLEtBQUssQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUM7O0FBRXRCLElBQU0sWUFBWSxHQUFHLENBQUMsQ0FBQztBQUN2QixJQUFJLFVBQVUsR0FBRyxFQUFFLENBQUM7O0FBRXBCLElBQUksS0FBSyxZQUFBLENBQUM7QUFDVixJQUFJLE1BQU0sWUFBQSxDQUFDO0FBQ1gsSUFBSSxTQUFTLEdBQUcsRUFBRSxDQUFDO0FBQ25CLElBQUksZ0JBQWdCLEdBQUcsRUFBRSxDQUFDO0FBQzFCLElBQUksZUFBZSxHQUFHLEVBQUUsQ0FBQztBQUN6QixJQUFJLE1BQU0sWUFBQTtJQUFFLE1BQU0sWUFBQTtJQUFFLE9BQU8sWUFBQTtJQUFFLFFBQVEsWUFBQTtJQUFFLEtBQUssWUFBQSxDQUFDO0FBQzdDLElBQUksSUFBSSxZQUFBLENBQUM7QUFDVCxJQUFJLGtCQUFrQixZQUFBO0lBQUUsa0JBQWtCLFlBQUEsQ0FBQzs7QUFFM0MsSUFBTSxNQUFNLEdBQUcsQ0FDYixrQkFBa0IsRUFDbEIsa0JBQWtCLEVBQ2xCLGtCQUFrQixFQUNsQixrQkFBa0IsQ0FDbkIsQ0FBQzs7QUFFRixJQUFNLGVBQWUsR0FBRyxTQUFsQixlQUFlLEdBQVM7QUFDNUIsTUFBSSxJQUFJLEdBQUcsSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztBQUMvQyxNQUFJLENBQUMsU0FBUyxHQUFHLGtCQUFrQixDQUFDO0FBQ3BDLFNBQU8sSUFBSSxDQUFDO0NBQ2IsQ0FBQzs7QUFFRixJQUFNLG1CQUFtQixHQUFHLFNBQXRCLG1CQUFtQixDQUFHLE1BQU0s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dXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8vIGltcG9ydCB7IEdhbWUgfSBmcm9tICcuL0dhbWUuanMnO1xuXG4ndXNlIHN0cmljdCc7XG5cbnBhcGVyLmluc3RhbGwod2luZG93KTtcblxuY29uc3QgU0hBUEVfUkFESVVTID0gNDtcbmxldCBOVU1fU0hBUEVTID0gNTA7XG5cbmxldCBXSURUSDtcbmxldCBIRUlHSFQ7XG5sZXQgc2hhcGVzQXJyID0gW107XG5sZXQgaW5lbGlnaWJsZVNoYXBlcyA9IFtdO1xubGV0IGV4cGxvZGluZ1NoYXBlcyA9IFtdO1xubGV0IGNpcmNsZSwgc3F1YXJlLCBoZXhhZ29uLCB0cmlhbmdsZSwgdHJhY2U7XG5sZXQgbW92ZTtcbmxldCBjdXJyZW50QnVsbGV0SW5kZXgsIGN1cnJlbnRUYXJnZXRJbmRleDtcblxuY29uc3QgQ09MT1JTID0gW1xuICAncmdiKDAsIDE1NywgMjQ5KScsXG4gICdyZ2IoMjU1LCAwLCAyMTcpJyxcbiAgJ3JnYigwLCAxMTcsIDE4NSknLFxuICAncmdiKDAsIDE5NiwgMTk0KSdcbl07XG5cbmNvbnN0IGNyZWF0ZVRyYWNlUGF0aCA9ICgpID0+IHtcbiAgbGV0IHBhdGggPSBuZXcgUGF0aC5DaXJjbGUobmV3IFBvaW50KDAsIDApLCAxKTtcbiAgcGF0aC5maWxsQ29sb3IgPSAncmdiKDAsIDExNywgMTg1KSc7XG4gIHJldHVybiBwYXRoO1xufTtcblxuY29uc3QgY3JlYXRlRXhwbG9zaW9uUGF0aCA9IHJhZGl1cyA9PiB7XG4gIGxldCBwYXRoID0gbmV3IFBhdGguQ2lyY2xlKG5ldyBQb2ludCgwLCAwKSwgcmFkaXVzKTtcbiAgcGF0aC5maWxsQ29sb3IgPSAncmdiKDI1NSwgMjU1LCAyNTUpJztcbiAgcGF0aC5vcGFjaXR5ID0gMC4wNTtcblxuICAvKnBhdGguZmlsbENvbG9yID0ge1xuICAgIGdyYWRpZW50OiB7XG4gICAgICBzdG9wczogW1sncmdiKDAsIDExNywgMTg1KScsIDBdLCBbJ3JnYmEoMCwgMTE3LCAxODUsIDApJywgMV1dLFxuICAgICAgcmFkaWFsOiB0cnVlXG4gICAgfSxcbiAgICBvcmlnaW46IHBhdGgucG9zaXRpb24sXG4gICAgZGVzdGluYXRpb246IHBhdGguYm91bmRzLnJpZ2h0Q2VudGVyXG4gIH07Ki9cblxuICByZXR1cm4gcGF0aDtcbn07XG5cbmNvbnN0IGNyZWF0ZUNpcmNsZVBhdGggPSAoKSA9PiB7XG4gIGxldCBwYXRoID0gbmV3IFBhdGguQ2lyY2xlKG5ldyBQb2ludCgwLCAwKSwgU0hBUEVfUkFESVVTKTtcbiAgcGF0aC5maWxsQ29sb3IgPSBDT0xPUlNbMF07XG4gIHJldHVybiBwYXRoO1xufTtcblxuY29uc3QgY3JlYXRlU3F1YXJlUGF0aCA9ICgpID0+IHtcbiAgbGV0IHBhdGggPSBuZXcgUGF0aC5SZWN0YW5nbGUobmV3IFBvaW50KDAsIDApLCBuZXcgUG9pbnQoU0hBUEVfUkFESVVTICogMiwgU0hBUEVfUkFESVVTICogMikpO1xuXG4gIHBhdGguZmlsbENvbG9yID0gQ09MT1JTWzFdO1xuICByZXR1cm4gcGF0aDtcbn07XG5cbmNvbnN0IGNyZWF0ZVRyaWFuZ2xlUGF0aCA9ICgpID0+IHtcbiAgbGV0IHBhdGggPSBuZXcgUGF0aC5SZWd1bGFyUG9seWdvbihuZXcgUG9pbnQoMCwgMCksIDMsIFNIQVBFX1JBRElVUyAqIDIpO1xuICBwYXRoLmZpbGxDb2xvciA9IENPTE9SU1syXTtcblxuICByZXR1cm4gcGF0aDtcbn07XG5cbmNvbnN0IGNyZWF0ZUhleGFnb25QYXRoID0gKCkgPT4ge1xuICAvLyBDcmVhdGUgYSBQYXBlci5qcyBQYXRoIHRvIGRyYXcgYSBsaW5lIGludG8gaXQ6XG4gIHZhciBoZXhhZ29uID0gbmV3IFBhdGgoKTtcblxuICB2YXIgcG9pbnRzID0gNjtcbiAgdmFyIHJhZGl1cyA9IFNIQVBFX1JBRElVUyAqIDEuNjtcbiAgdmFyIGFuZ2xlID0gKCgyICogTWF0aC5QSSkgLyBwb2ludHMpO1xuXG4gIGZvciAobGV0IGkgPSAwOyBpIDw9IHBvaW50czsgaSsrKSB7XG4gICAgaGV4YWdvbi5hZGQobmV3IFBvaW50KFxuICAgICAgcmFkaXVzICogTWF0aC5jb3MoYW5nbGUgKiBpKSxcbiAgICAgIHJhZGl1cyAqIE1hdGguc2luKGFuZ2xlICogaSlcbiAgICApKTtcbiAgfVxuXG4gIGhleGFnb24uZmlsbENvbG9yID0gQ09MT1JTWzNdO1xuXG4gIHJldHVybiBoZXhhZ29uO1xufTtcblxuY29uc3QgY3JlYXRlUmFuZG9tU2hhcGUgPSBwb3MgPT4ge1xuICBjb25zdCBzaGFwZUluZGV4ID0gY2hhbmNlLmludGVnZXIoeyBtaW46IDAsIG1heDogMyB9KTtcbiAgbGV0IHBhdGg7XG5cbiAgc3dpdGNoIChzaGFwZUluZGV4KSB7XG4gIGNhc2UgMDpcbiAgICBwYXRoID0gY2lyY2xlLnBsYWNlKG5ldyBQb2ludChwb3MueCwgcG9zLnkpKTtcbiAgICBicmVhaztcbiAgY2FzZSAxOlxuICAgIHBhdGggPSBzcXVhcmUucGxhY2UobmV3IFBvaW50KHBvcy54LCBwb3MueSkpO1xuICAgIGJyZWFrO1xuICBjYXNlIDI6XG4gICAgcGF0aCA9IGhleGFnb24ucGxhY2UobmV3IFBvaW50KHBvcy54LCBwb3MueSkpO1xuICAgIGJyZWFrO1xuICBjYXNlIDM6XG4gICAgcGF0aCA9IHRyaWFuZ2xlLnBsYWNlKG5ldyBQb2ludChwb3MueCwgcG9zLnkpKTtcbiAgICBicmVhaztcbiAgfVxuICByZXR1cm4gcGF0aDtcbn1cblxubGV0IHRvb2w7XG5cbndpbmRvdy5vbmxvYWQgPSAoKSA9PiB7XG4gIGxldCBjaGFuY2UgPSBuZXcgQ2hhbmNlKCk7XG4gIGxldCBjYW52YXMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY2FudmFzJyk7XG4gIHRvb2wgPSBuZXcgVG9vbCgpO1xuXG4gIFdJRFRIID0gd2luZG93LmlubmVyV2lkdGg7XG4gIEhFSUdIVCA9IHdpbmRvdy5pbm5lckhlaWdodDtcblxuICBjb25zb2xlLmxvZyhXSURUSCwgSEVJR0hUKTtcblxuICBwYXBlci5zZXR1cChjYW52YXMpO1xuICBwYXBlci52aWV3Lm9uUmVzaXplID0gb25SZXNpemU7XG4gIHBhcGVyLnZpZXcub25GcmFtZSA9IG9uRnJhbWU7XG5cbiAgdG9vbC5vbk1vdXNlRG93biA9IG9uTW91c2VEb3duO1xuICB0b29sLm9uTW91c2VEcmFnID0gb25Nb3VzZURyYWc7XG5cbiAgc2V0dXBTaGFwZXMoKTtcbiAgZmlyZU5ld1NoYXBlKCk7XG5cbn07XG5cbmNvbnN0IHNldHVwU2hhcGVzID0gKCkgPT4ge1xuICBsZXQgY2lyY2xlUGF0aCA9IGNyZWF0ZUNpcmNsZVBhdGgoKTtcbiAgbGV0IHNxdWFyZVBhdGggPSBjcmVhdGVTcXVhcmVQYXRoKCk7XG4gIGxldCB0cmlhbmdsZVBhdGggPSBjcmVhdGVUcmlhbmdsZVBhdGgoKTtcbiAgbGV0IGhleGFnb25QYXRoID0gY3JlYXRlSGV4YWdvblBhdGgoKTtcbiAgbGV0IHRyYWNlUGF0aCA9IGNyZWF0ZVRyYWNlUGF0aCgpO1xuXG4gIGNpcmNsZSA9IG5ldyBTeW1ib2woY2lyY2xlUGF0aCk7XG4gIHNxdWFyZSA9IG5ldyBTeW1ib2woc3F1YXJlUGF0aCk7XG4gIGhleGFnb24gPSBuZXcgU3ltYm9sKGhleGFnb25QYXRoKTtcbiAgdHJpYW5nbGUgPSBuZXcgU3ltYm9sKHRyaWFuZ2xlUGF0aCk7XG4gIHRyYWNlID0gbmV3IFN5bWJvbCh0cmFjZVBhdGgpO1xuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgTlVNX1NIQVBFUzsgaSsrKSB7XG5cbiAgICBsZXQgcG9zID0ge1xuICAgICAgeDogY2hhbmNlLmludGVnZXIoeyBtaW46IDAsIG1heDogV0lEVEggfSksXG4gICAgICB5OiBjaGFuY2UuaW50ZWdlcih7IG1pbjogMCwgbWF4OiBIRUlHSFQgfSlcbiAgICB9O1xuXG4gICAgbGV0IHBsYWNlZCA9IGNyZWF0ZVJhbmRvbVNoYXBlKHBvcyk7XG4gICAgcGxhY2VkLnJvdGF0ZShjaGFuY2UuaW50ZWdlcih7IG1pbjogMCwgbWF4OiAxODAgfSkpO1xuICAgIHBsYWNlZC5zY2FsZShjaGFuY2UuZmxvYXRpbmcoeyBtaW46IDAuNSwgbWF4OiAxIH0pKTtcblxuICAgIHBsYWNlZC5kYXRhLmVsaWdpYmxlID0gdHJ1ZTtcblxuICAgIHNoYXBlc0Fyci5wdXNoKHBsYWNlZCk7XG4gIH1cblxuXG59O1xuXG5jb25zdCByZXBvc2l0aW9uU2hhcGVzID0gKCkgPT4ge1xuICBmb3IgKGxldCBpID0gMDsgaSA8IHNoYXBlc0Fyci5sZW5ndGg7IGkrKykge1xuXG4gICAgbGV0IHBvcyA9IHtcbiAgICAgIHg6IGNoYW5jZS5pbnRlZ2VyKHsgbWluOiAwLCBtYXg6IFdJRFRIIH0pLFxuICAgICAgeTogY2hhbmNlLmludGVnZXIoeyBtaW46IDAsIG1heDogSEVJR0hUIH0pXG4gICAgfTtcblxuICAgIHNoYXBlc0FycltpXS5wb3NpdGlvbiA9IHBvcztcbiAgfVxufTtcblxuY29uc3Qgb25SZXNpemUgPSB2aWV3ID0+IHtcbiAgV0lEVEggPSB2aWV3LnNpemUud2lkdGg7XG4gIEhFSUdIVCA9IHZpZXcuc2l6ZS5oZWlnaHQ7XG5cbiAgcmVwb3NpdGlvblNoYXBlcygpO1xufTtcblxuY29uc3QgZDJyID0gZGVnID0+IHtcbiAgcmV0dXJuIGRlZyAqIE1hdGguUEkgLyAxODA7XG59O1xuXG5jb25zdCBvbkNvbGxpZGUgPSAoYnVsbGV0LCB0YXJnZXQsIGFuZ2xlKSA9PiB7XG4gIC8vIGNvbnNvbGUubG9nKCdvbkNvbGxpZGUnLCBidWxsZXQpO1xuICAvLyBzaGFwZSBoYXMgYmVlbiBjb2xsaWRlZCB3aXRoXG4gIC8vIGNyZWF0ZSBhIGZldyBtb3JlIHNoYXBlcyBhdCBpdHMgcG9zaXRpb25cbiAgLy8gdGhlbiByZW1vdmUgaXRcbiAgYnVsbGV0LnJlbW92ZSgpO1xuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgdHJhY2VzLmxlbmd0aDsgaSsrKSB7XG4gICAgdHJhY2VzW2ldLnJlbW92ZSgpO1xuICB9XG5cbiAgY29uc3QgZXhwbG9zaW9uUmFkaXVzID0gY2hhbmNlLmludGVnZXIoeyBtaW46IDQwLCBtYXg6IDEwMCB9KTtcbiAgY29uc3QgbnVtUGFydHMgPSA1O1xuICBsZXQgZXhwbG9zaW9uU2hhcGUgPSBjcmVhdGVFeHBsb3Npb25QYXRoKGV4cGxvc2lvblJhZGl1cyk7XG4gIGV4cGxvc2lvblNoYXBlLnBvc2l0aW9uID0gdGFyZ2V0LnBvc2l0aW9uO1xuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgbnVtUGFydHM7IGkrKykge1xuXG4gICAgY29uc3QgdGhldGEgPSBhbmdsZSArIChpICogKDE4MCAvIG51bVBhcnRzKSkgLSA5MDtcblxuICAgIGxldCBwb3MgPSB7XG4gICAgICB4OiB0YXJnZXQucG9zaXRpb24ueCArIChleHBsb3Npb25SYWRpdXMgKiBNYXRoLmNvcyhkMnIodGhldGEpKSksXG4gICAgICB5OiB0YXJnZXQucG9zaXRpb24ueSArIChleHBsb3Npb25SYWRpdXMgKiBNYXRoLnNpbihkMnIodGhldGEpKSlcbiAgICB9O1xuXG4gICAgbGV0IHBsYWNlZCA9IGNyZWF0ZVJhbmRvbVNoYXBlKHBvcyk7XG4gICAgcGxhY2VkLnJvdGF0ZShjaGFuY2UuaW50ZWdlcih7IG1pbjogMCwgbWF4OiAxODAgfSkpO1xuICAgIHBsYWNlZC5zY2FsZShjaGFuY2UuZmxvYXRpbmcoeyBtaW46IDAuNSwgbWF4OiAxIH0pKTtcblxuICAgIHBsYWNlZC5kYXRhLmVsaWdpYmxlID0gZmFsc2U7XG4gICAgcGxhY2VkLmRhdGEub3JpZ2luID0gdGFyZ2V0LnBvc2l0aW9uO1xuICAgIHBsYWNlZC5kYXRhLnRoZXRhID0gdGhldGE7XG4gICAgcGxhY2VkLmRhdGEucGFyZW50UG9zaXRpb24gPSB0YXJnZXQucG9zaXRpb247XG5cbiAgICBleHBsb2RpbmdTaGFwZXMucHVzaChwbGFjZWQpO1xuICAgIGluZWxpZ2libGVTaGFwZXMucHVzaChwbGFjZWQpO1xuXG4gICAgc2hhcGVzQXJyLnB1c2gocGxhY2VkKTtcbiAgfVxuXG4gIE5VTV9TSEFQRVMgKz0gbnVtUGFydHMgLSAxO1xuICBleHBsb3Npb25JblByb2dyZXNzID0gdHJ1ZTtcblxuICBmaXJlTmV3U2hhcGUoKTtcblxufTtcblxuY29uc3QgZmlyZU5ld1NoYXBlID0gKCkgPT4ge1xuICBjdXJyZW50QnVsbGV0SW5kZXggPSBjaGFuY2UuaW50ZWdlcih7IG1pbjogMCwgbWF4OiBzaGFwZXNBcnIubGVuZ3RoIC0gMSB9KTtcblxuICAvLyBlbnN1cmUgbm8gbmV3bHkgY3JlYXRlZCBwYXJ0aWNsZXMgYXJlIHRoZSBuZXcgdGFyZ2V0XG4gIGN1cnJlbnRUYXJnZXRJbmRleCA9IGNoYW5jZS5pbnRlZ2VyKHsgbWluOiAwLCBtYXg6IHNoYXBlc0Fyci5sZW5ndGggLSAxIH0pO1xuXG4gIGlmIChzaGFwZXNBcnJbY3VycmVudEJ1bGxldEluZGV4XS5kYXRhLmVsaWdpYmxlXG4gICAgJiYgY3VycmVudEJ1bGxldEluZGV4ICE9PSBjdXJyZW50VGFyZ2V0SW5kZXhcbiAgICAmJiB0eXBlb2Ygc2hhcGVzQXJyW2N1cnJlbnRCdWxsZXRJbmRleF0uX2luZGV4ICE9PSAndW5kZWZpbmVkJykge1xuICAgIG1vdmUgPSB0cnVlO1xuICB9IGVsc2Uge1xuICAgIC8vIGNvbnNvbGUud2Fybignbm90IGVsaWdpYmxlJyk7XG4gICAgZmlyZU5ld1NoYXBlKCk7XG4gIH1cblxufTtcblxubGV0IGxhc3RTaGlmdGVkQXQgPSAwO1xubGV0IHNoaWZ0RXZlcnkgPSA2MDtcbmxldCBleHBsb3Npb25JblByb2dyZXNzID0gZmFsc2U7XG5sZXQgdHJhY2VzID0gW107XG5cbmNvbnN0IG9uTW91c2VEb3duID0gZXZlbnQgPT4ge1xuICBjb25zb2xlLmxvZyhldmVudC5wb2ludCk7XG5cbiAgbGV0IHBsYWNlZCA9IGNyZWF0ZVJhbmRvbVNoYXBlKGV2ZW50LnBvaW50KTtcbiAgcGxhY2VkLnJvdGF0ZShjaGFuY2UuaW50ZWdlcih7IG1pbjogMCwgbWF4OiAxODAgfSkpO1xuICBwbGFjZWQuc2NhbGUoY2hhbmNlLmZsb2F0aW5nKHsgbWluOiAwLjUsIG1heDogMSB9KSk7XG5cbiAgcGxhY2VkLmRhdGEuZWxpZ2libGUgPSB0cnVlO1xuICBzaGFwZXNBcnIucHVzaChwbGFjZWQpO1xuICBOVU1fU0hBUEVTKys7XG59O1xuXG5sZXQgbnVtRHJhZ0V2ZW50cyA9IDA7XG5cbmNvbnN0IG9uTW91c2VEcmFnID0gZXZlbnQgPT4ge1xuXG4gIGlmIChudW1EcmFnRXZlbnRzICUgNCA9PT0gMCkge1xuICAgIG9uTW91c2VEb3duKGV2ZW50KTtcblxuICB9XG5cbiAgbnVtRHJhZ0V2ZW50cysrO1xufTtcblxuY29uc3Qgb25GcmFtZSA9IGV2ZW50ID0+IHtcbiAgLy8gY29uc29sZS5sb2coZXZlbnQpO1xuICBpZiAobW92ZSkge1xuICAgIGxldCB2ZWN0b3IgPSBzaGFwZXNBcnJbY3VycmVudFRhcmdldEluZGV4XS5wb3NpdGlvbi5zdWJ0cmFjdChzaGFwZXNBcnJbY3VycmVudEJ1bGxldEluZGV4XS5wb3NpdGlvbik7XG4gICAgY29uc3Qgb3JpZ2luYWxMZW5ndGggPSB2ZWN0b3IubGVuZ3RoO1xuXG4gICAgdHJhY2VzLnB1c2godHJhY2UucGxhY2UobmV3IFBvaW50KHNoYXBlc0FycltjdXJyZW50QnVsbGV0SW5kZXhdLnBvc2l0aW9uKSkpO1xuXG4gICAgdmVjdG9yLmxlbmd0aCA9IFdJRFRIIC8gMjtcbiAgICBzaGFwZXNBcnJbY3VycmVudEJ1bGxldEluZGV4XS5wb3NpdGlvbiA9IHNoYXBlc0FycltjdXJyZW50QnVsbGV0SW5kZXhdLnBvc2l0aW9uLmFkZCh2ZWN0b3IuZGl2aWRlKDEyMCkpO1xuICAgIHNoYXBlc0FycltjdXJyZW50QnVsbGV0SW5kZXhdLnJvdGF0ZSgxKTtcblxuICAgIGlmIChvcmlnaW5hbExlbmd0aCA8IDUpIHtcblxuICAgICAgbW92ZSA9IGZhbHNlO1xuICAgICAgb25Db2xsaWRlKHNoYXBlc0FycltjdXJyZW50QnVsbGV0SW5kZXhdLCBzaGFwZXNBcnJbY3VycmVudFRhcmdldEluZGV4XSwgdmVjdG9yLmFuZ2xlKTtcbiAgICB9XG4gIH1cblxuICBpZiAoZXhwbG9zaW9uSW5Qcm9ncmVzcykge1xuICAgIC8vIG1vdmUgcGFydHMgb3V0IGZyb20gdGhlaXIgb3JpZ2luXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBleHBsb2RpbmdTaGFwZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGxldCB2ZWN0b3IgPSBleHBsb2RpbmdTaGFwZXNbaV0uZGF0YS5wYXJlbnRQb3NpdGlvbi5zdWJ0cmFjdChleHBsb2RpbmdTaGFwZXNbaV0ucG9zaXRpb24pO1xuICAgICAgaWYgKHZlY3Rvci5sZW5ndGggPiAxMDApIHtcbiAgICAgICAgZXhwbG9kaW5nU2hhcGVzID0gW107XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBleHBsb2RpbmdTaGFwZXNbaV0ucG9zaXRpb24gPSBleHBsb2RpbmdTaGFwZXNbaV0ucG9zaXRpb24uc3VidHJhY3QodmVjdG9yLmRpdmlkZSgzMDApKTtcbiAgICAgICAgZXhwbG9kaW5nU2hhcGVzW2ldLnJvdGF0ZSgxMCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLy8gZW5hYmxlIG5ldyBzaGFwZXMgYXMgYnVsbGV0cyBhbmQgdGFyZ2V0c1xuICBpZiAoKGV2ZW50LmNvdW50IC0gbGFzdFNoaWZ0ZWRBdCA+IHNoaWZ0RXZlcnkpICYmIGluZWxpZ2libGVTaGFwZXMubGVuZ3RoKSB7XG4gICAgc2hpZnRFdmVyeSA9IGluZWxpZ2libGVTaGFwZXMubGVuZ3RoID4gNTAgPyAxIDogNjA7XG4gICAgaW5lbGlnaWJsZVNoYXBlc1swXS5kYXRhLmVsaWdpYmxlID0gdHJ1ZTtcbiAgICBpbmVsaWdpYmxlU2hhcGVzLnNoaWZ0KCk7XG4gICAgbGFzdFNoaWZ0ZWRBdCA9IGV2ZW50LmNvdW50O1xuICB9XG5cbiAgLy8gdHJpYW5nbGUuZGVmaW5pdGlvbi5yb3RhdGUoMC41KTtcbiAgLy8gc3F1YXJlLmRlZmluaXRpb24ucm90YXRlKDAuNCk7XG4gIC8vIGhleGFnb24uZGVmaW5pdGlvbi5yb3RhdGUoMC4yKTtcblxufTtcbiJdfQ==
