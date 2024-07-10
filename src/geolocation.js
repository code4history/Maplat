import BaseEvent from 'ol/events/Event';
import BaseObject from 'ol/Object';
import { randomFromCenter } from "@maplat/core/lib/math_ex";
import {toRadians} from 'ol/math';

const Property = {
  ACCURACY: 'accuracy',
  ACCURACY_GEOMETRY: 'accuracyGeometry',
  ALTITUDE: 'altitude',
  ALTITUDE_ACCURACY: 'altitudeAccuracy',
  HEADING: 'heading',
  POSITION: 'position',
  PROJECTION: 'projection',
  SPEED: 'speed',
  TRACKING: 'tracking',
  TRACKING_OPTIONS: 'trackingOptions',
};

const GeolocationErrorType = {
  ERROR: 'error',
};

export class GeolocationError extends BaseEvent {
  constructor(error) {
    super(GeolocationErrorType.ERROR);
    this.code = error.code;
    this.message = error.message;
  }
}

export class Geolocation extends BaseObject {
  task_id_ = null;
  timer_base_ = false;

  constructor(options) {
    super();

    this.on;

    this.once;

    this.un;

    options = options || {};

    this.timer_base_ = options.timerBase !== undefined ? options.timerBase : false;

    this.task_id_ = undefined;

    this.home_position_ = options.homePosition !== undefined ? options.homePosition : false;

    this.addChangeListener(Property.TRACKING, this.handleTrackingChanged_);

    if (options.trackingOptions !== undefined) {
      this.setTrackingOptions(options.trackingOptions);
    } else {
      this.setTrackingOptions({
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 1000
      });
    }

    this.setTracking(options.tracking !== undefined ? options.tracking : false);
  }

  disposeInternal() {
    this.setTracking(false);
    super.disposeInternal();
  }

  handleTrackingChanged_() {
    if (this.timer_base_) {
      const tracking = this.getTracking();
      const trackingOptions = this.getTrackingOptions();
      if (tracking && this.task_id_ === undefined) {
        const allowGps = window.confirm("Allow GPS?");
        if (allowGps) {
          this.task_id_ = setInterval(this.timerPositionChange_.bind(this), trackingOptions.maximumAge);
        } else {
          this.timerPositionError_();
        }
      } else if (!tracking && this.task_id_ !== undefined) {
        clearInterval(this.task_id_);
        this.task_id_ = undefined;
      }
    } else {
      if ('geolocation' in navigator) {
        const tracking = this.getTracking();
        if (tracking && this.task_id_ === undefined) {
          this.task_id_ = navigator.geolocation.watchPosition(
            this.positionChange_.bind(this),
            this.positionError_.bind(this),
            this.getTrackingOptions(),
          );
        } else if (!tracking && this.task_id_ !== undefined) {
          navigator.geolocation.clearWatch(this.task_id_);
          this.task_id_ = undefined;
        }
      }
    }

  }

  timerPositionChange_() {
    const coords = {
      longitude: randomFromCenter(this.home_position_[0], 0.01),
      latitude: randomFromCenter(this.home_position_[1], 0.01),
      accuracy: randomFromCenter(15.0, 10)
    };
    this.positionChange_({coords});
  }

  positionChange_(position) {
    const coords = position.coords;
    this.set(Property.ACCURACY, coords.accuracy);
    this.set(
      Property.ALTITUDE,
      coords.altitude === null ? undefined : coords.altitude,
    );
    this.set(
      Property.ALTITUDE_ACCURACY,
      coords.altitudeAccuracy === null ? undefined : coords.altitudeAccuracy,
    );
    this.set(
      Property.HEADING,
      coords.heading === null ? undefined : toRadians(coords.heading),
    );
    this.set(Property.POSITION, [coords.longitude, coords.latitude]);
    this.set(Property.SPEED, coords.speed === null ? undefined : coords.speed);
    this.changed();
  }

  timerPositionError_() {
    const code = Math.floor(Math.random() * 3) + 1;
    const error = {
      code,
      message: code === 1 ? "User denied Geolocation" : code === 2 ? "Position unavailable" : "Timeout expired"
    }
    this.positionError_(error);
  }

  positionError_(error) {
    this.dispatchEvent(new GeolocationError(error));
  }

  getAccuracy() {
    return (this.get(Property.ACCURACY));
  }

  getAltitude() {
    return (this.get(Property.ALTITUDE));
  }

  getAltitudeAccuracy() {
    return (this.get(Property.ALTITUDE_ACCURACY));
  }

  getHeading() {
    return (this.get(Property.HEADING));
  }

  getPosition() {
    return (this.get(Property.POSITION));
  }

  getSpeed() {
    return (this.get(Property.SPEED));
  }

  getTracking() {
    return (this.get(Property.TRACKING));
  }

  getTrackingOptions() {
    return (this.get(Property.TRACKING_OPTIONS));
  }

  setTracking(tracking) {
    this.set(Property.TRACKING, tracking);
  }

  setTrackingOptions(options) {
    this.set(Property.TRACKING_OPTIONS, options);
  }
};