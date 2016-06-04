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

var COLORS = ['rgb(0, 157, 249)', 'rgb(255, 0, 217)', 'rgb(255, 193, 7)', 'rgb(0, 196, 194)'];

var createTracePath = function createTracePath() {
  var path = new Path.Circle(new Point(0, 0), 1);
  path.fillColor = 'rgb(0, 117, 185)';
  return path;
};

var createExplosionPath = function createExplosionPath(radius) {
  var path = new Path.Circle(new Point(0, 0), radius);
  path.fillColor = 'rgb(0, 196, 194)';
  path.opacity = 0.2;
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

window.onload = function () {
  var chance = new Chance();
  var canvas = document.getElementById('canvas');

  WIDTH = window.innerWidth;
  HEIGHT = window.innerHeight;

  console.log(WIDTH, HEIGHT);

  paper.setup(canvas);
  paper.view.onResize = onResize;
  paper.view.onFrame = onFrame;

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

    // pos = { x: 100, y: i * (HEIGHT / NUM_SHAPES) };

    var placed = createRandomShape(pos);
    placed.rotate(chance.integer({ min: 0, max: 180 }));
    placed.scale(chance.floating({ min: 0.5, max: 1 }));

    placed.data.eligible = true;

    shapesArr.push(placed);
  }
};

var onResize = function onResize(view) {
  WIDTH = view.size.width;
  HEIGHT = view.size.height;
};

var d2r = function d2r(deg) {
  return deg * Math.PI / 180;
};

var onCollide = function onCollide(bullet, target, angle) {
  console.log('onCollide', angle);
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

    var theta = i * (360 / numParts);

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
  currentBulletIndex = chance.integer({ min: 0, max: NUM_SHAPES - 1 });

  // ensure no newly created particles are the new target
  currentTargetIndex = chance.integer({ min: 0, max: NUM_SHAPES - 1 });

  if (shapesArr[currentBulletIndex].data.eligible && currentBulletIndex !== currentTargetIndex) {
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
        explodingShapes[i].position = explodingShapes[i].position.subtract(vector.divide(30));
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

  triangle.definition.rotate(0.5);
  square.definition.rotate(0.4);
  hexagon.definition.rotate(0.2);
};

},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvYW5keXNob3JhL0Rldi9jb2xsaXNpb25zL3NyYy9pbmRleC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O0FDRUEsWUFBWSxDQUFDOztBQUViLEtBQUssQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUM7O0FBRXRCLElBQU0sWUFBWSxHQUFHLENBQUMsQ0FBQztBQUN2QixJQUFJLFVBQVUsR0FBRyxFQUFFLENBQUM7O0FBRXBCLElBQUksS0FBSyxZQUFBLENBQUM7QUFDVixJQUFJLE1BQU0sWUFBQSxDQUFDO0FBQ1gsSUFBSSxTQUFTLEdBQUcsRUFBRSxDQUFDO0FBQ25CLElBQUksZ0JBQWdCLEdBQUcsRUFBRSxDQUFDO0FBQzFCLElBQUksZUFBZSxHQUFHLEVBQUUsQ0FBQztBQUN6QixJQUFJLE1BQU0sWUFBQTtJQUFFLE1BQU0sWUFBQTtJQUFFLE9BQU8sWUFBQTtJQUFFLFFBQVEsWUFBQTtJQUFFLEtBQUssWUFBQSxDQUFDO0FBQzdDLElBQUksSUFBSSxZQUFBLENBQUM7QUFDVCxJQUFJLGtCQUFrQixZQUFBO0lBQUUsa0JBQWtCLFlBQUEsQ0FBQzs7QUFFM0MsSUFBTSxNQUFNLEdBQUcsQ0FDYixrQkFBa0IsRUFDbEIsa0JBQWtCLEVBQ2xCLGtCQUFrQixFQUNsQixrQkFBa0IsQ0FDbkIsQ0FBQzs7QUFFRixJQUFNLGVBQWUsR0FBRyxTQUFsQixlQUFlLEdBQVM7QUFDNUIsTUFBSSxJQUFJLEdBQUcsSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztBQUMvQyxNQUFJLENBQUMsU0FBUyxHQUFHLGtCQUFrQixDQUFDO0FBQ3BDLFNBQU8sSUFBSSxDQUFDO0NBQ2IsQ0FBQzs7QUFFRixJQUFNLG1CQUFtQixHQUFHLFNBQXRCLG1CQUFtQixDQUFHLE1BQU0s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LENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxHQUFHLGVBQWUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztBQUN0Rix1QkFBZSxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQztPQUMvQjtLQUNGO0dBQ0Y7OztBQUdELE1BQUksQUFBQyxLQUFLLENBQUMsS0FBSyxHQUFHLGFBQWEsR0FBRyxVQUFVLElBQUssZ0JBQWdCLENBQUMsTUFBTSxFQUFFO0FBQ3pFLGNBQVUsR0FBRyxnQkFBZ0IsQ0FBQyxNQUFNLEdBQUcsRUFBRSxHQUFHLENBQUMsR0FBRyxFQUFFLENBQUM7QUFDbkQsb0JBQWdCLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUM7QUFDekMsb0JBQWdCLENBQUMsS0FBSyxFQUFFLENBQUM7QUFDekIsaUJBQWEsR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFDO0dBQzdCOztBQUVELFVBQVEsQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQ2hDLFFBQU0sQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQzlCLFNBQU8sQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0NBRWhDLENBQUMiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLy8gaW1wb3J0IHsgR2FtZSB9IGZyb20gJy4vR2FtZS5qcyc7XG5cbid1c2Ugc3RyaWN0JztcblxucGFwZXIuaW5zdGFsbCh3aW5kb3cpO1xuXG5jb25zdCBTSEFQRV9SQURJVVMgPSA0O1xubGV0IE5VTV9TSEFQRVMgPSA1MDtcblxubGV0IFdJRFRIO1xubGV0IEhFSUdIVDtcbmxldCBzaGFwZXNBcnIgPSBbXTtcbmxldCBpbmVsaWdpYmxlU2hhcGVzID0gW107XG5sZXQgZXhwbG9kaW5nU2hhcGVzID0gW107XG5sZXQgY2lyY2xlLCBzcXVhcmUsIGhleGFnb24sIHRyaWFuZ2xlLCB0cmFjZTtcbmxldCBtb3ZlO1xubGV0IGN1cnJlbnRCdWxsZXRJbmRleCwgY3VycmVudFRhcmdldEluZGV4O1xuXG5jb25zdCBDT0xPUlMgPSBbXG4gICdyZ2IoMCwgMTU3LCAyNDkpJyxcbiAgJ3JnYigyNTUsIDAsIDIxNyknLFxuICAncmdiKDI1NSwgMTkzLCA3KScsXG4gICdyZ2IoMCwgMTk2LCAxOTQpJ1xuXTtcblxuY29uc3QgY3JlYXRlVHJhY2VQYXRoID0gKCkgPT4ge1xuICBsZXQgcGF0aCA9IG5ldyBQYXRoLkNpcmNsZShuZXcgUG9pbnQoMCwgMCksIDEpO1xuICBwYXRoLmZpbGxDb2xvciA9ICdyZ2IoMCwgMTE3LCAxODUpJztcbiAgcmV0dXJuIHBhdGg7XG59O1xuXG5jb25zdCBjcmVhdGVFeHBsb3Npb25QYXRoID0gcmFkaXVzID0+IHtcbiAgbGV0IHBhdGggPSBuZXcgUGF0aC5DaXJjbGUobmV3IFBvaW50KDAsIDApLCByYWRpdXMpO1xuICBwYXRoLmZpbGxDb2xvciA9ICdyZ2IoMCwgMTk2LCAxOTQpJztcbiAgcGF0aC5vcGFjaXR5ID0gMC4yO1xuICByZXR1cm4gcGF0aDtcbn07XG5cbmNvbnN0IGNyZWF0ZUNpcmNsZVBhdGggPSAoKSA9PiB7XG4gIGxldCBwYXRoID0gbmV3IFBhdGguQ2lyY2xlKG5ldyBQb2ludCgwLCAwKSwgU0hBUEVfUkFESVVTKTtcbiAgcGF0aC5maWxsQ29sb3IgPSBDT0xPUlNbMF07XG4gIHJldHVybiBwYXRoO1xufTtcblxuY29uc3QgY3JlYXRlU3F1YXJlUGF0aCA9ICgpID0+IHtcbiAgbGV0IHBhdGggPSBuZXcgUGF0aC5SZWN0YW5nbGUobmV3IFBvaW50KDAsIDApLCBuZXcgUG9pbnQoU0hBUEVfUkFESVVTICogMiwgU0hBUEVfUkFESVVTICogMikpO1xuXG4gIHBhdGguZmlsbENvbG9yID0gQ09MT1JTWzFdO1xuICByZXR1cm4gcGF0aDtcbn07XG5cbmNvbnN0IGNyZWF0ZVRyaWFuZ2xlUGF0aCA9ICgpID0+IHtcbiAgbGV0IHBhdGggPSBuZXcgUGF0aC5SZWd1bGFyUG9seWdvbihuZXcgUG9pbnQoMCwgMCksIDMsIFNIQVBFX1JBRElVUyAqIDIpO1xuICBwYXRoLmZpbGxDb2xvciA9IENPTE9SU1syXTtcblxuICByZXR1cm4gcGF0aDtcbn07XG5cbmNvbnN0IGNyZWF0ZUhleGFnb25QYXRoID0gKCkgPT4ge1xuICAvLyBDcmVhdGUgYSBQYXBlci5qcyBQYXRoIHRvIGRyYXcgYSBsaW5lIGludG8gaXQ6XG4gIHZhciBoZXhhZ29uID0gbmV3IFBhdGgoKTtcblxuICB2YXIgcG9pbnRzID0gNjtcbiAgdmFyIHJhZGl1cyA9IFNIQVBFX1JBRElVUyAqIDEuNjtcbiAgdmFyIGFuZ2xlID0gKCgyICogTWF0aC5QSSkgLyBwb2ludHMpO1xuXG4gIGZvciAobGV0IGkgPSAwOyBpIDw9IHBvaW50czsgaSsrKSB7XG4gICAgaGV4YWdvbi5hZGQobmV3IFBvaW50KFxuICAgICAgcmFkaXVzICogTWF0aC5jb3MoYW5nbGUgKiBpKSxcbiAgICAgIHJhZGl1cyAqIE1hdGguc2luKGFuZ2xlICogaSlcbiAgICApKTtcbiAgfVxuXG4gIGhleGFnb24uZmlsbENvbG9yID0gQ09MT1JTWzNdO1xuXG4gIHJldHVybiBoZXhhZ29uO1xufTtcblxuY29uc3QgY3JlYXRlUmFuZG9tU2hhcGUgPSBwb3MgPT4ge1xuICBjb25zdCBzaGFwZUluZGV4ID0gY2hhbmNlLmludGVnZXIoeyBtaW46IDAsIG1heDogMyB9KTtcbiAgbGV0IHBhdGg7XG5cbiAgc3dpdGNoIChzaGFwZUluZGV4KSB7XG4gIGNhc2UgMDpcbiAgICBwYXRoID0gY2lyY2xlLnBsYWNlKG5ldyBQb2ludChwb3MueCwgcG9zLnkpKTtcbiAgICBicmVhaztcbiAgY2FzZSAxOlxuICAgIHBhdGggPSBzcXVhcmUucGxhY2UobmV3IFBvaW50KHBvcy54LCBwb3MueSkpO1xuICAgIGJyZWFrO1xuICBjYXNlIDI6XG4gICAgcGF0aCA9IGhleGFnb24ucGxhY2UobmV3IFBvaW50KHBvcy54LCBwb3MueSkpO1xuICAgIGJyZWFrO1xuICBjYXNlIDM6XG4gICAgcGF0aCA9IHRyaWFuZ2xlLnBsYWNlKG5ldyBQb2ludChwb3MueCwgcG9zLnkpKTtcbiAgICBicmVhaztcbiAgfVxuICByZXR1cm4gcGF0aDtcbn1cblxud2luZG93Lm9ubG9hZCA9ICgpID0+IHtcbiAgbGV0IGNoYW5jZSA9IG5ldyBDaGFuY2UoKTtcbiAgbGV0IGNhbnZhcyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjYW52YXMnKTtcblxuICBXSURUSCA9IHdpbmRvdy5pbm5lcldpZHRoO1xuICBIRUlHSFQgPSB3aW5kb3cuaW5uZXJIZWlnaHQ7XG5cbiAgY29uc29sZS5sb2coV0lEVEgsIEhFSUdIVCk7XG5cbiAgcGFwZXIuc2V0dXAoY2FudmFzKTtcbiAgcGFwZXIudmlldy5vblJlc2l6ZSA9IG9uUmVzaXplO1xuICBwYXBlci52aWV3Lm9uRnJhbWUgPSBvbkZyYW1lO1xuXG4gIHNldHVwU2hhcGVzKCk7XG4gIGZpcmVOZXdTaGFwZSgpO1xuXG59O1xuXG5jb25zdCBzZXR1cFNoYXBlcyA9ICgpID0+IHtcbiAgbGV0IGNpcmNsZVBhdGggPSBjcmVhdGVDaXJjbGVQYXRoKCk7XG4gIGxldCBzcXVhcmVQYXRoID0gY3JlYXRlU3F1YXJlUGF0aCgpO1xuICBsZXQgdHJpYW5nbGVQYXRoID0gY3JlYXRlVHJpYW5nbGVQYXRoKCk7XG4gIGxldCBoZXhhZ29uUGF0aCA9IGNyZWF0ZUhleGFnb25QYXRoKCk7XG4gIGxldCB0cmFjZVBhdGggPSBjcmVhdGVUcmFjZVBhdGgoKTtcblxuICBjaXJjbGUgPSBuZXcgU3ltYm9sKGNpcmNsZVBhdGgpO1xuICBzcXVhcmUgPSBuZXcgU3ltYm9sKHNxdWFyZVBhdGgpO1xuICBoZXhhZ29uID0gbmV3IFN5bWJvbChoZXhhZ29uUGF0aCk7XG4gIHRyaWFuZ2xlID0gbmV3IFN5bWJvbCh0cmlhbmdsZVBhdGgpO1xuICB0cmFjZSA9IG5ldyBTeW1ib2wodHJhY2VQYXRoKTtcblxuICBmb3IgKGxldCBpID0gMDsgaSA8IE5VTV9TSEFQRVM7IGkrKykge1xuXG4gICAgbGV0IHBvcyA9IHtcbiAgICAgIHg6IGNoYW5jZS5pbnRlZ2VyKHsgbWluOiAwLCBtYXg6IFdJRFRIIH0pLFxuICAgICAgeTogY2hhbmNlLmludGVnZXIoeyBtaW46IDAsIG1heDogSEVJR0hUIH0pXG4gICAgfTtcblxuICAgIC8vIHBvcyA9IHsgeDogMTAwLCB5OiBpICogKEhFSUdIVCAvIE5VTV9TSEFQRVMpIH07XG5cbiAgICBsZXQgcGxhY2VkID0gY3JlYXRlUmFuZG9tU2hhcGUocG9zKTtcbiAgICBwbGFjZWQucm90YXRlKGNoYW5jZS5pbnRlZ2VyKHsgbWluOiAwLCBtYXg6IDE4MCB9KSk7XG4gICAgcGxhY2VkLnNjYWxlKGNoYW5jZS5mbG9hdGluZyh7IG1pbjogMC41LCBtYXg6IDEgfSkpO1xuXG4gICAgcGxhY2VkLmRhdGEuZWxpZ2libGUgPSB0cnVlO1xuXG4gICAgc2hhcGVzQXJyLnB1c2gocGxhY2VkKTtcbiAgfVxuXG5cbn07XG5cbmNvbnN0IG9uUmVzaXplID0gdmlldyA9PiB7XG4gIFdJRFRIID0gdmlldy5zaXplLndpZHRoO1xuICBIRUlHSFQgPSB2aWV3LnNpemUuaGVpZ2h0O1xufTtcblxuY29uc3QgZDJyID0gZGVnID0+IHtcbiAgcmV0dXJuIGRlZyAqIE1hdGguUEkgLyAxODA7XG59O1xuXG5jb25zdCBvbkNvbGxpZGUgPSAoYnVsbGV0LCB0YXJnZXQsIGFuZ2xlKSA9PiB7XG4gIGNvbnNvbGUubG9nKCdvbkNvbGxpZGUnLCBhbmdsZSk7XG4gIC8vIHNoYXBlIGhhcyBiZWVuIGNvbGxpZGVkIHdpdGhcbiAgLy8gY3JlYXRlIGEgZmV3IG1vcmUgc2hhcGVzIGF0IGl0cyBwb3NpdGlvblxuICAvLyB0aGVuIHJlbW92ZSBpdFxuICBidWxsZXQucmVtb3ZlKCk7XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCB0cmFjZXMubGVuZ3RoOyBpKyspIHtcbiAgICB0cmFjZXNbaV0ucmVtb3ZlKCk7XG4gIH1cblxuXG4gIGNvbnN0IGV4cGxvc2lvblJhZGl1cyA9IGNoYW5jZS5pbnRlZ2VyKHsgbWluOiA0MCwgbWF4OiAxMDAgfSk7XG4gIGNvbnN0IG51bVBhcnRzID0gNTtcbiAgbGV0IGV4cGxvc2lvblNoYXBlID0gY3JlYXRlRXhwbG9zaW9uUGF0aChleHBsb3Npb25SYWRpdXMpO1xuICBleHBsb3Npb25TaGFwZS5wb3NpdGlvbiA9IHRhcmdldC5wb3NpdGlvbjtcblxuICBmb3IgKGxldCBpID0gMDsgaSA8IG51bVBhcnRzOyBpKyspIHtcblxuICAgIGNvbnN0IHRoZXRhID0gaSAqICgzNjAgLyBudW1QYXJ0cyk7XG5cbiAgICBsZXQgcG9zID0ge1xuICAgICAgeDogdGFyZ2V0LnBvc2l0aW9uLnggKyAoZXhwbG9zaW9uUmFkaXVzICogTWF0aC5jb3MoZDJyKHRoZXRhKSkpLFxuICAgICAgeTogdGFyZ2V0LnBvc2l0aW9uLnkgKyAoZXhwbG9zaW9uUmFkaXVzICogTWF0aC5zaW4oZDJyKHRoZXRhKSkpXG4gICAgfTtcblxuICAgIGxldCBwbGFjZWQgPSBjcmVhdGVSYW5kb21TaGFwZShwb3MpO1xuICAgIHBsYWNlZC5yb3RhdGUoY2hhbmNlLmludGVnZXIoeyBtaW46IDAsIG1heDogMTgwIH0pKTtcbiAgICBwbGFjZWQuc2NhbGUoY2hhbmNlLmZsb2F0aW5nKHsgbWluOiAwLjUsIG1heDogMSB9KSk7XG5cbiAgICBwbGFjZWQuZGF0YS5lbGlnaWJsZSA9IGZhbHNlO1xuICAgIHBsYWNlZC5kYXRhLm9yaWdpbiA9IHRhcmdldC5wb3NpdGlvbjtcbiAgICBwbGFjZWQuZGF0YS50aGV0YSA9IHRoZXRhO1xuICAgIHBsYWNlZC5kYXRhLnBhcmVudFBvc2l0aW9uID0gdGFyZ2V0LnBvc2l0aW9uO1xuXG4gICAgZXhwbG9kaW5nU2hhcGVzLnB1c2gocGxhY2VkKTtcbiAgICBpbmVsaWdpYmxlU2hhcGVzLnB1c2gocGxhY2VkKTtcblxuICAgIHNoYXBlc0Fyci5wdXNoKHBsYWNlZCk7XG4gIH1cblxuICBOVU1fU0hBUEVTICs9IG51bVBhcnRzIC0gMTtcbiAgZXhwbG9zaW9uSW5Qcm9ncmVzcyA9IHRydWU7XG5cbiAgZmlyZU5ld1NoYXBlKCk7XG5cbn07XG5cbmNvbnN0IGZpcmVOZXdTaGFwZSA9ICgpID0+IHtcbiAgY3VycmVudEJ1bGxldEluZGV4ID0gY2hhbmNlLmludGVnZXIoeyBtaW46IDAsIG1heDogTlVNX1NIQVBFUyAtIDEgfSk7XG5cbiAgLy8gZW5zdXJlIG5vIG5ld2x5IGNyZWF0ZWQgcGFydGljbGVzIGFyZSB0aGUgbmV3IHRhcmdldFxuICBjdXJyZW50VGFyZ2V0SW5kZXggPSBjaGFuY2UuaW50ZWdlcih7IG1pbjogMCwgbWF4OiBOVU1fU0hBUEVTIC0gMSB9KTtcblxuICBpZiAoc2hhcGVzQXJyW2N1cnJlbnRCdWxsZXRJbmRleF0uZGF0YS5lbGlnaWJsZSAmJiBjdXJyZW50QnVsbGV0SW5kZXggIT09IGN1cnJlbnRUYXJnZXRJbmRleCkge1xuICAgIG1vdmUgPSB0cnVlO1xuICB9IGVsc2Uge1xuICAgIC8vIGNvbnNvbGUud2Fybignbm90IGVsaWdpYmxlJyk7XG4gICAgZmlyZU5ld1NoYXBlKCk7XG4gIH1cblxufTtcblxubGV0IGxhc3RTaGlmdGVkQXQgPSAwO1xubGV0IHNoaWZ0RXZlcnkgPSA2MDtcbmxldCBleHBsb3Npb25JblByb2dyZXNzID0gZmFsc2U7XG5sZXQgdHJhY2VzID0gW107XG5cbmNvbnN0IG9uRnJhbWUgPSBldmVudCA9PiB7XG4gIC8vIGNvbnNvbGUubG9nKGV2ZW50KTtcbiAgaWYgKG1vdmUpIHtcbiAgICBsZXQgdmVjdG9yID0gc2hhcGVzQXJyW2N1cnJlbnRUYXJnZXRJbmRleF0ucG9zaXRpb24uc3VidHJhY3Qoc2hhcGVzQXJyW2N1cnJlbnRCdWxsZXRJbmRleF0ucG9zaXRpb24pO1xuICAgIGNvbnN0IG9yaWdpbmFsTGVuZ3RoID0gdmVjdG9yLmxlbmd0aDtcblxuICAgIHRyYWNlcy5wdXNoKHRyYWNlLnBsYWNlKG5ldyBQb2ludChzaGFwZXNBcnJbY3VycmVudEJ1bGxldEluZGV4XS5wb3NpdGlvbikpKTtcblxuICAgIHZlY3Rvci5sZW5ndGggPSBXSURUSCAvIDI7XG4gICAgc2hhcGVzQXJyW2N1cnJlbnRCdWxsZXRJbmRleF0ucG9zaXRpb24gPSBzaGFwZXNBcnJbY3VycmVudEJ1bGxldEluZGV4XS5wb3NpdGlvbi5hZGQodmVjdG9yLmRpdmlkZSgxMjApKTtcbiAgICBzaGFwZXNBcnJbY3VycmVudEJ1bGxldEluZGV4XS5yb3RhdGUoMSk7XG5cbiAgICBpZiAob3JpZ2luYWxMZW5ndGggPCA1KSB7XG5cbiAgICAgIG1vdmUgPSBmYWxzZTtcbiAgICAgIG9uQ29sbGlkZShzaGFwZXNBcnJbY3VycmVudEJ1bGxldEluZGV4XSwgc2hhcGVzQXJyW2N1cnJlbnRUYXJnZXRJbmRleF0sIHZlY3Rvci5hbmdsZSk7XG4gICAgfVxuICB9XG5cbiAgaWYgKGV4cGxvc2lvbkluUHJvZ3Jlc3MpIHtcbiAgICAvLyBtb3ZlIHBhcnRzIG91dCBmcm9tIHRoZWlyIG9yaWdpblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZXhwbG9kaW5nU2hhcGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBsZXQgdmVjdG9yID0gZXhwbG9kaW5nU2hhcGVzW2ldLmRhdGEucGFyZW50UG9zaXRpb24uc3VidHJhY3QoZXhwbG9kaW5nU2hhcGVzW2ldLnBvc2l0aW9uKTtcbiAgICAgIGlmICh2ZWN0b3IubGVuZ3RoID4gMTAwKSB7XG4gICAgICAgIGV4cGxvZGluZ1NoYXBlcyA9IFtdO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZXhwbG9kaW5nU2hhcGVzW2ldLnBvc2l0aW9uID0gZXhwbG9kaW5nU2hhcGVzW2ldLnBvc2l0aW9uLnN1YnRyYWN0KHZlY3Rvci5kaXZpZGUoMzApKTtcbiAgICAgICAgZXhwbG9kaW5nU2hhcGVzW2ldLnJvdGF0ZSgxMCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLy8gZW5hYmxlIG5ldyBzaGFwZXMgYXMgYnVsbGV0cyBhbmQgdGFyZ2V0c1xuICBpZiAoKGV2ZW50LmNvdW50IC0gbGFzdFNoaWZ0ZWRBdCA+IHNoaWZ0RXZlcnkpICYmIGluZWxpZ2libGVTaGFwZXMubGVuZ3RoKSB7XG4gICAgc2hpZnRFdmVyeSA9IGluZWxpZ2libGVTaGFwZXMubGVuZ3RoID4gNTAgPyAxIDogNjA7XG4gICAgaW5lbGlnaWJsZVNoYXBlc1swXS5kYXRhLmVsaWdpYmxlID0gdHJ1ZTtcbiAgICBpbmVsaWdpYmxlU2hhcGVzLnNoaWZ0KCk7XG4gICAgbGFzdFNoaWZ0ZWRBdCA9IGV2ZW50LmNvdW50O1xuICB9XG5cbiAgdHJpYW5nbGUuZGVmaW5pdGlvbi5yb3RhdGUoMC41KTtcbiAgc3F1YXJlLmRlZmluaXRpb24ucm90YXRlKDAuNCk7XG4gIGhleGFnb24uZGVmaW5pdGlvbi5yb3RhdGUoMC4yKTtcblxufTtcbiJdfQ==