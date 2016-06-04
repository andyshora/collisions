/**
 * Babel Starter Kit | https://github.com/kriasoft/babel-starter-kit
 * Copyright (c) Konstantin Tarkus <hello@tarkus.me> | The MIT License
 */

import { describe, it } from 'mocha';
import { expect } from 'chai';
import {Simulation} from '../src/Simulation';

describe('The simulation', () => {

  let sim = null;

  beforeEach(() => {

    sim = new Simulation({
      simulationOptions: {
        tickFrequency: 1000
      },
      buildingOptions: {
        name: 'QB',
        numFloors: 4,
        openingTime: 9,
        closingTime: 18,
        numElevators: 1,
        numPeople: 20
      },
      elevatorOptions: {
        maxSpeed: 0.5
      },
      personOptions: {
        startTime: 9,
        finishTime: 18
      }
    });

  });

  it('should be an object', function() {
    expect(typeof sim).to.be.equal('object');
  });

});

